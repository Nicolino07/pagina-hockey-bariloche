# routes/planteles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plantel_equipo import PlantelEquipo as PlantelModel
from app.schemas.plantel_equipo import PlantelEquipo, PlantelEquipoCreate

router = APIRouter(prefix="/admin/planteles", tags=["Planteles Equipo Admin"])

@router.get("/", response_model=list[PlantelEquipo])
def get_planteles(db: Session = Depends(get_db)):
    return db.query(PlantelModel).all()

@router.get("/{id}", response_model=PlantelEquipo)
def get_plantel(id: int, db: Session = Depends(get_db)):
    p = db.query(PlantelModel).filter(PlantelModel.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")
    return p

@router.post("/", response_model=PlantelEquipo)
def create_plantel(data: PlantelEquipoCreate, db: Session = Depends(get_db)):
    nuevo = PlantelModel(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id}", response_model=PlantelEquipo)
def update_plantel(id: int, data: PlantelEquipoCreate, db: Session = Depends(get_db)):
    item = db.query(PlantelModel).filter(PlantelModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")

    for key, value in data.dict().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete_plantel(id: int, db: Session = Depends(get_db)):
    item = db.query(PlantelModel).filter(PlantelModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")

    db.delete(item)
    db.commit()
    return {"detail": "Plantel eliminado"}
