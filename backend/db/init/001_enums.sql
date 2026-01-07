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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_genero_persona') THEN
    CREATE TYPE tipo_genero_persona AS ENUM ('Masculino', 'Femenino');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_genero_competencia') THEN
    CREATE TYPE tipo_genero_competencia AS ENUM ('Masculino', 'Femenino', 'Mixto');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_categoria') THEN
    CREATE TYPE tipo_categoria AS ENUM ('A', 'B', 'Sub 19', 'Sub 16', 'Sub 14', 'Sub 14 desarrollo', 'Sub 12');
  END IF;
END$$;
-- -----------------------------
-- Roles
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_rol_persona') THEN
    CREATE TYPE tipo_rol_persona AS ENUM ('jugador', 'entrenador', 'arbitro','asistente', 'medico', 'preparador fisico', 'delegado');
  END IF;
END$$;



-- -----------------------------
-- Partido / Disciplina
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_tarjeta_tipo') THEN
    CREATE TYPE tipo_tarjeta AS ENUM ('verde', 'amarilla', 'roja');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_suspension_tipo') THEN
    CREATE TYPE tipo_suspension AS ENUM ('por_partidos', 'por_fecha');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_gol') THEN
    CREATE TYPE tipo_gol AS ENUM ('GJ', 'GC', 'GP', 'DP');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_fase') THEN
    CREATE TYPE tipo_fase AS ENUM ('liga', 'eliminacion', 'grupos');
  END IF;
END$$;

-- -----------------------------
-- Seguridad / Usuarios
-- -----------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
    CREATE TYPE tipo_usuario AS ENUM ('superusuario', 'admin', 'editor', 'lector');
  END IF;
END$$;


COMMIT;
