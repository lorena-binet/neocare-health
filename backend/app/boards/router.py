from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Board, List, Card, User
from app.security import get_current_user

router = APIRouter(
    prefix="/boards",
    tags=["Tableros"]
)

DEFAULT_COLUMNS = [
    {"id": "backlog", "title": "Pendiente", "position": 1},
    {"id": "in_progress", "title": "En Progreso", "position": 2},
    {"id": "review", "title": "Revisión", "position": 3},
    {"id": "done", "title": "Listo", "position": 4}
]

@router.get("/initial")
def get_initial_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar o crear el tablero del usuario
    board = db.query(Board).filter(Board.owner_id == current_user.id).first()
    if not board:
        board = Board(title="Mi Tablero Principal", owner_id=current_user.id)
        db.add(board)
        db.commit()
        db.refresh(board)

    # 2. Verificar si las listas existen en la base de datos
    existing_lists = db.query(List).filter(List.board_id == board.id).all()
    
    if not existing_lists:
        default_lists = [
            List(id="backlog", board_id=board.id, title="Pendiente", position=1),
            List(id="in_progress", board_id=board.id, title="En Progreso", position=2),
            List(id="review", board_id=board.id, title="Revisión", position=3),
            List(id="done", board_id=board.id, title="Listo", position=4),
        ]
        db.add_all(default_lists)
        db.commit()
        existing_lists = default_lists

    # 3. Obtener las listas asociadas a este tablero para filtrar las tarjetas correctamente
    list_ids = [l.id for l in existing_lists]

    # 4. Obtener las tarjetas usando el id de las listas (ya que Card no tiene board_id directo)
    cards = db.query(Card).filter(Card.list_id.in_(list_ids)).all() if list_ids else []

    # 5. Devolver la estructura para que React pinte el tablero completo
    return {
        "user_email": current_user.email,
        "columns": DEFAULT_COLUMNS,
        "cards": [
            {
                "id": card.id,
                "title": card.title,
                "description": card.description,
                "list_id": card.list_id,
                "position": card.position
            } 
            for card in cards
        ]
    }