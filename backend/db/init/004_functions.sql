-- =====================================================
-- 004_functions.sql
-- Funciones del sistema (dominio y soporte)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TIMESTAMP AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 2. VALIDAR ROL EN PLANTEL
-- =====================================================
-- Una persona solo puede cumplir un rol en un plantel
-- si tiene ese rol habilitado en persona_rol y vigente
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_rol_en_plantel()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM persona_rol pr
        WHERE pr.id_persona = NEW.id_persona
          AND pr.rol = NEW.rol_en_plantel
          AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= NEW.fecha_alta)
    ) THEN
        RAISE EXCEPTION
            'La persona % no está habilitada para el rol %',
            NEW.id_persona, NEW.rol_en_plantel;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 3. VALIDAR CAPITANES
-- =====================================================
-- Un capitán debe ser jugador
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_capitanes()
RETURNS TRIGGER AS $$
DECLARE
    rol_local tipo_rol_persona;
    rol_visitante tipo_rol_persona;
BEGIN
    IF NEW.id_capitan_local IS NOT NULL THEN
        SELECT rol_en_plantel
        INTO rol_local
        FROM plantel_integrante
        WHERE id_plantel_integrante = NEW.id_capitan_local;

        IF rol_local <> 'JUGADOR' THEN
            RAISE EXCEPTION 'El capitán local debe ser jugador';
        END IF;
    END IF;

    IF NEW.id_capitan_visitante IS NOT NULL THEN
        SELECT rol_en_plantel
        INTO rol_visitante
        FROM plantel_integrante
        WHERE id_plantel_integrante = NEW.id_capitan_visitante;

        IF rol_visitante <> 'JUGADOR' THEN
            RAISE EXCEPTION 'El capitán visitante debe ser jugador';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 4. VALIDAR QUE ÁRBITROS NO PARTICIPEN COMO JUGADORES
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_arbitros_no_jugadores()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM participan_partido pp
        JOIN plantel_integrante pi
          ON pi.id_plantel_integrante = pp.id_plantel_integrante
        WHERE pp.id_partido = NEW.id_partido
          AND pi.id_persona IN (NEW.id_arbitro1, NEW.id_arbitro2)
    ) THEN
        RAISE EXCEPTION
            'Un árbitro no puede participar como jugador en el mismo partido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 5. FUNCIÓN UTILITARIA: PERSONA SUSPENDIDA
-- =====================================================
-- Devuelve TRUE si la persona está suspendida en el torneo
-- =====================================================

CREATE OR REPLACE FUNCTION fn_persona_suspendida(
    p_id_persona INT,
    p_id_torneo  INT,
    p_fecha      DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM suspension s
        WHERE s.id_persona = p_id_persona
          AND s.id_torneo = p_id_torneo
          AND s.activa = TRUE
          AND (
              (s.tipo_suspension = 'POR_PARTIDOS'
               AND s.cumplidas < s.fechas_suspension)
           OR
              (s.tipo_suspension = 'POR_FECHA'
               AND p_fecha <= s.fecha_fin_suspension)
          )
    );
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 6. RECALCULAR POSICIONES DE UN TORNEO
-- =====================================================

CREATE OR REPLACE FUNCTION recalcular_tabla_posiciones(p_id_torneo INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Reinicio (solo posiciones activas)
    UPDATE posicion
    SET puntos = 0,
        partidos_jugados = 0,
        ganados = 0,
        empatados = 0,
        perdidos = 0,
        goles_a_favor = 0,
        goles_en_contra = 0
    WHERE id_torneo = p_id_torneo
      AND borrado_en IS NULL;

    -- LOCAL
    UPDATE posicion pos
    SET
        partidos_jugados = partidos_jugados + 1,
        goles_a_favor = goles_a_favor + p.goles_local,
        goles_en_contra = goles_en_contra + p.goles_visitante,
        ganados = ganados + (p.goles_local > p.goles_visitante)::int,
        empatados = empatados + (p.goles_local = p.goles_visitante)::int,
        perdidos = perdidos + (p.goles_local < p.goles_visitante)::int,
        puntos = puntos +
            CASE
                WHEN p.goles_local > p.goles_visitante THEN 3
                WHEN p.goles_local = p.goles_visitante THEN 1
                ELSE 0
            END
    FROM partido p
    JOIN inscripcion_torneo it
      ON it.id_inscripcion = p.id_inscripcion_local
     AND it.borrado_en IS NULL
    WHERE p.id_torneo = p_id_torneo
      AND p.borrado_en IS NULL
      AND pos.id_equipo = it.id_equipo
      AND pos.borrado_en IS NULL;

    -- VISITANTE
    UPDATE posicion pos
    SET
        partidos_jugados = partidos_jugados + 1,
        goles_a_favor = goles_a_favor + p.goles_visitante,
        goles_en_contra = goles_en_contra + p.goles_local,
        ganados = ganados + (p.goles_visitante > p.goles_local)::int,
        empatados = empatados + (p.goles_visitante = p.goles_local)::int,
        perdidos = perdidos + (p.goles_visitante < p.goles_local)::int,
        puntos = puntos +
            CASE
                WHEN p.goles_visitante > p.goles_local THEN 3
                WHEN p.goles_visitante = p.goles_local THEN 1
                ELSE 0
            END
    FROM partido p
    JOIN inscripcion_torneo it
      ON it.id_inscripcion = p.id_inscripcion_visitante
     AND it.borrado_en IS NULL
    WHERE p.id_torneo = p_id_torneo
      AND p.borrado_en IS NULL
      AND pos.id_equipo = it.id_equipo
      AND pos.borrado_en IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_recalcular_posiciones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM recalcular_tabla_posiciones(NEW.id_torneo);
    RETURN NEW;
END;
$$;



-- =====================================================
-- Función genérica de auditoría
-- =====================================================
-- Registra INSERT / UPDATE / DELETE
-- Usa contexto de sesión seteado por backend:
--   SET LOCAL app.usuario
--   SET LOCAL app.ip
--   SET LOCAL app.user_agent
-- =====================================================

CREATE OR REPLACE FUNCTION fn_auditoria_generica()
RETURNS TRIGGER AS $$
DECLARE
    v_pk_column   TEXT;
    v_id_registro TEXT;
    v_operacion   TEXT;
    v_user_id     INT;
BEGIN
    v_pk_column := TG_ARGV[0];

    -- usuario desde contexto (puede ser NULL)
    v_user_id := current_setting('app.current_user_id', true)::INT;

    -- obtener PK según operación
    IF TG_OP = 'DELETE' THEN
        EXECUTE format(
            'SELECT ($1).%I::text',
            v_pk_column
        )
        INTO v_id_registro
        USING OLD;
    ELSE
        EXECUTE format(
            'SELECT ($1).%I::text',
            v_pk_column
        )
        INTO v_id_registro
        USING NEW;
    END IF;

    -- detectar DELETE lógico
    v_operacion :=
        CASE
            WHEN TG_OP = 'UPDATE'
                 AND OLD.borrado_en IS NULL
                 AND NEW.borrado_en IS NOT NULL
            THEN 'DELETE'
            ELSE TG_OP
        END;

    INSERT INTO auditoria_log (
        tabla_afectada,
        id_registro,
        operacion,
        valores_anteriores,
        valores_nuevos,
        id_usuario,
        ip_address,
        user_agent
    )
    VALUES (
        TG_TABLE_NAME,
        v_id_registro,
        v_operacion,
        CASE
            WHEN TG_OP IN ('UPDATE', 'DELETE')
            THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE')
            THEN to_jsonb(NEW)
            ELSE NULL
        END,
        v_user_id,
        current_setting('app.ip_address', true)::inet,
        current_setting('app.user_agent', true)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


COMMIT;
