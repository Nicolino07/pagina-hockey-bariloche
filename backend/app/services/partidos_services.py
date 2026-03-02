from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from sqlalchemy import or_, text


from app.models.partido import Partido, PartidoDetallado
from app.models.participan_partido import ParticipanPartido
from app.models.gol import Gol
from app.models.tarjeta import Tarjeta
from app.models.plantel_integrante import PlantelIntegrante


def crear_planilla_partido(db: Session, data, current_user):
    try:
        # =========================
        # 1️⃣ Crear partido
        # =========================
        partido = Partido(**data.partido.dict())
        partido.estado_partido = "BORRADOR"
        partido.creado_por = current_user.username

        db.add(partido)
        db.flush()  # tenemos id_partido

        # =========================
        # 2️⃣ Crear participantes
        # =========================
        participantes_map = {}  # id_plantel_integrante -> id_participante_partido

        # Combinamos ambas listas de objetos (ParticipanteConCamiseta)
        todos_los_participantes = data.participantes.local + data.participantes.visitante

        for p in todos_los_participantes:
            # 💡 CAMBIO: Ahora p es un objeto, extraemos sus atributos
            id_pi = p.id_plantel_integrante
            camiseta = p.numero_camiseta

            # validar que exista el integrante
            integrante = db.get(PlantelIntegrante, id_pi)
            if not integrante:
                raise HTTPException(
                    400, f"Plantel integrante {id_pi} inexistente"
                )

            pp = ParticipanPartido(
                id_partido=partido.id_partido,
                id_plantel_integrante=id_pi,
                numero_camiseta=camiseta, 
                creado_por=current_user.username,
            )
            db.add(pp)
            db.flush()

            participantes_map[id_pi] = pp.id_participante_partido

        # =========================
        # 3️⃣ Cargar goles
        # =========================
        # (Este bloque no cambia porque g.id_plantel_integrante sigue siendo un ID)
        for g in data.goles:
            id_pp = participantes_map.get(g.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {g.id_plantel_integrante} no participa del partido",
                )

            db.add(
                Gol(
                    id_partido=partido.id_partido,
                    id_participante_partido=id_pp,
                    minuto=g.minuto,
                    cuarto=g.cuarto,
                    referencia_gol=g.referencia_gol,
                    es_autogol=g.es_autogol,
                    creado_por=current_user.username,
                )
            )

        # =========================
        # 4️⃣ Cargar tarjetas
        # =========================
        for t in data.tarjetas:
            id_pp = participantes_map.get(t.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {t.id_plantel_integrante} no participa del partido",
                )

            db.add(
                Tarjeta(
                    id_partido=partido.id_partido,
                    id_participante_partido=id_pp,
                    tipo=t.tipo,
                    minuto=t.minuto,
                    cuarto=t.cuarto,
                    observaciones=t.observaciones,
                    creado_por=current_user.username,
                )
            )

        # Disparo de triggers y fin
        partido.estado_partido = "TERMINADO"
        db.flush()
        db.commit()
        return partido

    except Exception as e:
        db.rollback()
        # Es mejor relanzar el error para ver qué pasó
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    





def get_ultimos_partidos(db: Session, torneo_id: int = None, limit: int = 5):
    query = db.query(PartidoDetallado)
    
    if torneo_id:
        query = query.filter(PartidoDetallado.id_torneo == torneo_id)
    
    # Ordenamos por fecha y hora descendente para ver lo más reciente primero
    return query.order_by(PartidoDetallado.fecha.desc(), PartidoDetallado.horario.desc()).limit(limit).all()

def get_partido_by_id(db: Session, partido_id: int):
    return db.query(PartidoDetallado).filter(PartidoDetallado.id_partido == partido_id).first()



def get_historial_por_equipo(db: Session, id_equipo: int, limit: int = 10):
    """
    Obtiene los últimos partidos de un equipo específico usando la vista detallada.
    """
    # Filtramos la vista donde el equipo sea local O visitante
    # Nota: Asegúrate de que los nombres de las columnas coincidan con tu modelo PartidoDetallado
    return (
        db.query(PartidoDetallado)
        .filter(
            or_(
                # Ajusta estos nombres según los atributos de tu clase PartidoDetallado
                # Si tu vista tiene id_equipo_local/visitante, úsalos así:
                PartidoDetallado.id_equipo_local == id_equipo,
                PartidoDetallado.id_equipo_visitante == id_equipo
            )
        )
        .order_by(PartidoDetallado.fecha.desc(), PartidoDetallado.horario.desc())
        .limit(limit)
        .all()
    )