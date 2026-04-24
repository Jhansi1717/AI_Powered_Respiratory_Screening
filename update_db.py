import sqlite3
import os

db_path = r"c:\Users\Bhukya Jhansi\Downloads\DLASSIGN\respiratory-ai\backend\app\test.db"

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';")
        conn.commit()
        print("✅ Added 'role' column to 'users' table.")
        
        # Also make the first user an admin for testing convenience
        cursor.execute("UPDATE users SET role = 'admin' WHERE id = 1;")
        conn.commit()
        print("✅ Promoted first user to 'admin'.")
        
        conn.close()
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("ℹ️ Column 'role' already exists.")
        else:
            print(f"❌ Error: {e}")
else:
    print(f"❌ Database not found at {db_path}")
