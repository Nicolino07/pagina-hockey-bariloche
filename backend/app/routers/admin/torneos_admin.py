# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.torneo import Torneo as TorneoModel
from app.schemas.torneo import Torneo, TorneoCreate

router = APIRouter(prefix="/admin/torneos", tags=["Torneos Admin"])

@router.get("/", response_model=list[Torneo])
def get_torneos(db: Session = Depends(get_db)):
    return db.query(TorneoModel).all()

@router.get("/{id_torneo}", response_model=Torneo)
def get_torneo(id_torneo: int, db: Session = Depends(get_db)):
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return torneo

@router.post("/", response_model=Torneo)
def create_torneo(torneo: TorneoCreate, db: Session = Depends(get_db)):
    nuevo = TorneoModel(**torneo.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id_torneo}", response_model=Torneo)
def update_torneo(id_torneo: int, torneo: TorneoCreate, db: Session = Depends(get_db)):
    db_torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not db_torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")

    for key, value in torneo.dict().items():
        setattr(db_torneo, key, value)

    db.commit()
    db.refresh(db_torneo)
    return db_torneo

@router.delete("/{id_torneo}")
def delete_torneo(id_torneo: int, db: Session = Depends(get_db)):
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")

    db.delete(torneo)
    db.commit()
    return {"detail": "Torneo eliminado"}
