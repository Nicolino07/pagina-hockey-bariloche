"""
Rutas para la gestión de goles registrados en partidos.
Todas las operaciones de escritura requieren rol EDITOR o superior.
La lectura es de acceso público.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.gol import Gol as GolModel
from app.schemas.gol import Gol, GolCreate
from app.dependencies.permissions import require_editor

router = APIRouter(prefix="/goles", tags=["Goles"])

@router.get("/", response_model=list[Gol])
def get_goles(db: Session = Depends(get_db)):
    """Devuelve todos los goles registrados. Acceso público."""
    return db.query(GolModel).all()

@router.get("/{id_gol}", response_model=Gol)
def get_gol(id_gol: int, db: Session = Depends(get_db)):
    """Devuelve un gol específico por su ID. Acceso público."""
    gol = db.query(GolModel).filter(GolModel.id_gol == id_gol).first()
    if not gol:
        raise HTTPException(status_code=404, detail="Gol no encontrado")
    return gol

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.post("/", response_model=Gol)
def create_gol(
    gol: GolCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_editor),
):
    """Registra un nuevo gol en la base de datos. Requiere rol EDITOR o superior."""
    nuevo = GolModel(**gol.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.put("/{id_gol}", response_model=Gol)
def update_gol(
    id_gol: int,
    gol: GolCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_editor),
):
    """Actualiza los datos de un gol existente. Requiere rol EDITOR o superior."""
    db_gol = db.query(GolModel).filter(GolModel.id_gol == id_gol).first()
    if not db_gol:
        raise HTTPException(status_code=404, detail="Gol no encontrado")

    for key, value in gol.dict().items():
        setattr(db_gol, key, value)

    db.commit()
    db.refresh(db_gol)
    return db_gol

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.delete("/{id_gol}")
def delete_gol(
    id_gol: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_editor),
):
    """Elimina un gol de la base de datos. Requiere rol EDITOR o superior."""
    gol = db.query(GolModel).filter(GolModel.id_gol == id_gol).first()
    if not gol:
        raise HTTPException(status_code=404, detail="Gol no encontrado")

    db.delete(gol)
    db.commit()
    return {"detail": "Gol eliminado"}