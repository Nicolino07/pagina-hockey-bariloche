from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.equipo import Equipo as EquipoSchema, EquipoCreate
from app.models.equipo import Equipo

router = APIRouter(prefix="/admin/equipos", tags=["Equipos Admin"])


@router.get("/", response_model=list[EquipoSchema])
def listar_equipos_admin(db: Session = Depends(get_db)):
    return db.query(Equipo).all()   

@router.get("/{equipo_id}", response_model=EquipoSchema)
def obtener_equipo_admin(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo

@router.post("/", response_model=EquipoSchema)
def crear_equipo(equipo: EquipoCreate, db: Session = Depends(get_db)):
    db_equipo = Equipo(**equipo.dict())
    db.add(db_equipo)
    db.commit()
    db.refresh(db_equipo)
    return db_equipo    

@router.put("/{equipo_id}", response_model=EquipoSchema)
def actualizar_equipo(equipo_id: int, equipo_data: EquipoCreate, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    for key, value in equipo_data.dict().items():
        setattr(equipo, key, value)

    db.commit()
    db.refresh(equipo)
    return equipo

@router.delete("/{equipo_id}")
def eliminar_equipo(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    db.delete(equipo)
    db.commit()
    return {"detail": "Equipo eliminado"}       

