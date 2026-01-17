# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session 
from app.database import get_db
from app.models.torneo import Torneo as TorneoModel
from app.schemas.torneo import Torneo, TorneoCreate
from app.dependencies.permissions import require_admin
from app.models.usuario import Usuario
from app.services import torneos_services

router = APIRouter(prefix="/torneos", tags=["Torneos"])

# 🔓 Público
@router.get("/", response_model=list[Torneo])
def listar_torneos(db: Session = Depends(get_db)):
    return db.query(TorneoModel).all()

# 🔓 Público
@router.get("/{id_torneo}", response_model=Torneo)
def obtener_torneo(id_torneo: int, db: Session = Depends(get_db)):
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return torneo

# 🔐 ADMIN
@router.post("/", response_model=Torneo, status_code=status.HTTP_201_CREATED)
def crear_torneo(
    data: TorneoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return torneos_services.crear_torneo(db, data, current_user)

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
