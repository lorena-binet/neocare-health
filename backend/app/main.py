from fastapi import FastAPI
from dotenv import load_dotenv 
import os

# Cargamos las variables del .env (como el PORT)
load_dotenv()
port = int(os.getenv("PORT", 8000))

app = FastAPI(
    title="NeoCare Health API",
    description="Backend modular para la gestión de tableros Kanban de salud",
    version="1.0.0"
)

@app.get("/")
def read_root():
    print("¡Hola Lorena! El print está funcionando aquí abajo")
    return {
        "status": "online",
        "message": "Bienvenida Lorena, la base modular de NeoCare está lista"
    }