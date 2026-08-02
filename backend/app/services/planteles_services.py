# backend/app/services/planteles_services.py
from datetime import date, datetime
from app.schemas.plantel import PlantelCreate, PlantelUpdate
from sqlalchemy import func, or_
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session, joinedload

from app.models.equipo import Equipo
from app.models.persona import Persona
from app.models.plantel import Plantel
from app.models.fichaje_rol import FichajeRol
from app.models.plantel_integrante import PlantelIntegrante
from app.schemas.plantel_integrante import PlantelIntegranteCreate
from app.models.persona_rol import PersonaRol
from app.models.torneo import Torneo
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.enums import TipoSuspension
from app.core.exceptions import (
    NotFoundError,
    ConflictError,
    ValidationError,
)

def crear_plantel(
    *,
    db: Session,
    data: PlantelCreate,
    current_user,
) -> Plantel:
    """Crea un plantel para un equipo.

    Con `id_torneo` crea la nómina de ese torneo (un equipo puede tener varias
    simultáneas, una por torneo). Sin `id_torneo` crea un plantel histórico,
    donde sigue rigiendo la regla vieja de uno solo activo por equipo.
    """
    equipo = db.get(Equipo, data.id_equipo)
    if not equipo or equipo.borrado_en is not None:
        raise NotFoundError("Equipo no encontrado")

    nombre = data.nombre
    temporada = data.temporada

    if data.id_torneo is not None:
        torneo = db.get(Torneo, data.id_torneo)
        if not torneo or torneo.borrado_en is not None:
            raise NotFoundError("Torneo no encontrado")

        # Los playoffs comparten la nómina de su torneo base: crear un plantel
        # propio lo dejaría inalcanzable para el resolver.
        if torneo.torneo_base_id:
            raise ValidationError(
                "Este torneo es una fase final y usa el plantel de su torneo base. "
                "Cargá la nómina en el torneo base."
            )

        inscripto = (
            db.query(InscripcionTorneo)
            .filter(
                InscripcionTorneo.id_equipo == data.id_equipo,
                InscripcionTorneo.id_torneo == data.id_torneo,
                InscripcionTorneo.fecha_baja.is_(None),
            )
            .first()
        )
        if not inscripto:
            raise ValidationError(
                "El equipo no está inscripto en ese torneo. Inscribilo primero."
            )

        duplicado = (
            db.query(Plantel)
            .filter(
                Plantel.id_equipo == data.id_equipo,
                Plantel.id_torneo == data.id_torneo,
                Plantel.borrado_en.is_(None),
            )
            .first()
        )
        if duplicado:
            raise ConflictError("Ese equipo ya tiene un plantel para este torneo")

        # Datos derivables del torneo, para que el formulario no los pida.
        if not nombre:
            nombre = f"{equipo.nombre} - {torneo.nombre}"
        if not temporada and torneo.fecha_inicio:
            temporada = str(torneo.fecha_inicio.year)
    else:
        # Plantel histórico: se mantiene la regla previa de uno activo por equipo.
        existente = (
            db.query(Plantel)
            .filter(
                Plantel.id_equipo == data.id_equipo,
                Plantel.id_torneo.is_(None),
                Plantel.activo.is_(True),
                Plantel.borrado_en.is_(None),
            )
            .first()
        )
        if existente:
            raise ConflictError("Ya existe un plantel activo para ese equipo")

        if not nombre:
            raise ValidationError("El nombre del plantel es obligatorio")

    plantel = Plantel(
        id_equipo=data.id_equipo,
        id_torneo=data.id_torneo,
        nombre=nombre,
        temporada=temporada,
        descripcion=data.descripcion,
        fecha_apertura=data.fecha_apertura or date.today(),
        fecha_cierre=data.fecha_cierre,
        activo=data.activo,
        creado_por=current_user.username,
    )

    db.add(plantel)
    db.flush()  # genera id_plantel

    return plantel


def torneos_disponibles_para_plantel(db: Session, id_equipo: int) -> list[Torneo]:
    """Torneos a los que se le puede crear una nómina a este equipo.

    Devuelve exactamente el conjunto que `crear_plantel` aceptaría: torneos
    activos, donde el equipo está inscripto, que no sean fase final (usan el
    plantel del torneo base) y donde todavía no tenga plantel. Así el selector
    no ofrece opciones que van a terminar en error.
    """
    ya_con_plantel = (
        db.query(Plantel.id_torneo)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.id_torneo.isnot(None),
            Plantel.borrado_en.is_(None),
        )
    )

    return (
        db.query(Torneo)
        .join(InscripcionTorneo, InscripcionTorneo.id_torneo == Torneo.id_torneo)
        .filter(
            InscripcionTorneo.id_equipo == id_equipo,
            InscripcionTorneo.fecha_baja.is_(None),
            Torneo.activo.is_(True),
            Torneo.borrado_en.is_(None),
            Torneo.torneo_base_id.is_(None),
            Torneo.id_torneo.notin_(ya_con_plantel),
        )
        .order_by(Torneo.fecha_inicio.desc(), Torneo.nombre)
        .all()
    )


def crear_integrante(
    *,
    db: Session,
    data: PlantelIntegranteCreate,
    current_user,
) -> PlantelIntegrante:
    """
    Agrega un integrante al plantel.
    REQUISITO: La persona debe estar previamente fichada en el club.
    """

    # ============================================
    # 1️⃣ VALIDAR PLANTEL
    # ============================================
    id_plantel = data.id_plantel
    plantel = db.get(Plantel, id_plantel)

    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    if plantel.borrado_en is not None:
        raise ValidationError("No se puede modificar un plantel eliminado")

    # Un plantel cerrado es de solo lectura: o el torneo terminó (y esa nómina
    # ya es un hecho histórico), o se cerró a mano.
    if not plantel.activo:
        raise ValidationError(
            "El plantel está cerrado y no se puede modificar. "
            "Si el torneo terminó, su nómina queda fija."
        )

    # ============================================
    # 2️⃣ OBTENER ID_CLUB DEL PLANTEL
    # ============================================
    id_club = (
        db.query(Equipo.id_club)
        .join(Plantel, Plantel.id_equipo == Equipo.id_equipo)
        .filter(Plantel.id_plantel == id_plantel)
        .scalar()
    )

    if not id_club:
        raise ValidationError("No se pudo obtener el club del plantel")

    # ============================================
    # 3️⃣ VALIDAR QUE EXISTE FICHAJE ACTIVO
    # ============================================
    fichaje = (
        db.query(FichajeRol)
        .filter(
            FichajeRol.id_persona == data.id_persona,
            FichajeRol.id_club == id_club,
            FichajeRol.rol == data.rol_en_plantel,
            FichajeRol.activo.is_(True),
            FichajeRol.fecha_fin.is_(None),
        )
        .first()
    )

    if not fichaje:
        raise ValidationError(
            f"La persona no está fichada en este club con el rol {data.rol_en_plantel}. "
            f"Debe ficharla primero antes de agregarla al plantel."
        )

    # ============================================
    # 4️⃣ VALIDACIONES DE NEGOCIO
    # ============================================
    validar_genero_para_jugador(
        db,
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
    )

    # No se puede incluir en un plantel a una persona con una suspensión
    # global (sin torneo de origen) POR_FECHA vigente en ese rol.
    from app.services.suspensiones_services import listar_suspensiones_activas_por_personas
    suspensiones = listar_suspensiones_activas_por_personas(
        db, [data.id_persona], rol=data.rol_en_plantel, tipo_suspension=TipoSuspension.POR_FECHA
    )
    activas = suspensiones.get(data.id_persona)
    if activas:
        s = activas[0]
        raise ConflictError(
            f"No se puede incluir en el plantel: suspensión activa hasta "
            f"{s.fecha_fin_suspension} ({s.motivo})."
        )

    # ============================================
    # 5️⃣ VERIFICAR SI YA EXISTE EL INTEGRANTE
    # ============================================
    existente = (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_persona == data.id_persona,
            PlantelIntegrante.rol_en_plantel == data.rol_en_plantel,
        )
        .first()
    )

    # ============================================
    # 6️⃣ EXISTE Y ESTÁ ACTIVO
    # ============================================
    if existente and existente.fecha_baja is None:
        raise ConflictError(
            "La persona ya está activa en el plantel con ese rol"
        )

    # ============================================
    # 7️⃣ EXISTE PERO ESTÁ DE BAJA → RESTAURAR
    # ============================================
    if existente and existente.fecha_baja is not None:
        existente.fecha_baja = None
        existente.fecha_alta = date.today()
        existente.numero_camiseta = data.numero_camiseta
        existente.id_fichaje_rol = fichaje.id_fichaje_rol
        existente.actualizado_en = datetime.utcnow()
        existente.actualizado_por = current_user.username

        try:
            db.flush()
        except DBAPIError as e:
            db.rollback()
            mensaje = str(e.orig).lower() if e.orig else str(e).lower()

            if "otro equipo del mismo club" in mensaje:
                raise ConflictError(
                    "La persona ya está en otro equipo del mismo club para este torneo"
                )

            if "rol" in mensaje and "otro club" in mensaje:
                raise ConflictError(
                    "La persona ya tiene ese rol activo en otro club"
                )

            raise ValidationError(
                "No se pudo restaurar el integrante del plantel"
            )

        return existente

    # ============================================
    # 8️⃣ NO EXISTE → CREAR NUEVO
    # ============================================
    integrante = PlantelIntegrante(
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        id_fichaje_rol=fichaje.id_fichaje_rol,
        rol_en_plantel=data.rol_en_plantel,
        numero_camiseta=data.numero_camiseta,
        fecha_alta=date.today(),
        creado_por=current_user.username,
    )

    db.add(integrante)

    try:
        db.flush()
    except DBAPIError as e:
        db.rollback()
        mensaje = str(e.orig).lower() if e.orig else str(e).lower()

        if "otro equipo del mismo club" in mensaje:
            raise ConflictError(
                "La persona ya está en otro equipo del mismo club para este torneo"
            )

        if "rol" in mensaje and "otro club" in mensaje:
            raise ConflictError(
                "La persona ya tiene ese rol activo en otro club"
            )

        raise ValidationError(
            "No se pudo crear el integrante del plantel"
        )

    return integrante

def validar_rol_persona(
    db: Session,
    *,
    id_persona: int,
    rol_en_plantel: str,
):
    rol_activo = (
        db.query(PersonaRol)
        .filter(
            PersonaRol.id_persona == id_persona,
            PersonaRol.rol == rol_en_plantel,
            PersonaRol.fecha_hasta.is_(None),
        )
        .first()
    )

    if not rol_activo:
        raise ValidationError(
            f"La persona no tiene habilitado el rol {rol_en_plantel}"
        )


def baja_integrante(
    db: Session,
    id_integrante: int,
    current_user,
) -> None:

    integrante = db.get(PlantelIntegrante, id_integrante)

    if not integrante:
        raise NotFoundError("Integrante no encontrado")

    if integrante.fecha_baja is not None:
        raise ValidationError("El integrante ya fue dado de baja")

    # Misma regla que en el alta: una nómina cerrada no se toca.
    plantel = db.get(Plantel, integrante.id_plantel)
    if plantel is not None and not plantel.activo:
        raise ValidationError(
            "El plantel está cerrado y no se puede modificar. "
            "Si el torneo terminó, su nómina queda fija."
        )

    integrante.fecha_baja = date.today()
    integrante.actualizado_por = current_user.username


def obtener_plantel(
    db: Session,
    id_plantel: int,
) -> Plantel:

    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    return plantel

def obtener_plantel_activo_por_equipo(
    db: Session,
    id_equipo: int,
) -> Plantel | None:

    return (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
        )
        .first()
    )

def listar_integrantes_por_plantel(db: Session, id_plantel: int, solo_activos: bool = True):
    """Devuelve los integrantes de un plantel, con cuántos partidos jugó cada uno.

    Con `solo_activos=True` se ocultan los dados de baja **salvo que hayan
    jugado**: quien disputó un partido forma parte del registro del torneo y no
    puede desaparecer de la nómina, solo queda marcado como de baja.
    """
    from app.models.participan_partido import ParticipanPartido

    jugados = (
        db.query(
            ParticipanPartido.id_plantel_integrante.label("id_pi"),
            func.count(ParticipanPartido.id_participante_partido).label("partidos"),
        )
        .group_by(ParticipanPartido.id_plantel_integrante)
        .subquery()
    )

    query = (
        db.query(PlantelIntegrante, func.coalesce(jugados.c.partidos, 0))
        .options(joinedload(PlantelIntegrante.persona))
        .outerjoin(jugados, jugados.c.id_pi == PlantelIntegrante.id_plantel_integrante)
        .filter(PlantelIntegrante.id_plantel == id_plantel)
    )
    if solo_activos:
        query = query.filter(
            or_(
                PlantelIntegrante.fecha_baja.is_(None),
                func.coalesce(jugados.c.partidos, 0) > 0,
            )
        )

    filas = query.order_by(
        PlantelIntegrante.rol_en_plantel, PlantelIntegrante.fecha_alta
    ).all()

    resultado = []
    for integrante, partidos in filas:
        # Campo calculado: el schema lo expone y el frontend decide con él si
        # puede quitarlo o solo marcarle el estado.
        integrante.partidos_jugados = partidos
        resultado.append(integrante)
    return resultado

def listar_integrantes_activos(
    db: Session,
    id_plantel: int,
):
    return (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.fecha_baja.is_(None),
        )
        .all()
    )


def dependencias_plantel(db: Session, id_plantel: int) -> dict:
    """Informa si un plantel se puede eliminar y qué lo estaría bloqueando.

    Lo que hace historia no es tener integrantes cargados, sino haber jugado:
    un plantel de prueba con jugadores pero sin un solo partido se puede borrar
    sin perder nada. En cambio, si alguno de sus integrantes participó de un
    partido o fue capitán, borrarlo arrastraría goles y tarjetas por el
    ON DELETE CASCADE de `participan_partido`. No borra nada.
    """
    from app.models.participan_partido import ParticipanPartido
    from app.models.partido import Partido

    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    integrantes = db.query(PlantelIntegrante).filter(
        PlantelIntegrante.id_plantel == id_plantel
    ).count()

    participaciones = (
        db.query(ParticipanPartido)
        .join(
            PlantelIntegrante,
            PlantelIntegrante.id_plantel_integrante == ParticipanPartido.id_plantel_integrante,
        )
        .filter(PlantelIntegrante.id_plantel == id_plantel)
        .count()
    )

    # Un capitán queda referenciado desde `partido` aunque no tenga fila en
    # participan_partido; borrarlo pondría esa referencia en NULL.
    capitanias = (
        db.query(Partido)
        .join(
            PlantelIntegrante,
            or_(
                PlantelIntegrante.id_plantel_integrante == Partido.id_capitan_local,
                PlantelIntegrante.id_plantel_integrante == Partido.id_capitan_visitante,
            ),
        )
        .filter(PlantelIntegrante.id_plantel == id_plantel)
        .count()
    )

    return {
        "id_plantel": id_plantel,
        "nombre": plantel.nombre,
        "integrantes": integrantes,
        "participaciones": participaciones,
        "capitanias": capitanias,
        "puede_eliminar": participaciones == 0 and capitanias == 0,
    }


def eliminar_plantel(
    db: Session,
    id_plantel: int,
    current_user,
) -> dict:
    """Elimina un plantel de forma DEFINITIVA, junto con sus integrantes.

    Solo se permite si nunca se jugó un partido con esa nómina. Un plantel
    cargado por error, aunque tenga jugadores, no es historia de nada y puede
    borrarse. Uno que jugó, no: arrastraría goles y tarjetas por el
    ON DELETE CASCADE de `participan_partido`.
    """
    from app.models.auditoria_log import AuditoriaLog

    dep = dependencias_plantel(db, id_plantel)
    if not dep["puede_eliminar"]:
        raise ConflictError(
            f"No se puede eliminar el plantel '{dep['nombre']}': ya se jugaron "
            f"partidos con esta nómina ({dep['participaciones']} participaciones, "
            f"{dep['capitanias']} capitanías). Borrarlo perdería goles y tarjetas."
        )

    db.add(AuditoriaLog(
        tabla_afectada="plantel",
        id_registro=str(id_plantel),
        operacion="DELETE",
        valores_anteriores=dep,
        id_usuario=current_user.id_usuario,
    ))
    # El FK de plantel_integrante es ON DELETE RESTRICT, así que hay que
    # borrarlos primero. Es seguro: acabamos de verificar que ninguno jugó.
    db.query(PlantelIntegrante).filter(
        PlantelIntegrante.id_plantel == id_plantel
    ).delete(synchronize_session=False)
    db.query(Plantel).filter(
        Plantel.id_plantel == id_plantel
    ).delete(synchronize_session=False)
    return dep


def listar_planteles_por_equipo(
    db: Session,
    id_equipo: int,
) -> list[Plantel]:
    """Devuelve todos los planteles de un equipo (activos e históricos), excluyendo los eliminados."""
    return (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.borrado_en.is_(None),
        )
        .order_by(Plantel.fecha_apertura.desc())
        .all()
    )


def actualizar_plantel(
    db: Session,
    id_plantel: int,
    data: PlantelUpdate,
    current_user,
) -> Plantel:
    """Actualiza los campos editables de un plantel. No permite editar planteles eliminados."""
    plantel = db.get(Plantel, id_plantel)

    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    if plantel.borrado_en is not None:
        raise ValidationError("No se puede editar un plantel eliminado")

    if data.nombre is not None:
        plantel.nombre = data.nombre
    if data.temporada is not None:
        plantel.temporada = data.temporada
    if data.descripcion is not None:
        plantel.descripcion = data.descripcion

    plantel.actualizado_en = datetime.utcnow()
    plantel.actualizado_por = current_user.username

    db.flush()
    return plantel


def validar_genero_para_jugador(
    db: Session,
    *,
    id_plantel: int,
    id_persona: int,
    rol_en_plantel: str,
) -> None:
    # 🔓 Solo validamos si es JUGADOR
    if rol_en_plantel != "JUGADOR":
        return

    genero_equipo = (
        db.query(Equipo.genero)
        .join(Plantel, Plantel.id_equipo == Equipo.id_equipo)
        .filter(Plantel.id_plantel == id_plantel)
        .scalar()
    )

    if genero_equipo is None:
        raise ValidationError("No se pudo determinar el género del equipo")

    genero_persona = (
        db.query(Persona.genero)
        .filter(Persona.id_persona == id_persona)
        .scalar()
    )

    if genero_persona is None:
        raise ValidationError("No se pudo determinar el género de la persona")

    # Equipo MIXTO acepta jugadores de cualquier género
    if genero_equipo == "MIXTO":
        return

    if genero_equipo != genero_persona:
        raise ValidationError(
            "El género de la persona no coincide con el del equipo"
        )


def copiar_plantel(
    *,
    db: Session,
    id_plantel_origen: int,
    id_torneo_destino: int | None = None,
    id_plantel_destino: int | None = None,
    current_user,
) -> dict:
    """Copia la nómina de un plantel hacia otro plantel del mismo equipo.

    Se puede copiar hacia un plantel que ya existe (`id_plantel_destino`, para
    llenar de golpe una nómina recién creada y después ajustarla a mano) o
    hacia un torneo, creando el plantel en el acto (`id_torneo_destino`).

    La copia va **fila por fila** a propósito: las validaciones de negocio y
    los triggers de la base son BEFORE INSERT por fila, así que un
    INSERT ... SELECT los saltearía.

    Los integrantes que ya no son elegibles (fichaje vencido, suspensión,
    género que no corresponde) no abortan la operación: se devuelven en
    `omitidos` con el motivo, para que el admin los resuelva a mano. Los que ya
    estaban en el destino se omiten sin ruido.

    Nunca borra nada, ni del origen ni del destino.
    """
    origen = db.get(Plantel, id_plantel_origen)
    if not origen or origen.borrado_en is not None:
        raise NotFoundError("Plantel de origen no encontrado")

    if id_plantel_destino is not None:
        destino = db.get(Plantel, id_plantel_destino)
        if not destino or destino.borrado_en is not None:
            raise NotFoundError("Plantel de destino no encontrado")
        if destino.id_equipo != origen.id_equipo:
            raise ValidationError("Solo se puede copiar entre planteles del mismo equipo")
        if destino.id_plantel == origen.id_plantel:
            raise ValidationError("El plantel de origen y el de destino son el mismo")
        if not destino.activo:
            raise ValidationError("El plantel de destino está cerrado y no se puede modificar")
    elif id_torneo_destino is not None:
        destino = crear_plantel(
            db=db,
            data=PlantelCreate(
                id_equipo=origen.id_equipo,
                id_torneo=id_torneo_destino,
                descripcion=f"Copiado del plantel #{origen.id_plantel}",
            ),
            current_user=current_user,
        )
    else:
        raise ValidationError("Indicá el plantel o el torneo de destino")

    # Ya presentes en el destino: se saltean en silencio, no son un error.
    ya_estan = {
        row[0] for row in db.query(PlantelIntegrante.id_persona)
        .filter(
            PlantelIntegrante.id_plantel == destino.id_plantel,
            PlantelIntegrante.fecha_baja.is_(None),
        ).all()
    }

    integrantes = (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel_origen,
            PlantelIntegrante.fecha_baja.is_(None),
        )
        .all()
    )

    copiados = 0
    omitidos: list[dict] = []

    for integrante in integrantes:
        if integrante.id_persona in ya_estan:
            continue
        persona = db.get(Persona, integrante.id_persona)
        nombre = f"{persona.apellido}, {persona.nombre}" if persona else f"#{integrante.id_persona}"
        try:
            # Punto de guardado propio: si un integrante falla, se descarta solo
            # ese INSERT y la copia sigue con el resto.
            with db.begin_nested():
                crear_integrante(
                    db=db,
                    data=PlantelIntegranteCreate(
                        id_plantel=destino.id_plantel,
                        id_persona=integrante.id_persona,
                        id_fichaje_rol=integrante.id_fichaje_rol,
                        rol_en_plantel=integrante.rol_en_plantel,
                        numero_camiseta=integrante.numero_camiseta,
                    ),
                    current_user=current_user,
                )
            copiados += 1
        except Exception as e:
            motivo = getattr(e, "detail", None) or str(e)
            omitidos.append({
                "id_persona": integrante.id_persona,
                "nombre": nombre,
                "motivo": motivo,
            })

    return {
        "id_plantel_destino": destino.id_plantel,
        "copiados": copiados,
        "omitidos": omitidos,
    }


def cerrar_planteles_de_torneo(db: Session, id_torneo: int, current_user) -> int:
    """Cierra las nóminas de un torneo al finalizarlo.

    Un plantel que ya jugó no debe poder editarse: cerrarlo lo vuelve de solo
    lectura (ver la validación en `crear_integrante` / `baja_integrante`).

    Los torneos de playoff no tienen plantel propio (usan el del torneo base),
    así que finalizar uno no cierra nada.
    """
    planteles = (
        db.query(Plantel)
        .filter(
            Plantel.id_torneo == id_torneo,
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
        )
        .all()
    )

    hoy = date.today()
    for plantel in planteles:
        plantel.activo = False
        # chk_plantel_cierre_si_inactivo exige fecha_cierre, y
        # chk_plantel_fechas_validas exige que no sea anterior a la apertura.
        plantel.fecha_cierre = plantel.fecha_cierre or max(hoy, plantel.fecha_apertura)
        plantel.actualizado_por = current_user.username if current_user else None

    db.flush()
    return len(planteles)


def reabrir_planteles_de_torneo(db: Session, id_torneo: int, current_user) -> int:
    """Reabre las nóminas de un torneo que se vuelve a activar.

    Simétrico a `cerrar_planteles_de_torneo`: si el torneo se reabrió para
    corregir algo, sus nóminas tienen que volver a ser editables.
    """
    planteles = (
        db.query(Plantel)
        .filter(
            Plantel.id_torneo == id_torneo,
            Plantel.activo.is_(False),
            Plantel.borrado_en.is_(None),
        )
        .all()
    )

    for plantel in planteles:
        plantel.activo = True
        plantel.fecha_cierre = None
        plantel.actualizado_por = current_user.username if current_user else None

    db.flush()
    return len(planteles)
