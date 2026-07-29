from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Board, List, Card, User
from app.security import get_current_user

router = APIRouter(
    prefix="/boards",
    tags=["Tableros"]
)

@router.get("/initial")
def get_initial_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar el tablero del usuario
    board = db.query(Board).filter(Board.owner_id == current_user.id).first()
    
    # Si por cualquier motivo no lo tuviera, lo creamos de forma segura aquí
    if not board:
        board = Board(title="Mi Tablero Principal", owner_id=current_user.id)
        db.add(board)
        db.commit()
        db.refresh(board)

        # Crear sus listas por defecto
        default_lists = [
            List(board_id=board.id, title="Pendiente", position=1),
            List(board_id=board.id, title="En Progreso", position=2),
            List(board_id=board.id, title="Revisión", position=3),
            List(board_id=board.id, title="Listo", position=4),
        ]
        db.add_all(default_lists)
        db.commit()

    # 2. Obtener las listas del tablero de forma limpia
    existing_lists = db.query(List).filter(List.board_id == board.id).order_by(List.position).all()
    
    list_ids = [l.id for l in existing_lists]

    # 3. Obtener las tarjetas de forma segura para PostgreSQL
    cards = []
    if list_ids:
        cards = db.query(Card).filter(Card.list_id.in_(list_ids)).all()

    # 4. Devolver la estructura para React
    return {
        "user_email": current_user.email,
        "columns": [
            {"id": l.id, "title": l.title, "position": l.position} for l in existing_lists
        ],
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