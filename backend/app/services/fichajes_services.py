from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fichaje_rol import FichajeRol
from app.models.persona_rol import PersonaRol 
from app.core.exceptions  import ValidationError
from app.models.persona import Persona
from app.models.plantel_integrante import PlantelIntegrante
from fastapi import HTTPException, status


def crear_fichaje(
    *,
    db: Session,
    id_persona: int,
    id_club: int,
    rol,
    fecha_inicio: date,
    creado_por: str | None,
) -> FichajeRol:

    # 1️⃣ Buscar persona_rol válido
    persona_rol = db.scalar(
        select(PersonaRol).where(
            PersonaRol.id_persona == id_persona,
            PersonaRol.rol == rol,
            PersonaRol.fecha_hasta.is_(None),
        )
    )

    if not persona_rol:
        raise ValidationError(
            f"La persona no tiene asignado el rol {rol}"
        )

    # 2️⃣ Evitar fichaje activo duplicado
    existe = db.scalar(
        select(FichajeRol).where(
            FichajeRol.id_persona_rol == persona_rol.id_persona_rol,
            FichajeRol.id_club == id_club,
            FichajeRol.activo == True,
            FichajeRol.fecha_fin.is_(None),
            FichajeRol.borrado_en.is_(None),
        )
    )

    if existe:
        raise ValidationError(
            "La persona ya tiene un fichaje activo para ese rol en el club"
        )

    # 3️⃣ Crear fichaje (🔥 ahora sí completo)
    fichaje = FichajeRol(
        id_persona=id_persona,
        id_club=id_club,
        id_persona_rol=persona_rol.id_persona_rol,  # 🔑 CLAVE
        rol=rol,
        fecha_inicio=fecha_inicio,
        activo=True,
        creado_por=creado_por,
    )

    db.add(fichaje)
    db.flush()

    return fichaje



def obtener_fichajes_club(db: Session, id_club: int, solo_activos: bool = True):
    query = (
        db.query(
            FichajeRol.id_fichaje_rol,
            FichajeRol.id_persona,
            FichajeRol.rol,
            FichajeRol.fecha_inicio,
            FichajeRol.fecha_fin,
            FichajeRol.activo,
            Persona.nombre.label("persona_nombre"),
            Persona.apellido.label("persona_apellido"),
            Persona.documento.label("persona_documento")
        )
        .join(Persona, FichajeRol.id_persona == Persona.id_persona)
        .filter(FichajeRol.id_club == id_club)
    )

    if solo_activos:
        query = query.filter(FichajeRol.activo == True)

    return query.all()

def dar_baja_fichaje(db: Session, id_fichaje_rol: int, fecha_fin: date, actualizado_por: str):
    # 1. Obtener el fichaje
    fichaje = db.query(FichajeRol).filter(FichajeRol.id_fichaje_rol == id_fichaje_rol).first()
    
    if not fichaje:
        raise HTTPException(status_code=404, detail="Fichaje no encontrado")

    try:
        # 2. Actualizar el fichaje a inactivo
        fichaje.activo = False
        fichaje.fecha_fin = fecha_fin
        fichaje.actualizado_por = actualizado_por

        # 3. CASCADA LÓGICA: 
        # Buscamos si esta persona está en algún plantel usando este fichaje específico
        # y que aún no tenga fecha de baja.
        integrantes_activos = db.query(PlantelIntegrante).filter(
            PlantelIntegrante.id_fichaje_rol == id_fichaje_rol,
            PlantelIntegrante.fecha_baja == None
        ).all()

        for integrante in integrantes_activos:
            integrante.fecha_baja = fecha_fin
            integrante.actualizado_por = actualizado_por
            # Aquí podrías incluso disparar una lógica de 'activo = False' si tuvieras ese campo en plantel_integrante

        db.commit()
        db.refresh(fichaje)
        return fichaje

    except Exception as e:
        db.rollback()
        # Esto te dirá exactamente qué constraint falló en la consola
        print(f"Error en DB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflicto de integridad: {str(e)}"
        )