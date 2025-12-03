from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.partido import Partido
from app.schemas.partido import Partido as PartidoOut

router = APIRouter(prefix="/public/partidos", tags=["Public Partidos"])


@router.get("/", response_model=list[PartidoOut])
def listar_partidos(db: Session = Depends(get_db)):
    return db.query(Partido).all()


@router.get("/{id_partido}", response_model=PartidoOut)
def obtener_partido(id_partido: int, db: Session = Depends(get_db)):
    partido = db.query(Partido).filter_by(id_partido=id_partido).first()
    if not partido:
        raise HTTPException(404, "Partido no encontrado")
    return partido
