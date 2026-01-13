from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.club import Club, ClubCreate, ClubUpdate
from app.services import clubes_services
from app.dependencies.permissions import require_admin

router = APIRouter(prefix="/clubes", tags=["Clubes"])


# 🔓 Público
@router.get("/", response_model=list[Club])
def listar_clubes(db: Session = Depends(get_db)):
    return clubes_services.listar_clubes(db)


# 🔓 Público
@router.get("/{id_club}", response_model=Club)
def obtener_club(id_club: int, db: Session = Depends(get_db)):
    club = clubes_services.obtener_club(db, id_club)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club no encontrado"
        )
    return club


# 🔐 ADMIN / SUPERUSUARIO
@router.post("/", response_model=Club, status_code=status.HTTP_201_CREATED)
def crear_club(
    data: ClubCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    return clubes_services.crear_club(db, data)


# 🔐 ADMIN / SUPERUSUARIO
@router.put("/{id_club}", response_model=Club)
def actualizar_club(
    id_club: int,
    data: ClubUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    club = clubes_services.obtener_club(db, id_club)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club no encontrado"
        )

    return clubes_services.actualizar_club(db, club, data)


# 🔐 ADMIN / SUPERUSUARIO
@router.delete("/{id_club}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_club(
    id_club: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    club = clubes_services.obtener_club(db, id_club)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club no encontrado"
        )

    clubes_services.eliminar_club(db, club)
