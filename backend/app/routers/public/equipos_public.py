from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.club import Club as ClubSchema
from app.models.equipo import Equipo

router = APIRouter(prefix="/public/equipos", tags=["Equipos Public"])

@router.get("/", response_model=list[ClubSchema])
def listar_equipos_public(db: Session = Depends(get_db)):
    return db.query(Equipo).all()

@router.get("/{equipo_id}", response_model=ClubSchema)
def obtener_equipo_public(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo
