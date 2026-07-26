import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Usaremos SQLite por simplicidad para el desarrollo local
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./neocare.db")

# El motor de la base de datos
engine = create_engine(
    DATABASE_URL, 
    # check_same_thread es necesario solo para SQLite
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Creamos una fábrica de sesiones para interactuar con la DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La clase base de la que heredarán nuestros modelos (tablas) de la DB
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()