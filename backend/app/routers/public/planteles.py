from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.plantel import PlantelRead
from app.services import planteles_services

router = APIRouter(prefix="/planteles", tags=["Planteles - Public"])

@router.get("/{id_plantel}", response_model=PlantelRead)
def ver_plantel(
    id_plantel: int,
    db: Session = Depends(get_db)
):
    return planteles_services.obtener_plantel(db, id_plantel)
