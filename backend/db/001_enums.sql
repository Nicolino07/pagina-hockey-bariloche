-- =====================================================
-- 001_enums.sql
-- Tipos ENUM del sistema
-- =====================================================

BEGIN;

-- -----------------------------
-- Personas / Competencias
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genero_persona_tipo') THEN
    CREATE TYPE genero_persona_tipo AS ENUM ('Masculino', 'Femenino');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genero_competencia_tipo') THEN
    CREATE TYPE genero_competencia_tipo AS ENUM ('Masculino', 'Femenino', 'Mixto');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_tipo') THEN
    CREATE TYPE categoria_tipo AS ENUM ('A', 'B', 'Sub 19', 'Sub 16', 'Sub 14', 'Sub 12');
  END IF;
END$$;

-- -----------------------------
-- Roles
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_persona_tipo') THEN
    CREATE TYPE rol_persona_tipo AS ENUM ('jugador', 'entrenador', 'arbitro');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_plantel_tipo') THEN
    CREATE TYPE rol_plantel_tipo AS ENUM ('jugador', 'entrenador');
  END IF;
END$$;

-- -----------------------------
-- Partido / Disciplina
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_tarjeta_enum') THEN
    CREATE TYPE tipo_tarjeta_enum AS ENUM ('verde', 'amarilla', 'roja');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_suspension_enum') THEN
    CREATE TYPE tipo_suspension_enum AS ENUM ('por_partidos', 'por_fecha');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referencia_gol_enum') THEN
    CREATE TYPE referencia_gol_enum AS ENUM ('GJ', 'GC', 'GP', 'DP');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_fase_enum') THEN
    CREATE TYPE tipo_fase_enum AS ENUM ('liga', 'eliminacion', 'grupos');
  END IF;
END$$;

-- -----------------------------
-- Seguridad / Usuarios
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo') THEN
    CREATE TYPE usuario_tipo AS ENUM ('superusuario', 'admin', 'editor', 'lector');
  END IF;
END$$;

DO $$

BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operacion_permiso_tipo') THEN
    CREATE TYPE operacion_permiso_tipo AS ENUM ('select', 'insert', 'update', 'delete');
  END IF;
END$$;

COMMIT;
