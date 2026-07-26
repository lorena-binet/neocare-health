from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# ==========================================
# 👤 SCHEMAS DE USUARIO Y AUTENTICACIÓN
# ==========================================

# Esquema base para los datos comunes de un usuario
class UserBase(BaseModel):
    email: EmailStr
    role: Optional[str] = "doctor"

    class Config:
        from_attributes = True

# Datos necesarios para crear un usuario (Registro)
class UserCreate(UserBase):
    password: str

# Datos que devolvemos cuando alguien consulta un usuario (sin la contraseña)
class UserResponse(UserBase):
    id: int
    is_active: bool

# Estructura obligatoria para hacer login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Estructura del token que le devolvemos al frontend tras un login con éxito
class Token(BaseModel):
    access_token: str
    token_type: str

# Datos que viajan encriptados dentro del token
class TokenData(BaseModel):
    email: Optional[str] = None


# ==========================================
# 🃏 SCHEMAS DE TARJETAS (CARDS)
# ==========================================

# Datos base para validar entradas
class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="El título es obligatorio (máx 100 caracteres)")
    description: Optional[str] = None
    position: int = Field(default=1, ge=1)
    due_date: Optional[datetime] = None  # Fecha de vencimiento

class CardCreate(CardBase):
    list_id: int  # La columna a la que pertenece al crearse

class CardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    position: Optional[int] = Field(None, ge=1)
    list_id: Optional[int] = None  # Útil para mover de columna
    due_date: Optional[datetime] = None

class CardResponse(CardBase):
    id: int
    list_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CardMove(BaseModel):
    list_id: int
    position: int = Field(..., ge=1)