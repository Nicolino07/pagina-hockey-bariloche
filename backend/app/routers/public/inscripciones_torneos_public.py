# routes/inscripciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inscripcion_torneo import InscripcionTorneo as InscripcionModel
from app.schemas.inscripcion_torneo import InscripcionTorneo

router = APIRouter(prefix="/public/inscripciones", tags=["Inscripciones Torneo Público"])

@router.get("/", response_model=list[InscripcionTorneo])
def get_inscripciones(db: Session = Depends(get_db)):
    return db.query(InscripcionModel).all()

@router.get("/{id}", response_model=InscripcionTorneo)
def get_inscripcion(id: int, db: Session = Depends(get_db)):
    ins = db.query(InscripcionModel).filter(InscripcionModel.id == id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    return ins
