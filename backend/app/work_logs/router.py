from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Optional

from app.database import get_db
from app.models import WorkLog, Card, User
from app.schemas import WorkLogCreate, WorkLogUpdate, WorkLogResponse
from app.security import get_current_user  # O la función de token que tengas en security

router = APIRouter(prefix="/work-logs", tags=["work-Logs"])

# 1. Crear registro de horas
@router.post("/", response_model=WorkLogResponse, status_code=status.HTTP_201_CREATED)
def create_work_log(
    log_data: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(Card.id == log_data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    new_log = WorkLog(
        card_id=log_data.card_id,
        user_id=current_user.id,
        hours=log_data.hours,
        date=log_data.date,
        note=log_data.note
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

# 2. Listar registros de una tarjeta
@router.get("/card/{card_id}", response_model=List[WorkLogResponse])
def get_logs_by_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(WorkLog).filter(WorkLog.card_id == card_id).all()

# 3. Editar registro (Solo el creador)
@router.put("/{log_id}", response_model=WorkLogResponse)
def update_work_log(
    log_id: int,
    log_data: WorkLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(WorkLog).filter(WorkLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este registro")

    if log_data.hours is not None:
        log.hours = log_data.hours
    if log_data.date is not None:
        log.date = log_data.date
    if log_data.note is not None:
        log.note = log_data.note

    db.commit()
    db.refresh(log)
    return log

# 4. Eliminar registro (Solo el creador)
@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(WorkLog).filter(WorkLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este registro")

    db.delete(log)
    db.commit()
    return None

# 5. Obtener registros semanales del usuario autenticado
@router.get("/weekly", response_model=List[WorkLogResponse])
def get_weekly_logs(
    start_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    end_date = start_date + timedelta(days=6)
    return db.query(WorkLog).filter(
        WorkLog.user_id == current_user.id,
        WorkLog.date >= start_date,
        WorkLog.date <= end_date
    ).all()