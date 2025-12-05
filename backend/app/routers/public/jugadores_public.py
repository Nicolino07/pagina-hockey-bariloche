from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.jugador import Jugador as JugadorDB
from app.schemas.jugador import Jugador

router = APIRouter(prefix="/public/jugadores", tags=["Jugadores Público"])


@router.get("/", response_model=list[Jugador])
def listar_jugadores(
    nombre: str | None = None,
    apellido: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(JugadorDB)

    if nombre:
        query = query.filter(JugadorDB.nombre.ilike(f"%{nombre}%"))
    if apellido:
        query = query.filter(JugadorDB.apellido.ilike(f"%{apellido}%"))
    
    return query.all()



@router.get("/{id_jugador}", response_model=Jugador)
def obtener_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(JugadorDB).filter(JugadorDB.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")
    return jugador
