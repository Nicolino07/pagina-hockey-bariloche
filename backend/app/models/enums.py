import enum

class GeneroTipo(str, enum.Enum):
    """Género biológico de una persona"""
    MASCULINO = 'MASCULINO'
    FEMENINO = 'FEMENINO'


class CategoriaTipo(str, enum.Enum):
    """Nivel/categoría deportiva"""
    A = 'A'
    B = 'B'
    SUB_19 = 'SUB_19'
    SUB_16 = 'SUB_16'
    SUB_14 = 'SUB_14'
    SUB_12 = 'SUB_12'

class RolPersonaTipo(str, enum.Enum):
    """Rol global de una persona en el sistema"""
    JUGADOR = 'JUGADOR'
    ENTRENADOR = 'ENTRENADOR'
    ARBITRO = 'ARBITRO' 
    DELEGADO = 'DELEGADO'
    ASISTENTE = 'ASISTENTE'
    MEDICO = 'MEDICO'
    PREPARADOR_FISICO = 'PREPARADOR_FISICO'


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