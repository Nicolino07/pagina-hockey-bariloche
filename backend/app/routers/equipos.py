from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.equipo import Equipo as EquipoSchema, EquipoCreate
from app.models.equipo import Equipo
from app.dependencies.permissions import require_admin

router = APIRouter(prefix="/equipos", tags=["Equipos"])


# 🔓 Público
@router.get("/", response_model=list[EquipoSchema])
def listar_equipos(
    nombre: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Equipo)

    if nombre:
        query = query.filter(Equipo.nombre.ilike(f"%{nombre}%"))

    return query.all()


# 🔓 Público
@router.get("/{equipo_id}", response_model=EquipoSchema)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    return equipo


# 🔐 ADMIN / SUPERUSUARIO
@router.post("/", response_model=EquipoSchema, status_code=status.HTTP_201_CREATED)
def crear_equipo(
    equipo: EquipoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    db_equipo = Equipo(**equipo.dict())
    db.add(db_equipo)
    db.commit()
    db.refresh(db_equipo)
    return db_equipo


# 🔐 ADMIN / SUPERUSUARIO
@router.put("/{equipo_id}", response_model=EquipoSchema)
def actualizar_equipo(
    equipo_id: int,
    equipo_data: EquipoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )

    for key, value in equipo_data.dict().items():
        setattr(equipo, key, value)

    db.commit()
    db.refresh(equipo)
    return equipo


# 🔐 ADMIN / SUPERUSUARIO
@router.delete("/{equipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )

    db.delete(equipo)
    db.commit()
