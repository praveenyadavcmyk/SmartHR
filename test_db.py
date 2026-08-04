import pymysql

try:
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="HAPAS2.0",
        database="smart_employee_db",
        port=3306
    )

    print("✅ Connected successfully!")

    conn.close()

except Exception as e:
    print("❌ Connection failed")
    print(e)