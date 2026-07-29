from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User, Board, List  # <-- Asegúrate de importar Board y List aquí
from app.schemas import UserCreate, Token
from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_data.email.strip().lower()
    
    # 1. Comprobar si ya existe
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado."
        )

    # 2. Crear hash de la contraseña y guardar usuario
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=email_clean,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. CREAR AUTOMÁTICAMENTE EL TABLERO POR DEFECTO PARA EL NUEVO USUARIO
    default_board = Board(
        title="Mi Tablero Principal",
        description="Tablero inicial",
        owner_id=new_user.id
    )
    db.add(default_board)
    db.commit()
    db.refresh(default_board)
    
    # 4. CREAR LAS 4 LISTAS POR DEFECTO EN ESE TABLERO
    default_lists = ["Pendiente", "En Progreso", "Revisión", "Listo"]
    for index, list_title in enumerate(default_lists):
        new_list = List(
            title=list_title,
            position=index + 1,
            board_id=default_board.id
        )
        db.add(new_list)
    
    db.commit()
    
    return {"message": "Usuario creado correctamente", "email": new_user.email}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_clean = form_data.username.strip().lower()
    
    # 1. Buscar usuario
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Validar contraseña
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generar token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email,
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}