# routes/participaciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.participan_partido import ParticipanPartido as PPModel
from app.schemas.participan_partido import ParticipanPartido, ParticipanPartidoCreate

router = APIRouter(prefix="/admin/participaciones", tags=["Participan Partido Admin"])

@router.get("/", response_model=list[ParticipanPartido])
def get_participaciones(db: Session = Depends(get_db)):
    return db.query(PPModel).all()

@router.get("/{id}", response_model=ParticipanPartido)
def get_participacion(id: int, db: Session = Depends(get_db)):
    item = db.query(PPModel).filter(PPModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return item

@router.post("/", response_model=ParticipanPartido)
def create_participacion(data: ParticipanPartidoCreate, db: Session = Depends(get_db)):
    nuevo = PPModel(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id}", response_model=ParticipanPartido)
def update_participacion(id: int, data: ParticipanPartidoCreate, db: Session = Depends(get_db)):
    item = db.query(PPModel).filter(PPModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    for key, value in data.dict().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete_participacion(id: int, db: Session = Depends(get_db)):
    item = db.query(PPModel).filter(PPModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    db.delete(item)
    db.commit()
    return {"detail": "Registro eliminado"}
