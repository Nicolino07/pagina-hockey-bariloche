# app/services/torneos_services.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.torneo import Torneo
from app.schemas.torneo import TorneoCreate
from app.core.exceptions import ConflictError


def crear_torneo(
    db: Session,
    data: TorneoCreate,
    current_user,
) -> Torneo:

    torneo_data = data.model_dump()

    # Normalizar fechas
    if torneo_data.get("fecha_inicio") == "":
        torneo_data["fecha_inicio"] = None
    if torneo_data.get("fecha_fin") == "":
        torneo_data["fecha_fin"] = None

    torneo = Torneo(**torneo_data)
    torneo.creado_por = current_user.username

    db.add(torneo)

    try:
        db.flush()
    except IntegrityError:
        raise ConflictError(
            "Ya existe un torneo con ese nombre, categoría y genero"
        )

    return torneo
