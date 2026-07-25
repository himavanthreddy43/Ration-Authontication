import psycopg2
import sys

db_url = "postgresql://postgres:Himavanthreddy%401@db.vcbaziyjplhtzbqxpsto.supabase.co:5432/postgres"

try:
    print("Attempting to connect to Supabase database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    result = cur.fetchone()
    print("Connection successful! Query result:", result)
    cur.close()
    conn.close()
    sys.exit(0)
except Exception as e:
    print("Connection failed!")
    print("Error:", str(e))
    sys.exit(1)
