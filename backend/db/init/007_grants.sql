-- =====================================================
-- 007_grants.sql
-- Permisos de base de datos
-- =====================================================

-- =====================================================
-- 1. ROLES DE BASE DE DATOS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hockey_owner') THEN
        CREATE ROLE hockey_owner;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hockey_app') THEN
        CREATE ROLE hockey_app;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hockey_readonly') THEN
        CREATE ROLE hockey_readonly;
    END IF;
END $$;


-- =====================================================
-- 2. PERMISOS SOBRE SCHEMA
-- =====================================================

GRANT USAGE ON SCHEMA public TO hockey_app, hockey_readonly;
GRANT ALL   ON SCHEMA public TO hockey_owner;


-- =====================================================
-- 3. TABLAS OPERATIVAS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO hockey_app;

-- EXCEPCIÓN: seguridad
REVOKE ALL ON usuario FROM hockey_app;


-- =====================================================
-- 4. VISTAS (SOLO LECTURA)
-- =====================================================

GRANT SELECT
ON
    vw_persona_roles,
    vw_plantel_integrantes,
    vw_fixture_partidos,
    vw_tabla_posiciones,
    vw_suspensiones_activas
TO hockey_app, hockey_readonly;


-- =====================================================
-- 5. FUNCIONES
-- =====================================================

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO hockey_app;


-- =====================================================
-- 6. SECUENCIAS (IDENTITY)
-- =====================================================

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO hockey_app;


-- =====================================================
-- 7. PERMISOS FUTUROS
-- =====================================================
-- Para objetos creados luego de este script
-- =====================================================

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hockey_app;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
GRANT SELECT ON TABLES TO hockey_readonly;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO hockey_app;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO hockey_app;
