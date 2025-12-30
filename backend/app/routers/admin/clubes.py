from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db

from app.models.club import Club
from app.schemas.club import Club as ClubSchema, ClubCreate, ClubUpdate

router = APIRouter(prefix="/admin/clubes", tags=["Clubes - Admin"])


# ======================================
# LISTAR CLUBES (con filtros opcionales)
# ======================================
@router.get("/", response_model=list[ClubSchema])
def listar_clubes(
    nombre: str | None = None,
    provincia: str | None = None,
    ciudad: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Club)

    if nombre:
        query = query.filter(Club.nombre.ilike(f"%{nombre}%"))
    if provincia:
        query = query.filter(Club.provincia.ilike(f"%{provincia}%"))
    if ciudad:
        query = query.filter(Club.ciudad.ilike(f"%{ciudad}%"))

    return query.all()


# ======================================
# OBTENER CLUB POR ID
# ======================================
@router.get("/{id_club}", response_model=ClubSchema)
def obtener_club(id_club: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == id_club).first()
    if not club:
        raise HTTPException(404, "Club no encontrado")
    return club


# ======================================
# CREAR CLUB
# ======================================
@router.post("/", response_model=ClubSchema, status_code=201)
def crear_club(data: ClubCreate, db: Session = Depends(get_db)):
    nuevo = Club(**data.dict())
    db.add(nuevo)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "Ya existe un club con ese nombre en esa ciudad"
        )

    db.refresh(nuevo)
    return nuevo


# ======================================
# ACTUALIZAR CLUB
# ======================================
@router.put("/{id_club}", response_model=ClubSchema)
def actualizar_club(id_club: int, data: ClubUpdate, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == id_club).first()
    if not club:
        raise HTTPException(404, "Club no encontrado")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(club, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "Ya existe un club con ese nombre en esa ciudad"
        )

    db.refresh(club)
    return club


# ======================================
# ELIMINAR CLUB
# ======================================
@router.delete("/{id_club}", status_code=204)
def eliminar_club(id_club: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == id_club).first()
    if not club:
        raise HTTPException(404, "Club no encontrado")

    db.delete(club)
    db.commit()
    return {"detail": "Club eliminado"}
