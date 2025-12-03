# routes/inscripciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inscripcion_torneo import InscripcionTorneo as InscripcionModel
from app.schemas.inscripcion_torneo import InscripcionTorneo, InscripcionTorneoCreate

router = APIRouter(prefix="/admin/inscripciones", tags=["Inscripciones Torneo Admin"])

@router.get("/", response_model=list[InscripcionTorneo])
def get_inscripciones(db: Session = Depends(get_db)):
    return db.query(InscripcionModel).all()

@router.get("/{id}", response_model=InscripcionTorneo)
def get_inscripcion(id: int, db: Session = Depends(get_db)):
    ins = db.query(InscripcionModel).filter(InscripcionModel.id == id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    return ins

@router.post("/", response_model=InscripcionTorneo)
def create_inscripcion(data: InscripcionTorneoCreate, db: Session = Depends(get_db)):
    nuevo = InscripcionModel(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id}", response_model=InscripcionTorneo)
def update_inscripcion(id: int, data: InscripcionTorneoCreate, db: Session = Depends(get_db)):
    ins = db.query(InscripcionModel).filter(InscripcionModel.id == id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    for key, value in data.dict().items():
        setattr(ins, key, value)

    db.commit()
    db.refresh(ins)
    return ins

@router.delete("/{id}")
def delete_inscripcion(id: int, db: Session = Depends(get_db)):
    ins = db.query(InscripcionModel).filter(InscripcionModel.id == id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    db.delete(ins)
    db.commit()
    return {"detail": "Inscripción eliminada"}
