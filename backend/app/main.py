import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base
from app import models 

# 1. IMPORTAR ROUTERS
from app.auth.router import router as auth_router
from app.boards.router import router as boards_router
from app.cards.router import router as cards_router
from app.work_logs.router import router as work_logs_router

load_dotenv()

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NeoCare Health API",
    description="Backend modular para la gestión de tableros Kanban de salud",
    version="1.0.0"
)

# CORS para React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. INCLUIR ROUTERS EN LA APP (Asegúrate de que estas 3 líneas estén)
app.include_router(auth_router)
app.include_router(boards_router)
app.include_router(cards_router)
app.include_router(work_logs_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "NeoCare Health API is running"
    }