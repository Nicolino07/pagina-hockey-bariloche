import enum

class GeneroPersonaTipo(str, enum.Enum):
    """Género biológico de una persona"""
    MASCULINO = 'Masculino'
    FEMENINO = 'Femenino'

class GeneroCompetenciaTipo(str, enum.Enum):
    """Género de la competencia/categoría"""
    MASCULINO = 'Masculino'
    FEMENINO = 'Femenino'
    MIXTO = 'Mixto'

class CategoriaTipo(str, enum.Enum):
    """Nivel/categoría deportiva"""
    A = 'A'
    B = 'B'
    SUB_19 = 'Sub 19'
    SUB_16 = 'Sub 16'
    SUB_14 = 'Sub 14'
    SUB_12 = 'Sub 12'

class RolPersonaTipo(str, enum.Enum):
    """Rol global de una persona en el sistema"""
    JUGADOR = 'jugador'
    ENTRENADOR = 'entrenador'
    ARBITRO = 'arbitro' 
    DELEGADO = 'delegado'
    ASISTENTE = 'asistente'
    MEDICO = 'medico'
    PREPARADOR_FISICO = 'preparador_fisico'


class TipoTarjeta(str, enum.Enum):
    """Tipos de tarjeta disciplinaria"""
    VERDE = 'verde'
    AMARILLA = 'amarilla'
    ROJA = 'roja'

class TipoSuspension(str, enum.Enum):
    """Tipos de suspensión"""
    POR_PARTIDOS = 'por_partidos'
    POR_FECHA = 'por_fecha'

class ReferenciaGol(str, enum.Enum):
    """Tipos de gol"""
    GJ = 'GJ'  # Gol jugada
    GC = 'GC'  # Gol corner corto
    GP = 'GP'  # Gol penal
    DP = 'DP'  # Definición penales

class TipoFase(str, enum.Enum):
    """Tipos de fase de torneo"""
    LIGA = 'liga'
    ELIMINACION = 'eliminacion'
    GRUPOS = 'grupos'

class TipoUsuario(str, enum.Enum):
    """Tipo de usuario"""
    SUPERUSUARIO = 'superusuario'
    ADMIN = 'admin'
    EDITOR = 'editor'
    LECTOR = 'lector'