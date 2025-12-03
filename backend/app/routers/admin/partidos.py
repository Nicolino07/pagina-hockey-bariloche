from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.partido import Partido
from app.schemas.partido import PartidoCreate, PartidoUpdate, PartidoOut

router = APIRouter(prefix="/admin/partidos", tags=["Admin Partidos"])


@router.get("/", response_model=list[PartidoOut])
def listar_partidos(db: Session = Depends(get_db)):
    return db.query(Partido).all()


@router.post("/", response_model=PartidoOut)
def crear_partido(data: PartidoCreate, db: Session = Depends(get_db)):
    partido = Partido(**data.dict())
    db.add(partido)
    db.commit()
    db.refresh(partido)
    return partido


@router.get("/{id_partido}", response_model=PartidoOut)
def obtener_partido(id_partido: int, db: Session = Depends(get_db)):
    partido = db.query(Partido).filter_by(id_partido=id_partido).first()
    if not partido:
        raise HTTPException(404, "Partido no encontrado")
    return partido


@router.put("/{id_partido}", response_model=PartidoOut)
def actualizar_partido(id_partido: int, data: PartidoUpdate, db: Session = Depends(get_db)):
    partido = db.query(Partido).filter_by(id_partido=id_partido).first()
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(partido, key, value)

    db.commit()
    db.refresh(partido)
    return partido


@router.delete("/{id_partido}")
def eliminar_partido(id_partido: int, db: Session = Depends(get_db)):
    partido = db.query(Partido).filter_by(id_partido=id_partido).first()
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    db.delete(partido)
    db.commit()
    return {"message": "Partido eliminado"}
