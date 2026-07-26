from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Comprobar si el email ya está registrado
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo electrónico ya está registrado."
        )
    
    # 2. Encriptar la contraseña del usuario
    hashed_password = security.get_password_hash(user_in.password)
    
    # 3. Crear el nuevo usuario en la base de datos
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=schemas.Token)
def login_user(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Buscar al usuario por su email
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña no válidos)."
        )
    
    # 2. Verificar si la contraseña coincide con el hash guardado
    if not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña no válidos)."
        )
    
    # 3. Si todo es correcto, generamos su pase de acceso digital (Token JWT)
    access_token = security.create_access_token(subject=user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }