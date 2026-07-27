import sys
import os
from datetime import date, timedelta

# Asegurar que Python pueda encontrar el paquete 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, User, Board, List, Card, WorkLog
from app.security import get_password_hash

def seed_data():
    print("🌱 Iniciando la carga de datos demo...")
    
    # Crear tablas en la base de datos si no existen
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Crear Usuario Demo
        user = db.query(User).filter(User.email == "doctor@ejemplo.com").first()
        if not user:
            user = User(
                email="doctor@ejemplo.com",
                hashed_password=get_password_hash("password123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("👤 Usuario demo creado: doctor@ejemplo.com / password123")
        else:
            print("👤 El usuario demo (doctor@ejemplo.com) ya existe.")

        # 2. Crear Tablero Principal
        board = db.query(Board).filter(Board.owner_id == user.id).first()
        if not board:
            board = Board(title="Tablero Principal - Proyecto TFG", owner_id=user.id)
            db.add(board)
            db.commit()
            db.refresh(board)

            # Crear las 4 Columnas del flujo de trabajo por defecto
            list_backlog = List(title="Backlog", board_id=board.id, position=0)
            list_in_progress = List(title="En Progreso", board_id=board.id, position=1)
            list_review = List(title="Revisión", board_id=board.id, position=2)
            list_done = List(title="Listo", board_id=board.id, position=3)

            db.add_all([list_backlog, list_in_progress, list_review, list_done])
            db.commit()
            db.refresh(list_backlog)
            db.refresh(list_in_progress)
            db.refresh(list_done)

            print("📋 Tablero y listas (Backlog, En Progreso, Revisión, Listo) creadas.")

            # 3. Crear Tarjetas de prueba (sin board_id)
            today = date.today()
            card1 = Card(
                title="Configurar arquitectura de producción",
                description="Preparar despliegues en Render y Vercel.",
                list_id=list_in_progress.id,
                position=0,
                due_date=today + timedelta(days=2)
            )
            card2 = Card(
                title="Diseñar esquema de base de datos",
                description="Modelos SQLAlchemy para User, Board, Card y WorkLog.",
                list_id=list_done.id,
                position=0,
                due_date=today - timedelta(days=1)
            )
            card3 = Card(
                title="Documentación de API y QA",
                description="Redactar el archivo QA.md y el README final.",
                list_id=list_backlog.id,
                position=0,
                due_date=today + timedelta(days=5)
            )

            db.add_all([card1, card2, card3])
            db.commit()
            db.refresh(card1)
            db.refresh(card2)

            # 4. Crear Registros de Trabajo (WorkLogs de prueba)
            log1 = WorkLog(
                hours=2.5,
                date=today,
                note="Configuración del middleware CORS y seguridad JWT.",
                card_id=card1.id,
                user_id=user.id
            )
            log2 = WorkLog(
                hours=4.0,
                date=today - timedelta(days=1),
                note="Creación de modelos y migraciones iniciales de SQLite.",
                card_id=card2.id,
                user_id=user.id
            )

            db.add_all([log1, log2])
            db.commit()
            print("⏱️ Tarjetas y horas de prueba cargadas correctamente.")

        else:
            print("📋 El tablero ya contiene datos creados anteriormente.")

        print("🚀 ¡Base de datos cargada y lista para probar!")

    except Exception as e:
        print(f"❌ Error durante la ejecución del seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()