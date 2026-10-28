
# routes/fases.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from models.fase import Fase as FaseModel
from schemas.fase import Fase, FaseCreate

router = APIRouter(prefix="/fases", tags=["Fases"])

@router.get("/", response_model=list[Fase])
def get_fases(db: Session = Depends(get_db)):
    return db.query(FaseModel).all()

@router.get("/{id_fase}", response_model=Fase)
def get_fase(id_fase: int, db: Session = Depends(get_db)):
    fase = db.query(FaseModel).filter(FaseModel.id_fase == id_fase).first()
    if not fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")
    return fase

@router.post("/", response_model=Fase)
def create_fase(fase: FaseCreate, db: Session = Depends(get_db)):
    nuevo = FaseModel(**fase.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id_fase}", response_model=Fase)
def update_fase(id_fase: int, fase: FaseCreate, db: Session = Depends(get_db)):
    db_fase = db.query(FaseModel).filter(FaseModel.id_fase == id_fase).first()
    if not db_fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")

    for key, value in fase.dict().items():
        setattr(db_fase, key, value)

    db.commit()
    db.refresh(db_fase)
    return db_fase

@router.delete("/{id_fase}")
def delete_fase(id_fase: int, db: Session = Depends(get_db)):
    fase = db.query(FaseModel).filter(FaseModel.id_fase == id_fase).first()
    if not fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")

    db.delete(fase)
    db.commit()
    return {"detail": "Fase eliminada"}
