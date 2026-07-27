from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# ==============================================================================
# 1. ENTIDAD USUARIOS
# ==============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="doctor") # Rol por defecto para la app médica
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Marca de tiempo con DateTime de SQLAlchemy

    # Relaciones ORM
    boards = relationship("Board", back_populates="owner", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="user", cascade="all, delete-orphan")


# ==============================================================================
# 2. ENTIDAD TABLEROS (BOARDS)
# ==============================================================================
class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones ORM
    owner = relationship("User", back_populates="boards")
    lists = relationship("List", back_populates="board", cascade="all, delete-orphan", order_by="List.position")


# ==============================================================================
# 3. ENTIDAD LISTAS / COLUMNAS
# ==============================================================================
class List(Base):
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=1)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones ORM
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan", order_by="Card.position")


# ==============================================================================
# 4. ENTIDAD TARJETAS (CARDS) - Punto 7
# ==============================================================================
class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)                         # Título obligatorio
    description = Column(Text, nullable=True)                    # Descripción opcional
    position = Column(Integer, nullable=False, default=1)        # Orden visual en la columna
    list_id = Column(Integer, ForeignKey("lists.id"), nullable=False) # Columna a la que pertenece
    
    # --- CAMPOS DE TIEMPO Y VENCIMIENTO (Punto 7) ---
    due_date = Column(DateTime, nullable=True)                   # Fecha de vencimiento para alertas visuales
    created_at = Column(DateTime, default=datetime.utcnow)       # Marca de tiempo de creación (DateTime correcto con T mayúscula)
    updated_at = Column(DateTime, nullable=True)                 # Marca de tiempo de actualización tras editar

    # Relaciones ORM
    list = relationship("List", back_populates="cards")
    work_logs = relationship("WorkLog", back_populates="card", cascade="all, delete-orphan")


# ==============================================================================
# 5. ENTIDAD REGISTRO DE TRABAJO (WORK LOGS)
# ==============================================================================
class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hours = Column(Float, nullable=False)
    date = Column(Date, nullable=False)  # 👈 Cambiado a Date para filtrar semanas limpiamente
    note = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones ORM
    card = relationship("Card", back_populates="work_logs")
    user = relationship("User", back_populates="work_logs")