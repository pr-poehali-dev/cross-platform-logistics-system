"""CRUD заявок на перевозку + история действий"""
import json, os
import psycopg2
import psycopg2.extras

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

# Поля, которые каждая роль может редактировать
ROLE_FIELDS = {
    "shop_chief": {"department", "applicant_name"},
    "ppb":        {"cargo_name", "quantity", "request_time", "load_place", "unload_place", "priority"},
    "tc":         {"vehicle_model", "driver_name", "driver_id"},
    "tc_master":  set(),  # только утверждение (done-flow)
    "driver":     {"arrival_load_time", "load_start_time", "departure_load_time",
                   "arrival_unload_time", "unload_start_time", "departure_unload_time"},
    "sender":     {"sender_sign"},
    "receiver":   {"receiver_sign", "done"},
    "admin":      {"department", "applicant_name", "cargo_name", "quantity", "request_time",
                   "load_place", "unload_place", "priority", "vehicle_model", "driver_name",
                   "driver_id", "arrival_load_time", "load_start_time", "departure_load_time",
                   "sender_sign", "arrival_unload_time", "unload_start_time", "departure_unload_time",
                   "receiver_sign", "note", "done"},
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token: str, cur):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "role": row[2]}

def log_action(cur, user, action: str, target: str):
    cur.execute(
        f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, target) VALUES (%s, %s, %s, %s)",
        (user["id"], user["name"], action, target)
    )

def next_order_num(cur) -> str:
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders")
    count = cur.fetchone()[0]
    return f"ЗПВ-{str(count + 1).zfill(4)}"

def order_to_dict(row, cols) -> dict:
    return dict(zip(cols, row))

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "list")
    token = event.get("headers", {}).get("x-auth-token", "")

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(token, cur)

    # GET ?action=list — список заявок
    if method == "GET" and action == "list":
        cur.execute(f"""
            SELECT id, order_num, department, applicant_name, cargo_name, quantity,
                   request_time, load_place, unload_place, priority,
                   vehicle_model, driver_name, driver_id,
                   arrival_load_time, load_start_time, departure_load_time, sender_sign,
                   arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
                   note, done, created_by,
                   to_char(created_at, 'DD.MM.YYYY') as created_date
            FROM {SCHEMA}.orders
            ORDER BY created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [order_to_dict(r, cols) for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(rows, ensure_ascii=False, default=str)}

    # POST ?action=create — создать заявку (только shop_chief или admin)
    if method == "POST" and action == "create":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}
        if user["role"] not in ("shop_chief", "admin"):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав для создания заявки"})}

        body = json.loads(event.get("body") or "{}")
        order_num = next_order_num(cur)
        cur.execute(
            f"""INSERT INTO {SCHEMA}.orders
                (order_num, department, applicant_name, created_by)
                VALUES (%s, %s, %s, %s) RETURNING id""",
            (order_num, body.get("department", ""), body.get("applicant_name", ""), user["id"])
        )
        new_id = cur.fetchone()[0]
        log_action(cur, user, "Создал заявку", order_num)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "order_num": order_num})}

    # POST ?action=update — обновить поля своей роли
    if method == "POST" and action == "update":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

        body = json.loads(event.get("body") or "{}")
        order_id = body.get("id")
        allowed = ROLE_FIELDS.get(user["role"], set())
        fields_to_update = {k: v for k, v in body.items() if k in allowed}

        if not fields_to_update or not order_id:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступных полей для вашей роли"})}

        set_clause = ", ".join(f"{k} = %s" for k in fields_to_update)
        values = list(fields_to_update.values()) + [order_id]
        cur.execute(
            f"UPDATE {SCHEMA}.orders SET {set_clause}, updated_at = NOW() WHERE id = %s",
            values
        )
        cur.execute(f"SELECT order_num FROM {SCHEMA}.orders WHERE id = %s", (order_id,))
        row = cur.fetchone()
        order_num = row[0] if row else f"id={order_id}"
        log_action(cur, user, f"Обновил поля: {', '.join(fields_to_update.keys())}", order_num)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # GET ?action=logs — история действий
    if method == "GET" and action == "logs":
        cur.execute(
            f"""SELECT user_name, action, target, to_char(created_at, 'DD.MM HH24:MI') as time
                FROM {SCHEMA}.action_logs ORDER BY created_at DESC LIMIT 100"""
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(rows, ensure_ascii=False)}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}