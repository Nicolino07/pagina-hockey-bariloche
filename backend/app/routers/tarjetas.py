"""
Rutas para la gestión de tarjetas (amarillas/rojas) en partidos.
La lectura es pública; las operaciones de escritura requieren rol EDITOR o superior.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tarjeta import Tarjeta as TarjetaModel
from app.schemas.tarjeta import Tarjeta, TarjetaCreate
from app.dependencies.permissions import require_editor

router = APIRouter(prefix="/tarjetas", tags=["Tarjetas"])

@router.get("/", response_model=list[Tarjeta])
def get_tarjetas(db: Session = Depends(get_db)):
    """Devuelve todas las tarjetas registradas. Acceso público."""
    return db.query(TarjetaModel).all()

@router.get("/{id_tarjeta}", response_model=Tarjeta)
def get_tarjeta(id_tarjeta: int, db: Session = Depends(get_db)):
    """Devuelve una tarjeta específica por su ID. Acceso público."""
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return item

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.post("/", response_model=Tarjeta)
def create_tarjeta(data: TarjetaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Registra una nueva tarjeta en la base de datos. Requiere rol EDITOR o superior."""
    nuevo = TarjetaModel(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.put("/{id_tarjeta}", response_model=Tarjeta)
def update_tarjeta(id_tarjeta: int, data: TarjetaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Actualiza los datos de una tarjeta existente. Requiere rol EDITOR o superior."""
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    for key, value in data.dict().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.delete("/{id_tarjeta}")
def delete_tarjeta(id_tarjeta: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Elimina una tarjeta de la base de datos. Requiere rol EDITOR o superior."""
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    db.delete(item)
    db.commit()
    return {"detail": "Tarjeta eliminada"}
