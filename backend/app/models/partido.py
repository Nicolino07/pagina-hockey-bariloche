from datetime import datetime, date, time
from typing import Optional
from app.models.enums import EstadoPartido, MotivoPuntos
from app.models.mixins import AuditFieldsMixin
from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Date,
    Time,
    CheckConstraint,
    UniqueConstraint,
    Column,
    Enum,
    Boolean,
    DateTime
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Partido(Base, AuditFieldsMixin):
    __tablename__ = "partido"

    __table_args__ = (
        CheckConstraint(
            "id_inscripcion_local <> id_inscripcion_visitante",
            name="chk_partido_equipos_distintos"
        ),
        CheckConstraint(
            "id_arbitro1 IS DISTINCT FROM id_arbitro2",
            name="chk_partido_arbitros_distintos"
        ),
        CheckConstraint(
            "id_capitan_local IS DISTINCT FROM id_capitan_visitante",
            name="chk_partido_capitanes_distintos"
        ),
        UniqueConstraint(
            "id_torneo",
            "fecha",
            "id_inscripcion_local",
            "id_inscripcion_visitante",
            name="partido_unq_equipo_fecha"
        ),
    )

    id_partido: Mapped[int] = mapped_column(primary_key=True)

    # Contexto
    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"),
        nullable=False
    )

    id_fase: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fase.id_fase", ondelete="SET NULL")
    )

    fecha: Mapped[Optional[date]] = mapped_column(Date)

    horario: Mapped[Optional[time]] = mapped_column(Time)

    # Equipos (inscripción opcional; se deriva de equipo + torneo cuando hace falta)
    id_inscripcion_local: Mapped[Optional[int]] = mapped_column(
        ForeignKey("inscripcion_torneo.id_inscripcion", ondelete="RESTRICT")
    )

    id_inscripcion_visitante: Mapped[Optional[int]] = mapped_column(
        ForeignKey("inscripcion_torneo.id_inscripcion", ondelete="RESTRICT")
    )

    # Referencia directa a equipos (nullable: soporta placeholders de playoff)
    id_equipo_local: Mapped[Optional[int]] = mapped_column(
        ForeignKey("equipo.id_equipo", ondelete="RESTRICT")
    )
    id_equipo_visitante: Mapped[Optional[int]] = mapped_column(
        ForeignKey("equipo.id_equipo", ondelete="RESTRICT")
    )
    placeholder_local: Mapped[Optional[str]] = mapped_column(String(100))
    placeholder_visitante: Mapped[Optional[str]] = mapped_column(String(100))

    # Agrupación del calendario (jornada / ronda de playoff)
    id_fixture_fecha: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fixture_fecha.id_fixture_fecha", ondelete="SET NULL")
    )
    id_fixture_playoff_ronda: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fixture_playoff_ronda.id_fixture_playoff_ronda", ondelete="SET NULL")
    )

    # Arbitraje
    id_arbitro1: Mapped[Optional[int]] = mapped_column(
        ForeignKey("persona.id_persona", ondelete="SET NULL")
    )

    id_arbitro2: Mapped[Optional[int]] = mapped_column(
        ForeignKey("persona.id_persona", ondelete="SET NULL")
    )

    # Capitanes
    id_capitan_local: Mapped[Optional[int]] = mapped_column(
        ForeignKey(
            "plantel_integrante.id_plantel_integrante",
            ondelete="SET NULL"
        )
    )

    id_capitan_visitante: Mapped[Optional[int]] = mapped_column(
        ForeignKey(
            "plantel_integrante.id_plantel_integrante",
            ondelete="SET NULL"
        )
    )

    estado_partido: Mapped[EstadoPartido] = mapped_column(
        Enum(
            EstadoPartido,
            name="tipo_estado_partido",
            native_enum=True
        ),
        nullable=False
    )

    # Resultado manual (solo para categorías sin desglose de goles, ej: SUB_12)
    goles_local_manual: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    goles_visitante_manual: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Goles por defecto (cuando se otorga puntos por descalificación, no presentación, etc.)
    goles_por_defecto_local: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    goles_por_defecto_visitante: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- Entrega de puntos (walkover) ---
    #: Obligatorio al otorgar puntos. Es lo que se muestra en el detalle.
    motivo_puntos: Mapped[Optional[MotivoPuntos]] = mapped_column(
        Enum(MotivoPuntos, name="tipo_motivo_puntos"), nullable=True
    )
    #: Aclaración interna. NO se muestra en las vistas públicas.
    descripcion_puntos: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    #: Cuando no se presentó ninguno y se decide no darle puntos a nadie.
    sin_puntos: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Mesa / organización
    juez_mesa_local: Mapped[Optional[str]] = mapped_column(String(100))
    juez_mesa_visitante: Mapped[Optional[str]] = mapped_column(String(100))

    ubicacion: Mapped[Optional[str]] = mapped_column(String(200))
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    numero_fecha: Mapped[Optional[int]] = mapped_column(Integer)

    # Relaciones
    torneo = relationship("Torneo")
    fase = relationship("Fase")

    participantes = relationship(
        "ParticipanPartido",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

    goles = relationship(
        "Gol",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

    tarjetas = relationship(
        "Tarjeta",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

    penales = relationship(
        "PenalDefinicion",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

# Modelo para vista de paridos

class PartidoDetallado(Base):
    __tablename__ = 'vw_partidos_detallados'
    
    id_partido = Column(Integer, primary_key=True)
    id_torneo = Column(Integer)
    id_equipo_local = Column(Integer)
    id_equipo_visitante = Column(Integer)
    id_club_local = Column(Integer)
    id_club_visitante = Column(Integer)
    nombre_torneo = Column(String)
    categoria_torneo = Column(String)
    genero_torneo = Column(String)
    division_torneo = Column(String)
    fecha = Column(Date)
    horario = Column(Time)
    ubicacion = Column(String)
    numero_fecha = Column(Integer)
    observaciones = Column(String)
    creado_por = Column(String)
    creado_en = Column(DateTime)
    
    equipo_local_nombre = Column(String)
    equipo_visitante_nombre = Column(String)
    goles_local = Column(Integer)
    goles_visitante = Column(Integer)

    # --- NUEVOS CAMPOS AGREGADOS ---
    nombre_arbitro1 = Column(String)
    nombre_arbitro2 = Column(String)
    arbitros = Column(String) # Este trae el string: "Apellido Nombre; Apellido Nombre"
    juez_mesa_local = Column(String)
    juez_mesa_visitante = Column(String)
    # -------------------------------
    
    # Estos traen los strings concatenados "Apellido|Min|Cuarto|Extra"
    lista_jugadores_local = Column(String)
    lista_jugadores_visitante = Column(String)
    lista_goles_local = Column(String)
    lista_tarjetas_local = Column(String)
    lista_goles_visitante = Column(String)
    lista_tarjetas_visitante = Column(String)

    # La definición por penales vive en su propia vista, no acá dentro: un penal
    # de la tanda no es un gol y no puede contaminar el marcador. Se engancha
    # por relación para exponerla en la misma respuesta, en campos aparte.
    penales = relationship(
        "PenalesPartido",
        primaryjoin="foreign(PenalesPartido.id_partido) == PartidoDetallado.id_partido",
        uselist=False,
        viewonly=True,
        lazy="joined",
    )

    @property
    def penales_local(self) -> int:
        """Penales convertidos por el local en la tanda (0 si no hubo tanda)."""
        return self.penales.penales_local if self.penales else 0

    @property
    def penales_visitante(self) -> int:
        """Penales convertidos por el visitante en la tanda (0 si no hubo tanda)."""
        return self.penales.penales_visitante if self.penales else 0

    @property
    def hubo_definicion_por_penales(self) -> bool:
        return bool(self.penales and (self.penales.total_penales or 0) > 0)

    @property
    def lista_penales_local(self):
        return self.penales.lista_penales_local if self.penales else None

    @property
    def lista_penales_visitante(self):
        return self.penales.lista_penales_visitante if self.penales else None

    # La entrega de puntos vive en `partido`, no en la vista. Se engancha por
    # relación para publicar el motivo en la misma respuesta.
    partido_base = relationship(
        "Partido",
        primaryjoin="foreign(PartidoDetallado.id_partido) == Partido.id_partido",
        uselist=False,
        viewonly=True,
        lazy="joined",
    )

    @property
    def motivo_puntos(self):
        """Motivo del walkover, o None si el partido se jugó normalmente."""
        if not self.partido_base or not self.partido_base.motivo_puntos:
            return None
        motivo = self.partido_base.motivo_puntos
        return getattr(motivo, "value", str(motivo))

    @property
    def sin_puntos(self) -> bool:
        return bool(self.partido_base and self.partido_base.sin_puntos)


class PenalesPartido(Base):
    """
    Vista `vw_penales_partido`: la tanda de cada partido, separada del marcador.
    Sólo lectura.
    """
    __tablename__ = 'vw_penales_partido'

    id_partido = Column(Integer, primary_key=True)
    id_inscripcion_local = Column(Integer)
    id_inscripcion_visitante = Column(Integer)
    penales_local = Column(Integer)
    penales_visitante = Column(Integer)
    total_penales = Column(Integer)
    lista_penales_local = Column(String)
    lista_penales_visitante = Column(String)