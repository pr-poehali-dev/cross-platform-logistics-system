"""
CRUD заявок на перевозку.
Справочники, валидация этапов, автозаполнение полей из профиля пользователя.
"""
import json, os
import psycopg2

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

# stage: минимальный этап, который должен быть достигнут, чтобы роль могла редактировать
STAGE_UNLOCK = {
    "ppb":      1,   # доступно с этапа 1
    "tc":       2,   # после ППБ (этап 2)
    "tc_master": 3,  # после ТЦ (этап 3)
    "driver":   4,   # после назначения водителя
    "sender":   5,   # после этапа 5 (водитель заполнил пп.11,12)
    "receiver": 7,   # после этапа 7 (водитель заполнил пп.15,16)
    "shop_chief": 1, # создатель — всегда
    "admin":    0,   # без ограничений
}

ROLE_FIELDS = {
    "ppb":      {"priority"},
    "tc":       {"vehicle_id", "vehicle_model"},
    "tc_master": {"driver_name", "driver_id"},
    "driver":   {"arrival_load_time", "load_start_time",
                 "arrival_unload_time", "unload_start_time"},
    "sender":   {"departure_load_time", "sender_sign"},
    "receiver": {"departure_unload_time", "receiver_sign", "done"},
    "shop_chief": {"note"},
    "admin":    {
        "cargo_type_id", "cargo_name", "quantity", "execution_date",
        "load_location_id", "load_place", "unload_location_id", "unload_place",
        "priority", "vehicle_id", "vehicle_model", "driver_name", "driver_id",
        "arrival_load_time", "load_start_time", "departure_load_time", "sender_sign",
        "arrival_unload_time", "unload_start_time", "departure_unload_time",
        "receiver_sign", "note", "done"
    },
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token, cur):
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.name, u.role, u.department_id, d.name as dept_name
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
            WHERE s.token = %s""",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "role": row[2],
            "department_id": row[3], "department_name": row[4] or ""}

def log_action(cur, user, action, target):
    cur.execute(
        f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, target) VALUES (%s, %s, %s, %s)",
        (user["id"], user["name"], action, target)
    )

def next_order_num(cur):
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders")
    count = cur.fetchone()[0]
    return f"ЗПВ-{str(count + 1).zfill(4)}"

def compute_stage(o: dict) -> int:
    """Вычисляет текущий этап по заполненным полям"""
    if o.get("done"):                  return 9
    if o.get("receiver_sign"):         return 9
    if o.get("unload_start_time"):     return 8
    if o.get("arrival_unload_time"):   return 8
    if o.get("departure_load_time"):   return 7
    if o.get("sender_sign"):           return 7
    if o.get("load_start_time"):       return 6
    if o.get("arrival_load_time"):     return 6
    if o.get("driver_name"):           return 5
    if o.get("vehicle_model") or o.get("vehicle_id"): return 4
    if o.get("priority") is not None:  return 3
    if o.get("applicant_name"):        return 2
    return 1

def fetch_order_dict(cur, order_id):
    cur.execute(f"""
        SELECT id, order_num, department, department_id, applicant_name, cargo_name, cargo_type_id,
               quantity, execution_date::text, load_place, load_location_id, unload_place, unload_location_id,
               priority, vehicle_model, vehicle_id, driver_name, driver_id,
               arrival_load_time, load_start_time, departure_load_time, sender_sign,
               arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
               note, done, created_by, stage,
               to_char(created_at, 'DD.MM.YYYY') as created_date
        FROM {SCHEMA}.orders WHERE id = %s
    """, (order_id,))
    cols = [d[0] for d in cur.description]
    row = cur.fetchone()
    if not row:
        return None
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

    # ── GET ?action=refs — справочники для форм ──────────────────────────────
    if method == "GET" and action == "refs":
        cur.execute(f"SELECT id, name FROM {SCHEMA}.departments ORDER BY name")
        departments = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.cargo_types ORDER BY name")
        cargo_types = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.locations ORDER BY name")
        locations = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.vehicles ORDER BY name")
        vehicles = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        # водители (для мастера ТЦ)
        cur.execute(f"SELECT id, name FROM {SCHEMA}.users WHERE role = 'driver' ORDER BY name")
        drivers = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"departments": departments, "cargo_types": cargo_types,
             "locations": locations, "vehicles": vehicles, "drivers": drivers},
            ensure_ascii=False
        )}

    # ── GET ?action=list — список заявок ─────────────────────────────────────
    if method == "GET" and action == "list":
        # Водитель видит только свои заявки
        if user and user["role"] == "driver":
            cur.execute(f"""
                SELECT id, order_num, department, applicant_name, cargo_name, quantity,
                       execution_date::text, load_place, unload_place, priority,
                       vehicle_model, driver_name, driver_id,
                       arrival_load_time, load_start_time, departure_load_time, sender_sign,
                       arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
                       note, done, created_by, stage,
                       to_char(created_at, 'DD.MM.YYYY') as created_date
                FROM {SCHEMA}.orders
                WHERE driver_id = %s
                ORDER BY created_at DESC
            """, (user["id"],))
        else:
            cur.execute(f"""
                SELECT id, order_num, department, applicant_name, cargo_name, quantity,
                       execution_date::text, load_place, unload_place, priority,
                       vehicle_model, driver_name, driver_id,
                       arrival_load_time, load_start_time, departure_load_time, sender_sign,
                       arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
                       note, done, created_by, stage,
                       to_char(created_at, 'DD.MM.YYYY') as created_date
                FROM {SCHEMA}.orders
                ORDER BY priority ASC NULLS LAST, created_at DESC
            """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps(rows, ensure_ascii=False, default=str)}

    # ── POST ?action=create — создать заявку (shop_chief, admin) ─────────────
    if method == "POST" and action == "create":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}
        if user["role"] not in ("shop_chief", "admin"):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав для создания заявки"})}

        body = json.loads(event.get("body") or "{}")
        order_num = next_order_num(cur)

        # col1, col2 — автоматически из профиля
        department = user["department_name"]
        applicant_name = user["name"]

        # col3 — груз из справочника
        cargo_type_id = body.get("cargo_type_id")
        cargo_name = body.get("cargo_name", "")
        if cargo_type_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.cargo_types WHERE id = %s", (cargo_type_id,))
            r = cur.fetchone()
            if r:
                cargo_name = r[0]

        # col6,7 — место из справочника
        load_location_id = body.get("load_location_id")
        unload_location_id = body.get("unload_location_id")
        load_place = ""
        unload_place = ""
        if load_location_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.locations WHERE id = %s", (load_location_id,))
            r = cur.fetchone()
            if r: load_place = r[0]
        if unload_location_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.locations WHERE id = %s", (unload_location_id,))
            r = cur.fetchone()
            if r: unload_place = r[0]

        quantity = body.get("quantity", "")
        execution_date = body.get("execution_date") or None
        note = body.get("note", "")

        cur.execute(
            f"""INSERT INTO {SCHEMA}.orders
                (order_num, department, department_id, applicant_name,
                 cargo_name, cargo_type_id, quantity, execution_date,
                 load_place, load_location_id, unload_place, unload_location_id,
                 note, created_by, stage)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
                RETURNING id""",
            (order_num, department, user["department_id"], applicant_name,
             cargo_name, cargo_type_id, quantity, execution_date,
             load_place, load_location_id, unload_place, unload_location_id,
             note, user["id"])
        )
        new_id = cur.fetchone()[0]
        log_action(cur, user, "Создал заявку", order_num)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"id": new_id, "order_num": order_num})}

    # ── POST ?action=update — обновить поля по роли ───────────────────────────
    if method == "POST" and action == "update":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

        body = json.loads(event.get("body") or "{}")
        order_id = body.get("id")
        if not order_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не указан id заявки"})}

        # Получаем текущее состояние заявки
        order = fetch_order_dict(cur, order_id)
        if not order:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заявка не найдена"})}

        current_stage = order.get("stage") or compute_stage(order)

        # Проверка доступа для водителя — только свои заявки
        if user["role"] == "driver" and order.get("driver_id") != user["id"]:
            conn.close()
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": "Водитель может редактировать только свои заявки"})}

        # Проверка минимального этапа для роли
        min_stage = STAGE_UNLOCK.get(user["role"], 99)
        if current_stage < min_stage:
            conn.close()
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": f"Заявка ещё не достигла этапа доступного для вашей роли. Текущий этап: {current_stage}"})}

        allowed = ROLE_FIELDS.get(user["role"], set())
        fields_to_update = {k: v for k, v in body.items() if k in allowed and k != "id"}

        # Автозаполнение подписи — если роль sender или receiver, подпись = имя пользователя
        if user["role"] == "sender" and "sender_sign" not in fields_to_update:
            fields_to_update["sender_sign"] = user["name"]
        if user["role"] == "receiver" and "receiver_sign" not in fields_to_update:
            fields_to_update["receiver_sign"] = user["name"]

        # Если ТЦ выбирает технику — обновляем текстовое название
        if "vehicle_id" in fields_to_update and fields_to_update["vehicle_id"]:
            cur.execute(f"SELECT name FROM {SCHEMA}.vehicles WHERE id = %s", (fields_to_update["vehicle_id"],))
            r = cur.fetchone()
            if r:
                fields_to_update["vehicle_model"] = r[0]

        # Если мастер назначает водителя по id — записываем имя
        if "driver_id" in fields_to_update and fields_to_update["driver_id"]:
            cur.execute(f"SELECT name FROM {SCHEMA}.users WHERE id = %s", (fields_to_update["driver_id"],))
            r = cur.fetchone()
            if r:
                fields_to_update["driver_name"] = r[0]

        if not fields_to_update:
            conn.close()
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": "Нет доступных полей для вашей роли"})}

        # Пересчитываем этап
        merged = {**order, **fields_to_update}
        new_stage = compute_stage(merged)
        fields_to_update["stage"] = new_stage

        set_clause = ", ".join(f"{k} = %s" for k in fields_to_update)
        values = list(fields_to_update.values()) + [order_id]
        cur.execute(
            f"UPDATE {SCHEMA}.orders SET {set_clause}, updated_at = NOW() WHERE id = %s", values
        )
        log_action(cur, user, f"Обновил поля: {', '.join(k for k in fields_to_update if k != 'stage')}", order["order_num"])
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "stage": new_stage})}

    # ── GET ?action=logs — история ────────────────────────────────────────────
    if method == "GET" and action == "logs":
        cur.execute(
            f"""SELECT user_name, action, target, to_char(created_at, 'DD.MM HH24:MI') as time
                FROM {SCHEMA}.action_logs ORDER BY created_at DESC LIMIT 100"""
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps(rows, ensure_ascii=False)}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
