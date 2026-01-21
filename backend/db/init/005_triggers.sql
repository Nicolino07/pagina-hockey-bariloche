-- =====================================================
-- 005_triggers.sql
-- Triggers del sistema
-- =====================================================

BEGIN;

-- =====================================================
-- TIMESTAMP AUTOMÁTICO
-- =====================================================

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


-- =====================================================
-- VALIDACIONES DE DOMINIO
-- =====================================================

-- Rol en plantel vs jugador
CREATE TRIGGER trg_validar_rol_en_plantel
BEFORE INSERT OR UPDATE ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_validar_rol_en_plantel();

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

DROP TRIGGER IF EXISTS trg_recalcular_posiciones_partido ON partido;

CREATE TRIGGER trg_recalcular_posiciones_partido
AFTER UPDATE OF estado_partido ON partido
FOR EACH ROW
WHEN (
    NEW.estado_partido = 'TERMINADO'
    AND OLD.estado_partido IS DISTINCT FROM 'TERMINADO'
)
EXECUTE FUNCTION fn_recalcular_posiciones();


CREATE OR REPLACE FUNCTION fn_recalcular_posiciones_por_gol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_torneo INT;
BEGIN
    SELECT p.id_torneo
    INTO v_id_torneo
    FROM partido p
    WHERE p.id_partido = COALESCE(NEW.id_partido, OLD.id_partido)
      AND p.estado_partido = 'TERMINADO';

    IF v_id_torneo IS NOT NULL THEN
        PERFORM recalcular_tabla_posiciones(v_id_torneo);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


DROP TRIGGER IF EXISTS trg_recalcular_posiciones_gol ON gol;

CREATE TRIGGER trg_recalcular_posiciones_gol
AFTER INSERT OR UPDATE OR DELETE ON gol
FOR EACH ROW
EXECUTE FUNCTION fn_recalcular_posiciones_por_gol();


-- =====================================================
-- Triggers de auditoría
-- PERSONAS / USUARIOS
-- =====================================================

CREATE TRIGGER trg_audit_persona
AFTER INSERT OR UPDATE OR DELETE
ON persona
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_persona');

CREATE TRIGGER trg_audit_persona_rol
AFTER INSERT OR UPDATE OR DELETE
ON persona_rol
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_persona_rol');

CREATE TRIGGER trg_audit_usuario
AFTER INSERT OR UPDATE OR DELETE
ON usuario
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_usuario');

-- =====================================================
-- Auditoría
-- COMPETENCIAS / EQUIPOS
-- =====================================================

CREATE TRIGGER trg_audit_torneo
AFTER INSERT OR UPDATE OR DELETE
ON torneo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_torneo');

CREATE TRIGGER trg_audit_inscripcion_torneo
AFTER INSERT OR UPDATE OR DELETE
ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_inscripcion');

CREATE TRIGGER trg_audit_club
AFTER INSERT OR UPDATE OR DELETE
ON club
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_club');

CREATE TRIGGER trg_audit_equipo
AFTER INSERT OR UPDATE OR DELETE
ON equipo
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_equipo');

CREATE TRIGGER trg_audit_plantel
AFTER INSERT OR UPDATE OR DELETE
ON plantel
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_plantel');

CREATE TRIGGER trg_audit_plantel_integrante
AFTER INSERT OR UPDATE OR DELETE
ON plantel_integrante
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_plantel_integrante');

-- =====================================================
-- Auditoría
-- PARTIDOS / EVENTOS
-- =====================================================

CREATE TRIGGER trg_audit_partido
AFTER INSERT OR UPDATE OR DELETE
ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_partido');


CREATE TRIGGER trg_audit_participan_partido
AFTER INSERT OR UPDATE OR DELETE
ON participan_partido
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_participan_partido');

CREATE TRIGGER trg_audit_gol
AFTER INSERT OR UPDATE OR DELETE
ON gol
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_gol');

CREATE TRIGGER trg_audit_tarjeta
AFTER INSERT OR UPDATE OR DELETE
ON tarjeta
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_tarjeta');

CREATE TRIGGER trg_audit_suspension
AFTER INSERT OR UPDATE OR DELETE
ON suspension
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica('id_suspension');

COMMIT;
