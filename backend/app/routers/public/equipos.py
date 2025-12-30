from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.equipo import Equipo as EquipoSchema
from app.models.equipo import Equipo

router = APIRouter(prefix="/public/equipos", tags=["Equipos - Public"])

@router.get("/", response_model=list[EquipoSchema])
def listar_equipos(
    nombre: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Equipo)

    # Si se envía "nombre", filtra
    if nombre:
        query = query.filter(Equipo.nombre.ilike(f"%{nombre}%"))

    # Si no hay filtros → devuelve todos
    return query.all()

@router.get("/{equipo_id}", response_model=EquipoSchema)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo
