import logging
from fastapi import HTTPException
from app.models.equipo import Equipo
from app.models.torneo import Torneo
from app.models.inscripcion_torneo import InscripcionTorneo


def inscribir_equipo(db, id_equipo: int, id_torneo: int):
    equipo = db.query(Equipo).filter_by(id_equipo=id_equipo).first()
    torneo = db.query(Torneo).filter_by(id_torneo=id_torneo).first()

    if not equipo or not torneo:
        raise HTTPException(404, "Equipo o Torneo no encontrado")

    # Validación categoría
    if equipo.categoria != torneo.categoria:
        raise HTTPException(400, "La categoría del equipo no coincide con la del torneo")

    # Validación género
    if torneo.genero != "Mixto" and equipo.genero != torneo.genero:
        raise HTTPException(400, "El género del equipo no coincide con el del torneo")

    # Validación inscripción duplicada
    existente = db.query(InscripcionTorneo).filter_by(
        id_equipo=id_equipo,
        id_torneo=id_torneo
    ).first()

    if existente:
        raise HTTPException(400, "El equipo ya está inscrito en este torneo")

    inscripcion = InscripcionTorneo(
        id_equipo=id_equipo,
        id_torneo=id_torneo,
        categoria=equipo.categoria,
        genero=equipo.genero,
    )
    db.add(inscripcion)
    db.commit()
    db.refresh(inscripcion)
    return inscripcion
