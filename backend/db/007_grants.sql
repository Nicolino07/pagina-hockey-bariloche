-- =====================================================
-- 007_grants.sql (VERSIÓN MEJORADA)
-- Permisos y seguridad - PostgreSQL 13+
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREACIÓN DE ROLES JERÁRQUICOS
-- =====================================================

-- Rol base para la aplicación (no puede hacer nada por sí solo)
CREATE ROLE app_base_role NOINHERIT;

-- Rol para operaciones de solo lectura
CREATE ROLE app_readonly_role NOINHERIT;

-- Rol para operaciones de escritura básica
CREATE ROLE app_write_role NOINHERIT;

-- Rol para administradores de la aplicación
CREATE ROLE app_admin_role NOINHERIT;

-- =====================================================
-- 2. REVOCAR TODOS LOS PERMISOS POR DEFECTO
-- =====================================================

-- Primero, revocar de PUBLIC
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;


-- =====================================================
-- 3. PERMISOS DE SOLO LECTURA (ROL: app_readonly_role)
-- =====================================================

-- Permiso para usar el schema
GRANT USAGE ON SCHEMA public TO app_readonly_role;

-- Lectura de tablas específicas (sin poder modificar)
GRANT SELECT ON
    -- Tablas principales de consulta
    club,
    equipo,
    persona,
    persona_rol,
    torneo,
    inscripcion_torneo,
    plantel,
    plantel_integrante,
    fase,
    partido,
    participan_partido,
    gol,
    tarjeta,
    suspension,
    posicion,
    usuario,
    permiso_user_tabla,
    fixture_fecha,
    fixture_partido,
    -- Auditoría (solo lectura)
    auditoria_log,
    refresh_token
TO app_readonly_role;

-- Permiso para usar sequences (solo para ver valores)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_readonly_role;

-- Permiso para ejecutar funciones de solo lectura
GRANT EXECUTE ON FUNCTION 
    fn_recalcular_posiciones(INT),
    fn_verificar_suspension(INT, INT, DATE),
    fn_validar_edad_categoria(DATE, categoria_tipo),
    fn_validar_arbitro_activo(INT),
    fn_validar_genero_inscripcion(INT, INT),
    fn_proximo_numero_fecha(INT)  -- Si la agregaste
TO app_readonly_role;

-- =====================================================
-- 4. PERMISOS DE ESCRITURA BÁSICA (ROL: app_write_role)
-- =====================================================

-- Heredar permisos de lectura
GRANT app_readonly_role TO app_write_role;

-- Permisos de modificación en tablas específicas
GRANT INSERT, UPDATE, DELETE ON
    -- Gestión de partidos
    partido,
    gol,
    tarjeta,
    participan_partido,
    -- Gestión de planteles
    plantel_integrante,
    -- Gestión de árbitros
    persona_rol,
    -- Fixture programado
    fixture_fecha,
    fixture_partido
TO app_write_role;

-- Permisos limitados en tablas sensibles
GRANT INSERT ON
    inscripcion_torneo,
    plantel,
    suspension
TO app_write_role;

-- Solo UPDATE (no INSERT/DELETE) en estas tablas
GRANT UPDATE ON
    equipo,
    persona,
    torneo
TO app_write_role;

-- Permiso para ejecutar funciones de escritura
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_write_role;

-- =====================================================
-- 5. PERMISOS DE ADMINISTRACIÓN (ROL: app_admin_role)
-- =====================================================

-- Heredar permisos de escritura
GRANT app_write_role TO app_admin_role;

-- Permisos completos en todas las tablas (excepto sistema)
GRANT ALL PRIVILEGES ON
    club,
    equipo,
    persona,
    persona_rol,
    torneo,
    inscripcion_torneo,
    plantel,
    plantel_integrante,
    fase,
    partido,
    participan_partido,
    gol,
    tarjeta,
    suspension,
    posicion,
    usuario,
    permiso_user_tabla,
    fixture_fecha,
    fixture_partido
TO app_admin_role;

-- Permisos en auditoría (solo inserción, no borrado)
GRANT INSERT, SELECT ON auditoria_log TO app_admin_role;
GRANT INSERT, SELECT, UPDATE ON refresh_token TO app_admin_role;


-- =====================================================
-- 6. PERMISOS ESPECÍFICOS PARA TRIGGERS Y FUNCIONES
-- =====================================================

-- Permitir que los roles ejecuten funciones de triggers
GRANT EXECUTE ON FUNCTION 
    fn_check_permiso(),
    fn_init_posicion(),
    fn_trg_partido_posiciones(),
    fn_validar_suspension_participante(),
    fn_validar_arbitros_partido(),
    fn_validar_capitanes_partido(),
    fn_validar_inscripcion_unica(),
    fn_actualizar_suspensiones_partido(),
    fn_log_confirmacion_partido()
TO app_write_role, app_admin_role;


-- =====================================================
-- 7. CONFIGURACIÓN ADICIONAL DE SEGURIDAD
-- =====================================================

-- No permitir conexiones desde usuarios sin contraseña
ALTER ROLE api_dev_user WITH PASSWORD NULL VALID UNTIL 'infinity';
ALTER ROLE api_prod_user WITH PASSWORD NULL VALID UNTIL 'infinity';
ALTER ROLE report_user WITH PASSWORD NULL VALID UNTIL 'infinity';


-- =====================================================
-- 8. CONFIGURAR PERMISOS POR DEFECTO PARA NUEVAS TABLAS
-- =====================================================

-- Esto asegura que nuevas tablas hereden los permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO app_readonly_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT INSERT, UPDATE, DELETE ON TABLES TO app_write_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO app_admin_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE ON SEQUENCES TO app_readonly_role, app_write_role, app_admin_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO app_readonly_role, app_write_role, app_admin_role;

COMMIT;

-- =====================================================