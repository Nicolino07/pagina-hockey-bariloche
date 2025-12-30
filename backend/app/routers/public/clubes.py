from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db

from app.models.club import Club
from app.schemas.club import Club as ClubSchema

router = APIRouter(prefix="/public/clubes", tags=["Clubes - Public"])


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
