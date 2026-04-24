"""
Администрирование: CRUD справочников (грузы, места, техника, подразделения) и пользователей.
Доступно только роли admin.
"""
import json, os, secrets
import psycopg2

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

ROLE_CHOICES = ["shop_chief", "ppb", "tc", "tc_master", "driver", "sender", "receiver", "admin"]

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token, cur):
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

def require_admin(user):
    return user and user["role"] == "admin"

def rows_to_list(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    resource = qs.get("resource", "")   # cargo_types | locations | vehicles | departments | users
    action = qs.get("action", "list")   # list | add | edit | delete
    token = event.get("headers", {}).get("x-auth-token", "")

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(token, cur)

    if not require_admin(user):
        conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для администратора"})}

    body = json.loads(event.get("body") or "{}") if method == "POST" else {}

    # ── Справочные таблицы: cargo_types, locations, vehicles, departments ───
    SIMPLE_TABLES = {
        "cargo_types":   f"{SCHEMA}.cargo_types",
        "locations":     f"{SCHEMA}.locations",
        "vehicles":      f"{SCHEMA}.vehicles",
        "departments":   f"{SCHEMA}.departments",
    }

    if resource in SIMPLE_TABLES:
        table = SIMPLE_TABLES[resource]

        if action == "list":
            cur.execute(f"SELECT id, name FROM {table} ORDER BY name")
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows_to_list(cur), ensure_ascii=False)}

        if action == "add" and method == "POST":
            name = body.get("name", "").strip()
            if not name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название не может быть пустым"})}
            cur.execute(f"INSERT INTO {table} (name) VALUES (%s) RETURNING id, name", (name,))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"id": row[0], "name": row[1]})}

        if action == "edit" and method == "POST":
            item_id = body.get("id")
            name = body.get("name", "").strip()
            if not item_id or not name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужны id и name"})}
            cur.execute(f"UPDATE {table} SET name = %s WHERE id = %s", (name, item_id))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "delete" and method == "POST":
            item_id = body.get("id")
            if not item_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id"})}
            cur.execute(f"DELETE FROM {table} WHERE id = %s", (item_id,))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── Пользователи ──────────────────────────────────────────────────────────
    if resource == "users":
        if action == "list":
            cur.execute(f"""
                SELECT u.id, u.name, u.login, u.role, u.department_id, d.name as dept_name
                FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
                ORDER BY u.role, u.name
            """)
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows_to_list(cur), ensure_ascii=False)}

        if action == "add" and method == "POST":
            name = body.get("name", "").strip()
            login = body.get("login", "").strip()
            password = body.get("password", "").strip()
            role = body.get("role", "").strip()
            department_id = body.get("department_id") or None

            if not name or not login or not password or role not in ROLE_CHOICES:
                conn.close()
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Заполните все обязательные поля (name, login, password, role)"})}

            # Проверка уникальности логина
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s", (login,))
            if cur.fetchone():
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Логин уже занят"})}

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, login, password_hash, role, department_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (name, login, password, role, department_id)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id})}

        if action == "edit" and method == "POST":
            user_id = body.get("id")
            if not user_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id"})}

            updates = {}
            if body.get("name"): updates["name"] = body["name"].strip()
            if body.get("role") and body["role"] in ROLE_CHOICES: updates["role"] = body["role"]
            if body.get("department_id") is not None: updates["department_id"] = body["department_id"] or None
            if body.get("password"): updates["password_hash"] = body["password"].strip()

            if not updates:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет полей для обновления"})}

            set_clause = ", ".join(f"{k} = %s" for k in updates)
            cur.execute(f"UPDATE {SCHEMA}.users SET {set_clause} WHERE id = %s", list(updates.values()) + [user_id])
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "delete" and method == "POST":
            user_id = body.get("id")
            if not user_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id"})}
            # Удаляем сессии пользователя перед удалением
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = %s", (user_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
