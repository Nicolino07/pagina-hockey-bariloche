import enum

class GeneroPersonaTipo(str, enum.Enum):
    """Género biológico de una persona"""
    MASCULINO = 'MASCULINO'
    FEMENINO = 'FEMENINO'

class GeneroCompetenciaTipo(str, enum.Enum):
    """Género de la competencia/categoría"""
    MASCULINO = 'MASCULINO'
    FEMENINO = 'FEMENINO'
    MIXTO = 'MIXTO'

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

class TipoSuspension(str, enum.Enum):
    """Tipos de suspensión"""
    POR_PARTIDOS = 'POR_PARTIDOS'
    POR_FECHA = 'POR_FECHA'

class ReferenciaGol(str, enum.Enum):
    """Tipos de gol"""
    GJ = 'GJ'  # Gol jugada
    GC = 'GC'  # Gol corner corto
    GP = 'GP'  # Gol penal
    DP = 'DP'  # Definición penales

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