import enum

class GeneroTipo(str, enum.Enum):
    """Género biológico de una persona o tipo de competencia"""
    MASCULINO = 'MASCULINO'
    FEMENINO = 'FEMENINO'
    MIXTO = 'MIXTO'


class CategoriaTipo(str, enum.Enum):
    """Nivel/categoría deportiva"""
    MAYORES = 'MAYORES'
    SUB_19 = 'SUB_19'
    SUB_16 = 'SUB_16'
    SUB_14 = 'SUB_14'
    SUB_12 = 'SUB_12'

class RolPersonaTipo(str, enum.Enum):
    """Rol global de una persona en el sistema"""
    JUGADOR = 'JUGADOR'
    DT = 'DT'
    ARBITRO = 'ARBITRO'
    DELEGADO = 'DELEGADO'
    ASISTENTE = 'ASISTENTE'
    MEDICO = 'MEDICO'
    PREPARADOR_FISICO = 'PREPARADOR_FISICO'


#: Roles de cuerpo técnico: no son exclusivos de un club ni de un equipo.
#: La misma persona puede cumplirlos en varios equipos y clubes dentro del
#: mismo torneo. Espejo Python de la función SQL `es_rol_cuerpo_tecnico`
#: (migración 0039): si cambia una, cambiar la otra.
ROLES_CUERPO_TECNICO: frozenset[str] = frozenset({
    RolPersonaTipo.DT.value,
    RolPersonaTipo.ARBITRO.value,
    RolPersonaTipo.ASISTENTE.value,
    RolPersonaTipo.MEDICO.value,
    RolPersonaTipo.PREPARADOR_FISICO.value,
})


def es_rol_cuerpo_tecnico(rol) -> bool:
    """Indica si el rol está exento de las reglas de exclusividad por club/equipo."""
    return getattr(rol, "value", rol) in ROLES_CUERPO_TECNICO


class EstadoPartido(str, enum.Enum):
    """Estado en el que se encuentra un partido"""
    BORRADOR = 'BORRADOR'
    PENDIENTE = 'PENDIENTE'
    TERMINADO = 'TERMINADO'
    SUSPENDIDO = 'SUSPENDIDO'
    ANULADO = 'ANULADO'
    REPROGRAMADO = 'REPROGRAMADO'

class TipoTarjeta(str, enum.Enum):
    """Tipos de tarjeta disciplinaria"""
    VERDE = 'VERDE'
    AMARILLA = 'AMARILLA'
    ROJA = 'ROJA'

class EstadoTarjeta(str, enum.Enum):
    """Estado de la tarjeta disciplinaria"""
    VALIDA = 'VALIDA'
    ANULADA = 'ANULADA'
    CORREGIDA = 'CORREGIDA'

class TipoSuspension(str, enum.Enum):
    """Tipos de suspensión"""
    POR_PARTIDOS = 'POR_PARTIDOS'
    POR_FECHA = 'POR_FECHA'

class EstadoSuspension(str, enum.Enum):
    """Estado de la suspensión"""
    ACTIVA = 'ACTIVA'
    CUMPLIDA = 'CUMPLIDA'
    ANULADA = 'ANULADA'

class OrigenSuspension(str, enum.Enum):
    """Origen de la suspensión"""
    AUTOMATICA_AMARILLAS = 'AUTOMATICA_AMARILLAS'
    AUTOMATICA_ROJA = 'AUTOMATICA_ROJA'
    MANUAL = 'MANUAL'

class ReferenciaGol(str, enum.Enum):
    """Tipos de gol"""
    GJ = 'GJ'  # Gol jugada
    GC = 'GC'  # Gol corner corto
    GP = 'GP'  # Gol penal
    DP = 'DP'  # Definición penales

class EstadoGol(str, enum.Enum):
    """Estado del gol"""
    VALIDO = 'VALIDO'
    ANULADO = 'ANULADO'
    CORREGIDO = 'CORREGIDO'

class TipoTorneo(str, enum.Enum):
    """Tipo de competencia"""
    LIGA = 'LIGA'
    PLAYOFF = 'PLAYOFF'
    COPA = 'COPA'

class TipoFase(str, enum.Enum):
    """Tipos de fase de torneo"""
    LIGA = 'LIGA'
    ELIMINACION = 'ELIMINACION'
    GRUPOS = 'GRUPOS'

class TipoUsuario(str, enum.Enum):
    """Tipo de usuario"""
    SUPERUSUARIO = 'SUPERUSUARIO'
    ADMIN = 'ADMIN'
    EDITOR = 'EDITOR'
    LECTOR = 'LECTOR'
    ADMIN_ARBITROS = 'ADMIN_ARBITROS'