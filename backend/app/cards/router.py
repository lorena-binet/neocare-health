from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

# Importamos la conexión a la BD, los modelos SQLAlchemy y los esquemas Pydantic
from app.database import get_db
from app import models, schemas

# CORRECCIÓN DE IMPORTACIÓN: Importamos security de forma independiente para evitar errores circulares
from app.security import get_current_user 

# Creación del router para gestionar las rutas de las tarjetas
router = APIRouter(
    prefix="/cards",
    tags=["Tarjetas"]
)


# ==============================================================================
# 1. CREAR UNA NUEVA TARJETA (Puntos 7 y 8)
# ==============================================================================
@router.post("", response_model=schemas.CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    card_in: schemas.CardCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Exigimos Token JWT activo
):
    """
    Crea una tarjeta dentro de una lista/columna específica.
    Ruta protegida: solo accesible para usuarios autenticados.
    """
    # 1. Verificamos que la columna/lista donde se quiere meter la tarjeta realmente exista
    db_list = db.query(models.List).filter(models.List.id == card_in.list_id).first()
    if not db_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="La lista o columna especificada no existe."
        )

    # 2. Instanciamos el modelo de la tarjeta con los datos recibidos
    new_card = models.Card(
        title=card_in.title,            # Título (validado en schemas.py para no estar vacío)
        description=card_in.description, # Descripción opcional
        position=card_in.position,      # Orden de la tarjeta dentro de la columna
        list_id=card_in.list_id,        # ID de la columna contenedora
        due_date=card_in.due_date       # Fecha de vencimiento opcional
    )

    # 3. Guardamos la nueva tarjeta en la base de datos
    db.add(new_card)
    db.commit()
    db.refresh(new_card)

    return new_card


# ==============================================================================
# 2. EDITAR O MOVER UNA TARJETA (Puntos 7, 8 y 9)
# ==============================================================================
@router.put("/{card_id}", response_model=schemas.CardResponse)
def update_card(
    card_id: int, 
    card_in: schemas.CardUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Modifica el título, descripción, fecha de vencimiento, orden o mueve la tarjeta de lista.
    Actualiza automáticamente la fecha 'updated_at'.
    """
    # 1. Buscamos la tarjeta en la BD por su ID
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="La tarjeta especificada no fue encontrada."
        )

    # 2. Convertimos el schema Pydantic en un diccionario extrayendo solo los campos enviados
    try:
        update_data = card_in.model_dump(exclude_unset=True)
    except AttributeError:
        update_data = card_in.dict(exclude_unset=True)

    # 3. Actualizamos los atributos correspondientes
    for field, value in update_data.items():
        setattr(card, field, value)
    
    # 4. Registramos la marca de tiempo exacta de la última actualización
    card.updated_at = datetime.utcnow()

    # 5. Guardamos los cambios en la BD
    db.commit()
    db.refresh(card)

    return card


# ==============================================================================
# 3. ELIMINAR UNA TARJETA (Puntos 7 y 8)
# ==============================================================================
@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina permanentemente una tarjeta de la base de datos.
    """
    # 1. Buscamos la tarjeta
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="La tarjeta que intentas borrar no existe."
        )

    # 2. La borramos y confirmamos la transacción
    db.delete(card)
    db.commit()

    return None

    # ==============================================================================
# MOVER TARJETA Y REORDENAR (Puntos 11 y 12)
# ==============================================================================
@router.patch("/{card_id}/move", response_model=schemas.CardResponse)
def move_card(
    card_id: int,
    move_data: schemas.CardMove,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Actualiza la lista y posición de una tarjeta garantizando ordenación consistente.
    """
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    # Actualizar columna y posición
    card.list_id = move_data.list_id
    card.position = move_data.position
    card.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(card)
    return card