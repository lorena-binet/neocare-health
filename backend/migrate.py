import sqlite3
from sqlalchemy import create_engine, text

SQLITE_PATH = "neocare.db" 
NEON_URL = "postgresql://neondb_owner:npg_WbCxuIdoY25i@ep-dawn-heart-av1jkpqz-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

neon_engine = create_engine(NEON_URL)

def clean_row_data(row_dict):
    cleaned = dict(row_dict)
    for key, value in cleaned.items():
        if key == "is_active" and value is not None:
            cleaned[key] = bool(value)
    return cleaned

def migrate_users():
    print("Migrando usuarios...")
    sqlite_cursor.execute("SELECT * FROM users")
    users = sqlite_cursor.fetchall()
    
    if not users:
        print("No se encontraron usuarios en SQLite.")
        return

    columns = users[0].keys()
    columns_str = ", ".join(columns)
    placeholders = ", ".join([f":{col}" for col in columns])
    
    with neon_engine.begin() as neon_conn:
        # Opcional: limpiamos usuarios antiguos en Neon para evitar conflictos de IDs viejos
        neon_conn.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
        
        for user in users:
            row_dict = clean_row_data(user)
            query = text(f"""
                INSERT INTO users ({columns_str}) 
                VALUES ({placeholders})
                ON CONFLICT (email) DO UPDATE SET 
                    hashed_password = EXCLUDED.hashed_password,
                    role = EXCLUDED.role,
                    is_active = EXCLUDED.is_active;
            """)
            neon_conn.execute(query, row_dict)
    print(f"¡{len(users)} usuarios procesados correctamente!")

def migrate_table(table_name):
    print(f"Migrando tabla {table_name}...")
    try:
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"La tabla {table_name} está vacía.")
            return

        columns = rows[0].keys()
        columns_str = ", ".join(columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        
        with neon_engine.begin() as neon_conn:
            # Vaciamos la tabla en Neon antes de rellenarla con los datos limpios de local
            try:
                neon_conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;"))
            except Exception:
                pass # Por si alguna tabla no soporta truncate directo

            for row in rows:
                row_dict = clean_row_data(row)
                query = text(f"""
                    INSERT INTO {table_name} ({columns_str}) 
                    VALUES ({placeholders})
                    ON CONFLICT (id) DO NOTHING;
                """)
                neon_conn.execute(query, row_dict)
        print(f"¡{len(rows)} registros procesados en {table_name}!")
    except Exception as e:
        print(f"Aviso al migrar {table_name}: {e}")

if __name__ == "__main__":
    try:
        # Migramos en orden correcto para respetar las llaves foráneas
        migrate_users()
        for tabla in ["boards", "lists", "cards", "work_logs", "reports"]:
            migrate_table(tabla)
        print("\n¡Migración completa y sincronizada con éxito!")
    except Exception as e:
        print(f"Error durante la migración general: {e}")
    finally:
        sqlite_conn.close()