-- =====================================================
-- 005_triggers.sql 
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TRIGGERS DE PERMISOS DINÁMICOS 
-- =====================================================

-- Tablas que NO deben tener triggers de permisos
-- (sistema interno, auditoría, tokens, permiso_user_tabla)
DO $$
DECLARE
    tablas_excluidas TEXT[] := ARRAY[
        'alembic_version',
        'auditoria_log', 
        'refresh_token',
        'permiso_user_tabla'  -- ← ¡IMPORTANTE! No bloquear permisos
    ];
    tabla_nombre TEXT;
BEGIN
    -- Primero eliminar triggers existentes si los hay
    FOR tabla_nombre IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (SELECT unnest(tablas_excluidas))
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_permiso_%s ON %I;', 
                      tabla_nombre, tabla_nombre);
    END LOOP;
    
    -- Luego crear triggers nuevos
    FOR tabla_nombre IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (SELECT unnest(tablas_excluidas))
    LOOP
        EXECUTE format($$
            CREATE TRIGGER trg_permiso_%1$s
            BEFORE INSERT OR UPDATE OR DELETE
            ON %1$I
            FOR EACH ROW
            EXECUTE FUNCTION fn_check_permiso();
        $$, tabla_nombre);
    END LOOP;
END;
$$;

-- =====================================================
-- 2. BLOQUEO TOTAL DE TABLA POSICION
-- =====================================================

DROP TRIGGER IF EXISTS trg_bloquear_posicion ON posicion;

CREATE TRIGGER trg_bloquear_posicion
BEFORE INSERT OR UPDATE OR DELETE
ON posicion
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_posicion();

-- =====================================================
-- 3. INICIALIZAR POSICION AL INSCRIBIR EQUIPO
-- =====================================================

DROP TRIGGER IF EXISTS trg_init_posicion ON inscripcion_torneo;

CREATE TRIGGER trg_init_posicion
AFTER INSERT
ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_init_posicion();

-- =====================================================
-- 4. RECALCULAR POSICIONES
-- =====================================================

-- Trigger principal para cualquier cambio en partido
DROP TRIGGER IF EXISTS trg_partido_posiciones ON partido;

CREATE TRIGGER trg_partido_posiciones
AFTER INSERT OR UPDATE OR DELETE
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_trg_partido_posiciones();

-- =====================================================
-- 5. VALIDACIONES DE NEGOCIO
-- =====================================================

-- 5.1 Validar árbitros en partido (usa función de 004)
DROP TRIGGER IF EXISTS trg_validar_arbitros_partido ON partido;

CREATE TRIGGER trg_validar_arbitros_partido
BEFORE INSERT OR UPDATE
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_arbitros_partido();

-- 5.2 Validar capitanes (usa función de 004)
DROP TRIGGER IF EXISTS trg_validar_capitanes_partido ON partido;

CREATE TRIGGER trg_validar_capitanes_partido
BEFORE INSERT OR UPDATE
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_capitanes_partido();

-- 5.3 Validar que participante no esté suspendido (usa función de 004)
DROP TRIGGER IF EXISTS trg_validar_suspension_participante ON participan_partido;

CREATE TRIGGER trg_validar_suspension_participante
BEFORE INSERT
ON participan_partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_suspension_participante();

-- 5.4 Validar inscripción única
DROP TRIGGER IF EXISTS trg_validar_inscripcion_unica ON inscripcion_torneo;

CREATE TRIGGER trg_validar_inscripcion_unica
BEFORE INSERT OR UPDATE
ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_validar_inscripcion_unica();

-- 5.5 Actualizar suspensiones cuando se confirma partido
DROP TRIGGER IF EXISTS trg_actualizar_suspensiones ON partido;

CREATE TRIGGER trg_actualizar_suspensiones
AFTER UPDATE
ON partido
FOR EACH ROW
WHEN (NEW.confirmado_en IS NOT NULL AND OLD.confirmado_en IS NULL)
EXECUTE FUNCTION fn_actualizar_suspensiones_partido();

-- =====================================================
-- 6. TRIGGERS DE AUDITORÍA (OPCIONALES)
-- =====================================================

-- 6.1 Log de confirmación de partido
DROP TRIGGER IF EXISTS trg_log_confirmacion_partido ON partido;

CREATE OR REPLACE FUNCTION fn_trg_log_confirmacion_partido()
RETURNS TRIGGER AS $$
BEGIN
    -- Usar la función que ya existe en 004
    PERFORM fn_log_confirmacion_partido(NEW.id_partido, NEW.confirmado_por);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_confirmacion_partido
AFTER UPDATE OF confirmado_en
ON partido
FOR EACH ROW
WHEN (NEW.confirmado_en IS NOT NULL AND OLD.confirmado_en IS NULL)
EXECUTE FUNCTION fn_trg_log_confirmacion_partido();

-- 6.2 Auditoría general de partidos (opcional)
DROP TRIGGER IF EXISTS trg_auditoria_partidos ON partido;

CREATE OR REPLACE FUNCTION fn_auditar_cambios_partido()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_log (
        tabla_afectada,
        id_registro,
        operacion,
        valores_anteriores,
        valores_nuevos,
        usuario
    )
    VALUES (
        'partido',
        COALESCE(NEW.id_partido, OLD.id_partido),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
        current_setting('app.current_user_role', true)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_partidos
AFTER INSERT OR UPDATE OF goles_local, goles_visitante, confirmado_en
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios_partido();

-- =====================================================
-- 7. TRIGGERS DE VALIDACIÓN DE DATOS
-- =====================================================

-- 7.1 Validar género al inscribir equipo en torneo
DROP TRIGGER IF EXISTS trg_validar_genero_inscripcion ON inscripcion_torneo;

CREATE OR REPLACE FUNCTION fn_trg_validar_genero_inscripcion()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT fn_validar_genero_inscripcion(NEW.id_equipo, NEW.id_torneo) THEN
        RAISE EXCEPTION 'El género del equipo no es compatible con el torneo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_genero_inscripcion
BEFORE INSERT
ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validar_genero_inscripcion();

-- 7.2 Validar edad al agregar a plantel (solo para categorías Sub-X)
DROP TRIGGER IF EXISTS trg_validar_edad_plantel ON plantel_integrante;

CREATE OR REPLACE FUNCTION fn_trg_validar_edad_plantel()
RETURNS TRIGGER AS $$
DECLARE
    v_categoria categoria_tipo;
    v_fecha_nacimiento DATE;
BEGIN
    -- Obtener categoría del torneo
    SELECT t.categoria INTO v_categoria
    FROM plantel p
    JOIN torneo t ON t.id_torneo = p.id_torneo
    WHERE p.id_plantel = NEW.id_plantel;
    
    -- Obtener fecha de nacimiento de la persona
    SELECT fecha_nacimiento INTO v_fecha_nacimiento
    FROM persona
    WHERE id_persona = NEW.id_persona;
    
    -- Validar solo si tenemos ambos datos
    IF v_categoria IS NOT NULL AND v_fecha_nacimiento IS NOT NULL THEN
        IF NOT fn_validar_edad_categoria(v_fecha_nacimiento, v_categoria) THEN
            RAISE EXCEPTION 'La persona no cumple con los límites de edad de la categoría %', v_categoria;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_edad_plantel
BEFORE INSERT
ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validar_edad_plantel();

COMMIT;