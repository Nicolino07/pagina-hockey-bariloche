from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fichaje_rol import FichajeRol
from app.models.persona_rol import PersonaRol 
from app.core.exceptions  import ValidationError
from app.models.persona import Persona
from app.models.plantel_integrante import PlantelIntegrante
from app.models.plantel import Plantel
from app.models.equipo import Equipo
from app.models.torneo import Torneo
from app.models.club import Club
from app.models.enums import es_rol_cuerpo_tecnico
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



def obtener_personas_disponibles_para_fichar(
    db: Session,
    id_club: int,
    rol: str,
) -> list[Persona]:
    """
    Devuelve personas que pueden ser fichadas en el club con el rol dado.
    Condiciones:
      1. Tienen el rol habilitante activo (PersonaRol.rol == rol y fecha_hasta IS NULL).
      2. No tienen fichaje activo con ese rol:
         - en ningún club, si el rol es exclusivo (JUGADOR, DELEGADO);
         - en ESTE club, si es un rol de cuerpo técnico (DT, ARBITRO,
           ASISTENTE, MEDICO, PREPARADOR_FISICO), que puede estar fichado en
           varios clubes a la vez pero no dos veces en el mismo.
    """
    # Subquery: id_persona con fichaje activo para ese rol que impide ficharla
    fichados = (
        select(FichajeRol.id_persona)
        .where(
            FichajeRol.rol == rol,
            FichajeRol.activo == True,
            FichajeRol.fecha_fin.is_(None),
            FichajeRol.borrado_en.is_(None),
        )
    )

    if es_rol_cuerpo_tecnico(rol):
        fichados = fichados.where(FichajeRol.id_club == id_club)

    stmt = (
        select(Persona)
        .join(PersonaRol, PersonaRol.id_persona == Persona.id_persona)
        .where(
            Persona.borrado_en.is_(None),
            PersonaRol.rol == rol,
            PersonaRol.fecha_hasta.is_(None),
            Persona.id_persona.not_in(fichados),
        )
        .distinct()
        .order_by(Persona.apellido, Persona.nombre)
    )

    return db.scalars(stmt).all()


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
        # Sólo los planteles abiertos: una nómina cerrada es historial y no se
        # toca (y tampoco bloquea un pase, ver `_planteles_de_fichaje`).
        integrantes_activos = (
            db.query(PlantelIntegrante)
            .join(Plantel, PlantelIntegrante.id_plantel == Plantel.id_plantel)
            .filter(
                PlantelIntegrante.id_fichaje_rol == id_fichaje_rol,
                PlantelIntegrante.fecha_baja.is_(None),
                Plantel.activo.is_(True),
                Plantel.borrado_en.is_(None),
            )
            .all()
        )

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


def _planteles_de_fichaje(db: Session, id_fichaje_rol: int) -> tuple[list[dict], list[dict]]:
    """
    Devuelve los planteles donde la persona figura activa por este fichaje,
    separados en dos listas: `(impactados, historial)`.

    - **impactados**: planteles abiertos. Son los que la baja arrastra.
    - **historial**: planteles ya cerrados. La baja NO los toca: una nómina
      cerrada es el registro de lo que pasó y la persona tiene que seguir
      figurando ahí como integrante.

    Dejarlos intactos tampoco traba un pase a otro club: el trigger
    `validar_rol_unico_por_club` sólo mira planteles con `activo = true`.
    """
    filas = (
        db.query(PlantelIntegrante, Plantel, Equipo, Torneo)
        .join(Plantel, PlantelIntegrante.id_plantel == Plantel.id_plantel)
        .join(Equipo, Plantel.id_equipo == Equipo.id_equipo)
        .outerjoin(Torneo, Plantel.id_torneo == Torneo.id_torneo)
        .filter(
            PlantelIntegrante.id_fichaje_rol == id_fichaje_rol,
            PlantelIntegrante.fecha_baja.is_(None),
            Plantel.borrado_en.is_(None),
        )
        .order_by(Equipo.nombre, Plantel.id_plantel)
        .all()
    )

    impactados: list[dict] = []
    historial: list[dict] = []

    for integrante, plantel, equipo, torneo in filas:
        destino = impactados if plantel.activo else historial
        destino.append({
            "id_plantel_integrante": integrante.id_plantel_integrante,
            "id_plantel": plantel.id_plantel,
            "plantel_nombre": plantel.nombre,
            "id_equipo": equipo.id_equipo,
            "equipo_nombre": equipo.nombre,
            "equipo_categoria": equipo.categoria,
            "equipo_division": equipo.division,
            "equipo_genero": equipo.genero,
            "rol_en_plantel": integrante.rol_en_plantel,
            "numero_camiseta": integrante.numero_camiseta,
            "id_torneo": plantel.id_torneo,
            "torneo_nombre": torneo.nombre if torneo else None,
            "fecha_alta": integrante.fecha_alta,
            "plantel_cerrado": not plantel.activo,
        })

    return impactados, historial


def _fichajes_activos_en_club(db: Session, id_persona: int, id_club: int) -> list[FichajeRol]:
    """Fichajes vigentes de una persona en un club, uno por rol."""
    return (
        db.query(FichajeRol)
        .filter(
            FichajeRol.id_persona == id_persona,
            FichajeRol.id_club == id_club,
            FichajeRol.activo.is_(True),
            FichajeRol.fecha_fin.is_(None),
        )
        .order_by(FichajeRol.rol)
        .all()
    )


def preview_baja_club(db: Session, id_persona: int, id_club: int) -> dict:
    """
    Calcula el impacto de la baja general de una persona en un club, sin tocar
    nada.

    La baja general cierra **todos** los roles vigentes de la persona en el club
    y, por cascada, la saca de todos los planteles que dependen de esos roles,
    sin importar el equipo ni el torneo. Este preview existe para que el usuario
    vea exactamente eso antes de confirmar y, si sólo quiere sacarla de un
    equipo puntual, use la baja del integrante en ese plantel.
    """
    persona = db.get(Persona, id_persona)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    club = db.get(Club, id_club)
    if not club:
        raise HTTPException(status_code=404, detail="Club no encontrado")

    roles = []
    for fichaje in _fichajes_activos_en_club(db, id_persona, id_club):
        impactados, historial = _planteles_de_fichaje(db, fichaje.id_fichaje_rol)
        roles.append({
            "id_fichaje_rol": fichaje.id_fichaje_rol,
            "rol": fichaje.rol,
            "fecha_inicio": fichaje.fecha_inicio,
            "planteles": impactados,
            "planteles_historial": historial,
        })

    return {
        "id_persona": id_persona,
        "persona_nombre": persona.nombre,
        "persona_apellido": persona.apellido,
        "persona_documento": persona.documento,
        "id_club": id_club,
        "club_nombre": club.nombre,
        "roles": roles,
        "total_planteles": sum(len(r["planteles"]) for r in roles),
        "total_historial": sum(len(r["planteles_historial"]) for r in roles),
    }


def dar_baja_club(
    db: Session,
    id_persona: int,
    id_club: int,
    fecha_fin: date,
    actualizado_por: str | None,
) -> dict:
    """
    Baja general: cierra todos los roles vigentes de la persona en el club y la
    saca en cascada de todos los planteles que dependían de esos roles.

    Para sacar a alguien de un solo equipo hay que usar la baja del integrante
    en ese plantel, que no toca el vínculo con el club.
    """
    fichajes = _fichajes_activos_en_club(db, id_persona, id_club)

    if not fichajes:
        raise HTTPException(
            status_code=404,
            detail="La persona no tiene fichajes vigentes en este club",
        )

    try:
        roles_dados_de_baja: list[str] = []
        integrantes_dados_de_baja = 0

        for fichaje in fichajes:
            fichaje.activo = False
            fichaje.fecha_fin = fecha_fin
            fichaje.actualizado_por = actualizado_por
            roles_dados_de_baja.append(getattr(fichaje.rol, "value", str(fichaje.rol)))

            integrantes_activos = (
                db.query(PlantelIntegrante)
                .join(Plantel, PlantelIntegrante.id_plantel == Plantel.id_plantel)
                .filter(
                    PlantelIntegrante.id_fichaje_rol == fichaje.id_fichaje_rol,
                    PlantelIntegrante.fecha_baja.is_(None),
                    # Los planteles cerrados son historial: quedan como están.
                    Plantel.activo.is_(True),
                    Plantel.borrado_en.is_(None),
                )
                .all()
            )

            for integrante in integrantes_activos:
                integrante.fecha_baja = fecha_fin
                integrante.actualizado_por = actualizado_por
                integrantes_dados_de_baja += 1

        db.commit()

        return {
            "id_persona": id_persona,
            "id_club": id_club,
            "roles_dados_de_baja": roles_dados_de_baja,
            "planteles_dados_de_baja": integrantes_dados_de_baja,
            "fecha_fin": fecha_fin,
        }

    except Exception as e:
        db.rollback()
        print(f"Error en DB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflicto de integridad: {str(e)}"
        )
