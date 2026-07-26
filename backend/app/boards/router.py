from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

# ¡AQUÍ ESTÁ LO IMPORTANTE! Se debe llamar 'router'
router = APIRouter(
    prefix="/boards",
    tags=["Tableros"]
)

DEFAULT_COLUMNS = [
    {"id": "backlog", "title": "Backlog", "position": 1},
    {"id": "in_progress", "title": "En Progreso", "position": 2},
    {"id": "review", "title": "Revisión", "position": 3},
    {"id": "done", "title": "Listo", "position": 4}
]

@router.get("/initial")
def get_initial_board(db: Session = Depends(get_db)):
    return {
        "columns": DEFAULT_COLUMNS,
        "cards": []
    }