from app.database import Base

from .club import Club
from .equipo import Equipo
from .persona import Persona
from .persona_rol import PersonaRol
from .torneo import Torneo
from .fase import Fase
from .plantel import Plantel
from .plantel_integrante import PlantelIntegrante
from .partido import Partido
from .participan_partido import ParticipanPartido
from .gol import Gol
from .tarjeta import Tarjeta
from .suspension import Suspension
from .posicion import Posicion


# Exportar todos los ENUMs 
from .enums import (
    GeneroPersonaTipo,
    GeneroCompetenciaTipo,
    CategoriaTipo,
    RolPersonaTipo,
    RolPlantelTipo,
    TipoTarjeta,
    TipoSuspension,
    ReferenciaGol,
    TipoFase
)