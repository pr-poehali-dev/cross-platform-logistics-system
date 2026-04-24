"""Авторизация: вход, проверка токена, возврат данных пользователя включая подразделение"""
import json, os, secrets
import psycopg2

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "login")

    # POST — вход
    if method == "POST" and action == "login":
        body = json.loads(event.get("body") or "{}")
        login = body.get("login", "").strip()
        password = body.get("password", "").strip()

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT u.id, u.name, u.role, u.password_hash, u.department_id, d.name as dept_name
                FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
                WHERE u.login = %s""",
            (login,)
        )
        row = cur.fetchone()
        if not row or row[3] != password:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}

        user_id, name, role, _, dept_id, dept_name = row
        token = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)",
            (token, user_id)
        )
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "token": token,
                "user": {
                    "id": user_id, "name": name, "role": role,
                    "department_id": dept_id, "department_name": dept_name or ""
                }
            })
        }

    # GET ?action=me — проверка сессии
    if method == "GET" and action == "me":
        token = qs.get("_token", "")
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT u.id, u.name, u.role, u.department_id, d.name as dept_name
                FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id = s.user_id
                LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
                WHERE s.token = %s""",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Токен недействителен"})}

        user_id, name, role, dept_id, dept_name = row
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "user": {
                    "id": user_id, "name": name, "role": role,
                    "department_id": dept_id, "department_name": dept_name or ""
                }
            })
        }

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}