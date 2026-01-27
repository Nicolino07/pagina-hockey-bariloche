-- =====================================================
-- 005_triggers.sql
-- Triggers del sistema
-- =====================================================

BEGIN;

-- =====================================================
-- TIMESTAMP AUTOMÁTICO
-- =====================================================

-- Tablas principales
CREATE TRIGGER trg_club_actualizado
BEFORE UPDATE ON club
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_equipo_actualizado
BEFORE UPDATE ON equipo
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_persona_actualizado
BEFORE UPDATE ON persona
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_persona_rol_actualizado
BEFORE UPDATE ON persona_rol
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_plantel_actualizado
BEFORE UPDATE ON plantel
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_plantel_integrante_actualizado
BEFORE UPDATE ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_partido_actualizado
BEFORE UPDATE ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

-- Tablas adicionales
CREATE TRIGGER trg_usuario_actualizado
BEFORE UPDATE ON usuario
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_torneo_actualizado
BEFORE UPDATE ON torneo
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_fixture_fecha_actualizado
BEFORE UPDATE ON fixture_fecha
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_fixture_partido_actualizado
BEFORE UPDATE ON fixture_partido
FOR EACH ROW
EXECUTE FUNCTION fn_set_actualizado_en();


-- =====================================================
-- VALIDACIONES DE DOMINIO
-- =====================================================

-- Validación COMBINADA: Rol en plantel + Rol único por club
DROP TRIGGER IF EXISTS trg_validar_rol_en_plantel ON plantel_integrante;

CREATE TRIGGER trg_plantel_integrante_validaciones
BEFORE INSERT OR UPDATE ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_plantel_integrante_validar_rol_unico();

-- Capitanes
CREATE TRIGGER trg_validar_capitanes
BEFORE INSERT OR UPDATE ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_capitanes();

-- Árbitros no jugadores
CREATE TRIGGER trg_validar_arbitros
AFTER INSERT OR UPDATE ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_arbitros_no_jugadores();

-- No existen goles sin partido terminado 
CREATE TRIGGER trg_validar_gol_partido
BEFORE INSERT ON gol
FOR EACH ROW
EXECUTE FUNCTION fn_validar_gol_partido();

-- Iniciar tabla en 0
CREATE TRIGGER trg_init_posicion_inscripcion
AFTER INSERT ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_init_posicion_por_inscripcion();


-- =====================================================
-- RECÁLCULO DE POSICIONES
-- =====================================================

CREATE TRIGGER trg_recalcular_posiciones_partido
AFTER UPDATE OF estado_partido ON partido
FOR EACH ROW
WHEN (
    NEW.estado_partido = 'TERMINADO'
    AND OLD.estado_partido IS DISTINCT FROM 'TERMINADO'
)
EXECUTE FUNCTION fn_recalcular_posiciones();

CREATE TRIGGER trg_recalcular_posiciones_gol
AFTER INSERT OR UPDATE OR DELETE ON gol
FOR EACH ROW
EXECUTE FUNCTION fn_recalcular_posiciones_por_gol();


-- =====================================================
-- AUDITORÍA GENÉRICA
-- =====================================================

-- Tabla de auditoría (si no existe)
CREATE TABLE IF NOT EXISTS auditoria_log (
    id_auditoria SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro VARCHAR(100),
    operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    id_usuario INT,
    ip_address INET,
    user_agent TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PERSONAS / USUARIOS / SEGURIDAD
CREATE TRIGGER trg_audit_persona
AFTER INSERT OR UPDATE OR DELETE
ON persona
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_persona_rol
AFTER INSERT OR UPDATE OR DELETE
ON persona_rol
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_usuario
AFTER INSERT OR UPDATE OR DELETE
ON usuario
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_refresh_token
AFTER INSERT OR UPDATE OR DELETE
ON refresh_token
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

-- CLUBES / EQUIPOS
CREATE TRIGGER trg_audit_club
AFTER INSERT OR UPDATE OR DELETE
ON club
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_equipo
AFTER INSERT OR UPDATE OR DELETE
ON equipo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_plantel
AFTER INSERT OR UPDATE OR DELETE
ON plantel
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_plantel_integrante
AFTER INSERT OR UPDATE OR DELETE
ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

-- TORNEOS / COMPETENCIAS
CREATE TRIGGER trg_audit_torneo
AFTER INSERT OR UPDATE OR DELETE
ON torneo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_inscripcion_torneo
AFTER INSERT OR UPDATE OR DELETE
ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_fixture_fecha
AFTER INSERT OR UPDATE OR DELETE
ON fixture_fecha
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_fixture_partido
AFTER INSERT OR UPDATE OR DELETE
ON fixture_partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

-- PARTIDOS / EVENTOS
CREATE TRIGGER trg_audit_partido
AFTER INSERT OR UPDATE OR DELETE
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_participan_partido
AFTER INSERT OR UPDATE OR DELETE
ON participan_partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_gol
AFTER INSERT OR UPDATE OR DELETE
ON gol
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_tarjeta
AFTER INSERT OR UPDATE OR DELETE
ON tarjeta
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_suspension
AFTER INSERT OR UPDATE OR DELETE
ON suspension
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

CREATE TRIGGER trg_audit_posicion
AFTER INSERT OR UPDATE OR DELETE
ON posicion
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();

-- FASE (si existe en tu esquema)
-- CREATE TRIGGER trg_audit_fase
-- AFTER INSERT OR UPDATE OR DELETE
-- ON fase
-- FOR EACH ROW
-- EXECUTE FUNCTION fn_auditoria_generica();


-- =====================================================
-- VALIDACIONES ADICIONALES PARA NUEVAS TABLAS
-- =====================================================

-- Validar que refresh_token no esté expirado al usarse
CREATE OR REPLACE FUNCTION fn_validar_refresh_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.expires_at < CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Refresh token expirado';
    END IF;
    
    IF NEW.revoked = TRUE THEN
        RAISE EXCEPTION 'Refresh token revocado';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_refresh_token
BEFORE INSERT OR UPDATE ON refresh_token
FOR EACH ROW
EXECUTE FUNCTION fn_validar_refresh_token();

-- Validar que un equipo no juegue contra sí mismo en fixture
CREATE OR REPLACE FUNCTION fn_validar_fixture_partido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_mismo_club BOOLEAN;
BEGIN
    -- Verificar si ambos equipos son del mismo club
    SELECT (e1.id_club = e2.id_club)
    INTO v_mismo_club
    FROM equipo e1
    JOIN equipo e2 ON e2.id_equipo = NEW.id_equipo_visitante
    WHERE e1.id_equipo = NEW.id_equipo_local;
    
    -- Opcional: Permitir o no partidos entre equipos del mismo club
    -- IF v_mismo_club THEN
    --     RAISE EXCEPTION 'No se pueden programar partidos entre equipos del mismo club en el fixture';
    -- END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_fixture_partido
BEFORE INSERT OR UPDATE ON fixture_partido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fixture_partido();


-- =====================================================
-- AUDITORÍA ESPECÍFICA PARA PLANTEL_INTEGRANTE (OPCIONAL)
-- =====================================================

-- Primero, crear la tabla de auditoría específica si no existe
CREATE TABLE IF NOT EXISTS auditoria_plantel_integrante (
    id_auditoria SERIAL PRIMARY KEY,
    operacion CHAR(1) CHECK (operacion IN ('I', 'U', 'D')),
    id_plantel_integrante INT,
    id_plantel INT,
    id_persona INT,
    rol_en_plantel tipo_rol_persona,
    numero_camiseta INT,
    fecha_alta DATE,
    fecha_baja DATE,
    usuario VARCHAR(100),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    CONSTRAINT fk_plantel_integrante
        FOREIGN KEY (id_plantel_integrante)
        REFERENCES plantel_integrante(id_plantel_integrante)
        ON DELETE SET NULL
);

-- Trigger de auditoría específica (opcional - duplica la auditoría genérica)
-- Si quieres auditoría específica además de la genérica, descomenta:
-- CREATE TRIGGER trg_plantel_integrante_auditoria_especifica
--     AFTER INSERT OR UPDATE OR DELETE
--     ON plantel_integrante
--     FOR EACH ROW
--     EXECUTE FUNCTION fn_plantel_integrante_auditoria();

COMMIT;