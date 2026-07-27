from datetime import datetime, date
from typing import Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator

# ==========================================
# 👤 SCHEMAS DE USUARIO Y AUTENTICACIÓN
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    role: Optional[str] = "doctor"

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ==========================================
# 🃏 SCHEMAS DE TARJETAS / CARDS
# ==========================================

class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="El título es obligatorio")
    description: Optional[str] = None
    position: int = Field(default=1, ge=1, description="Posición para ordenación")
    due_date: Optional[datetime] = None

class CardCreate(CardBase):
    # Acepta enteros o cadenas para ser compatible con IDs numéricos o dinámicos
    list_id: Union[int, str] 

class CardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    position: Optional[int] = Field(None, ge=1)
    list_id: Optional[Union[int, str]] = None
    due_date: Optional[datetime] = None

class CardResponse(CardBase):
    id: int
    list_id: Union[int, str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CardMove(BaseModel):
    list_id: Union[int, str]
    position: int = Field(..., ge=1)


# ==========================================
# ⏱️ SCHEMAS DE HOJA DE TIEMPO / WORKLOGS
# ==========================================

class WorkLogBase(BaseModel):
    card_id: int
    hours: float = Field(..., ge=0.25, description="Mínimo de 0.25 horas")
    date: date
    note: Optional[str] = Field(None, max_length=200, description="Nota de máximo 200 caracteres")

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("No se pueden registrar horas en fechas futuras.")
        return v

class WorkLogCreate(WorkLogBase):
    pass

class WorkLogUpdate(BaseModel):
    hours: Optional[float] = Field(None, ge=0.25)
    date: Optional[date] = None
    note: Optional[str] = Field(None, max_length=200)

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: Optional[date]) -> Optional[date]:
        if v and v > date.today():
            raise ValueError("No se pueden registrar horas en fechas futuras.")
        return v

class WorkLogResponse(WorkLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True