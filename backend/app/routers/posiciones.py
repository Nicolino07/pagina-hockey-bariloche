"""
Rutas de lectura de la tabla de posiciones del torneo. Acceso público.

La tabla `posicion` solo se escribe desde los triggers de la base (inscripción,
goles y cierre de partidos), así que la API no expone altas, ediciones ni bajas.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.posicion import Posicion
from app.schemas.posicion import Posicion as PosicionOut

router = APIRouter(prefix="/posiciones", tags=["Posiciones"])


@router.get("/", response_model=list[PosicionOut])
def listar_posiciones(db: Session = Depends(get_db)):
    """Devuelve todas las posiciones registradas en la tabla. Acceso público."""
    return db.query(Posicion).all()


@router.get("/{id_posicion}", response_model=PosicionOut)
def obtener_posicion(id_posicion: int, db: Session = Depends(get_db)):
    """Devuelve una posición específica por su ID."""
    pos = db.query(Posicion).filter_by(id_posicion=id_posicion).first()
    if not pos:
        raise HTTPException(404, "Posición no encontrada")
    return pos
