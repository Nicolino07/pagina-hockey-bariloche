-- =====================================================
-- 001_enums.sql
-- Tipos ENUM normalizados del sistema
-- Convención: UPPER_SNAKE_CASE
-- =====================================================

BEGIN;

-- =====================================================
-- Género de persona
-- =====================================================
CREATE TYPE tipo_genero AS ENUM (
  'MASCULINO',
  'FEMENINO'
);


-- =====================================================
-- Categoría deportiva
-- =====================================================
CREATE TYPE tipo_categoria AS ENUM (
  'A',
  'B',
  'SUB_19',
  'SUB_16',
  'SUB_14',
  'SUB_14_DESARROLLO',
  'SUB_12'
);

-- =====================================================
-- Rol de una persona
-- (puede tener varios en general, en equipo solo uno)
-- =====================================================
CREATE TYPE tipo_rol_persona AS ENUM (
  'JUGADOR',
  'ENTRENADOR',
  'ARBITRO',
  'ASISTENTE',
  'MEDICO',
  'PREPARADOR_FISICO',
  'DELEGADO'
);

-- ===============================================
-- Estado de un partido
-- ===============================================

CREATE TYPE tipo_estado_partido AS ENUM (
  'BORRADOR',
  'TERMINADO',
  'SUSPENDIDO',
  'ANULADO',
  'REPROGRAMADO'
);

-- =====================================================
-- Tipo de tarjeta
-- =====================================================
CREATE TYPE tipo_tarjeta AS ENUM (
  'VERDE',
  'AMARILLA',
  'ROJA'
);

-- =====================================================
-- Estado de tarjeta
-- =====================================================
CREATE TYPE tipo_estado_tarjeta AS ENUM (
  'VALIDA',
  'ANULADA',
  'CORREGIDA'
);

-- =====================================================
-- Tipo de suspensión
-- =====================================================
CREATE TYPE tipo_suspension AS ENUM (
  'POR_PARTIDOS',
  'POR_FECHA'
);

-- =====================================================
-- Estado de suspensión
-- =====================================================

CREATE TYPE tipo_estado_suspension AS ENUM (
    'ACTIVA',
    'CUMPLIDA',
    'ANULADA'
);


-- =====================================================
-- Tipo de gol
-- =====================================================
CREATE TYPE tipo_gol AS ENUM (
  'GJ', -- Gol de jugada
  'GC', -- Gol de córner
  'GP', -- Gol de penal
  'DP'  -- Desvío penal
);

-- =====================================================
-- Estado de gol
-- =====================================================
CREATE TYPE tipo_estado_gol AS ENUM (
  'VALIDO',
  'ANULADO',
  'CORREGIDO'
);

-- =====================================================
-- Tipo de fase de competencia
-- =====================================================
CREATE TYPE tipo_fase AS ENUM (
  'LIGA',
  'ELIMINACION',
  'GRUPOS'
);

-- =====================================================
-- Tipo de usuario del sistema
-- =====================================================
CREATE TYPE tipo_usuario AS ENUM (
  'SUPERUSUARIO',
  'ADMIN',
  'EDITOR',
  'LECTOR'
);

COMMIT;
