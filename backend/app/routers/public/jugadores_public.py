from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.jugador import Jugador
from app.schemas.jugador import Jugador

router = APIRouter(prefix="/public/jugadores", tags=["Jugadores Público"])


@router.get("/", response_model=list[Jugador])
def listar_jugadores(db: Session = Depends(get_db)):
    return db.query(Jugador).all()


@router.get("/{id_jugador}", response_model=Jugador)
def obtener_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(Jugador).filter(Jugador.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")
    return jugador

