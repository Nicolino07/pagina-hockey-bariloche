# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.torneo import Torneo as TorneoModel
from app.schemas.torneo import Torneo, TorneoCreate

router = APIRouter(prefix="/torneos", tags=["Torneos"])

@router.get("/", response_model=list[Torneo])
def get_torneos(db: Session = Depends(get_db)):
    return db.query(TorneoModel).all()

@router.get("/{id_torneo}", response_model=Torneo)
def get_torneo(id_torneo: int, db: Session = Depends(get_db)):
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return torneo

@router.post("/", response_model=Torneo, status_code=201)
def crear_torneo(data: TorneoCreate, db: Session = Depends(get_db)):

    # Convertir "" en None para fechas
    torneo_data = data.dict()
    if torneo_data.get("fecha_inicio") == "":
        torneo_data["fecha_inicio"] = None
    if torneo_data.get("fecha_fin") == "":
        torneo_data["fecha_fin"] = None

    nuevo = TorneoModel(**torneo_data)
    db.add(nuevo)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Ya existe un torneo con ese nombre y categoría"
        )

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
