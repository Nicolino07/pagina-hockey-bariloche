"""
Rutas para la gestión de la tabla de posiciones del torneo.
Calcula y expone las posiciones de equipos por fase/categoría.
Sin restricción de acceso (todas las rutas son públicas).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.posicion import Posicion
from app.schemas.posicion import PosicionCreate, PosicionUpdate, Posicion as PosicionOut

router = APIRouter(prefix="/posiciones", tags=["Posiciones"])


@router.get("/", response_model=list[PosicionOut])
def listar_posiciones(db: Session = Depends(get_db)):
    """Devuelve todas las posiciones registradas en la tabla. Acceso público."""
    return db.query(Posicion).all()


@router.post("/", response_model=PosicionOut)
def crear_posicion(data: PosicionCreate, db: Session = Depends(get_db)):
    """Crea un nuevo registro de posición en la tabla."""
    posicion = Posicion(**data.dict())
    db.add(posicion)
    db.commit()
    db.refresh(posicion)
    return posicion


@router.get("/{id_posicion}", response_model=PosicionOut)
def obtener_posicion(id_posicion: int, db: Session = Depends(get_db)):
    """Devuelve una posición específica por su ID."""
    pos = db.query(Posicion).filter_by(id_posicion=id_posicion).first()
    if not pos:
        raise HTTPException(404, "Posición no encontrada")
    return pos


@router.put("/{id_posicion}", response_model=PosicionOut)
def actualizar_posicion(id_posicion: int, data: PosicionUpdate, db: Session = Depends(get_db)):
    """Actualiza los datos de una posición existente (solo campos enviados)."""
    pos = db.query(Posicion).filter_by(id_posicion=id_posicion).first()
    if not pos:
        raise HTTPException(404, "Posición no encontrada")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(pos, key, value)

    db.commit()
    db.refresh(pos)
    return pos


@router.delete("/{id_posicion}")
def eliminar_posicion(id_posicion: int, db: Session = Depends(get_db)):
    """Elimina una posición de la tabla."""
    pos = db.query(Posicion).filter_by(id_posicion=id_posicion).first()
    if not pos:
        raise HTTPException(404, "Posición no encontrada")

    db.delete(pos)
    db.commit()
    return {"message": "Posición eliminada"}
