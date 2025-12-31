-- =====================================================
-- 004_functions.sql (VERSIÓN FINAL - CORREGIDA)
-- =====================================================

BEGIN;

-- ================================================
-- SEGURIDAD
-- ================================================

-- Función: verificar permisos DML (CORREGIDA)
CREATE OR REPLACE FUNCTION fn_check_permiso()
RETURNS trigger AS $$
DECLARE
    v_rol        TEXT;
    v_tabla      TEXT := TG_TABLE_NAME;
    v_operacion  TEXT := lower(TG_OP);
    v_permitido  BOOLEAN;
BEGIN
    v_rol := current_setting('app.current_user_role', true);

    IF v_rol IS NULL THEN
        RAISE EXCEPTION 'Rol no definido en la sesión';
    END IF;

    -- Validar rol
    IF v_rol NOT IN ('superusuario', 'admin', 'editor', 'lector') THEN
        RAISE EXCEPTION 'Rol inválido: %', v_rol;
    END IF;

    -- Superusuario bypass
    IF v_rol = 'superusuario' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT permitido
      INTO v_permitido
      FROM permiso_user_tabla
     WHERE rol_usuario = v_rol::usuario_tipo
       AND tabla = v_tabla
       AND operacion = v_operacion::operacion_permiso_tipo;

    IF NOT COALESCE(v_permitido, FALSE) THEN
        RAISE EXCEPTION USING
            MESSAGE = format(
                'Permiso denegado: rol=%s, operacion=%s, tabla=%s',
                v_rol, v_operacion, v_tabla
            ),
            ERRCODE = '42501';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función: bloquear tabla posicion
CREATE OR REPLACE FUNCTION fn_bloquear_posicion()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION USING
        MESSAGE = 'La tabla posicion es de uso exclusivo del sistema',
        ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- POSICIONES / TORNEOS
-- ================================================

-- Función: inicializar posición al inscribir equipo
CREATE OR REPLACE FUNCTION fn_init_posicion()
RETURNS trigger AS $$
BEGIN
    INSERT INTO posicion (
        id_torneo,
        id_equipo,
        puntos,
        partidos_jugados,
        ganados,
        empatados,
        perdidos,
        goles_a_favor,
        goles_en_contra
    )
    VALUES (
        NEW.id_torneo,
        NEW.id_equipo,
        0, 0, 0, 0, 0, 0, 0
    )
    ON CONFLICT (id_torneo, id_equipo) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: recalcular posiciones 
CREATE OR REPLACE FUNCTION fn_recalcular_posiciones(p_id_torneo INT)
RETURNS VOID AS $$
BEGIN
    -- Resetear todos los equipos del torneo
    UPDATE posicion
       SET puntos = 0,
           partidos_jugados = 0,
           goles_a_favor = 0,
           goles_en_contra = 0,
           ganados = 0,
           empatados = 0,
           perdidos = 0,
           actualizado_en = CURRENT_TIMESTAMP
     WHERE id_torneo = p_id_torneo;

    -- Calcular desde partidos confirmados
    WITH estadisticas AS (
        SELECT
            id_equipo,
            COUNT(*) AS partidos_jugados,
            SUM(puntos) AS puntos,
            SUM(goles_a_favor) AS goles_a_favor,
            SUM(goles_en_contra) AS goles_en_contra,
            SUM(ganados) AS ganados,
            SUM(empatados) AS empatados,
            SUM(perdidos) AS perdidos
        FROM (
            SELECT
                id_local AS id_equipo,
                goles_local AS goles_a_favor,
                goles_visitante AS goles_en_contra,
                CASE
                    WHEN goles_local > goles_visitante THEN 3
                    WHEN goles_local = goles_visitante THEN 1
                    ELSE 0
                END AS puntos,
                CASE WHEN goles_local > goles_visitante THEN 1 ELSE 0 END AS ganados,
                CASE WHEN goles_local = goles_visitante THEN 1 ELSE 0 END AS empatados,
                CASE WHEN goles_local < goles_visitante THEN 1 ELSE 0 END AS perdidos
            FROM partido
            WHERE id_torneo = p_id_torneo 
              AND confirmado_en IS NOT NULL
              AND goles_local IS NOT NULL
              AND goles_visitante IS NOT NULL

            UNION ALL

            SELECT
                id_visitante,
                goles_visitante,
                goles_local,
                CASE
                    WHEN goles_visitante > goles_local THEN 3
                    WHEN goles_visitante = goles_local THEN 1
                    ELSE 0
                END,
                CASE WHEN goles_visitante > goles_local THEN 1 ELSE 0 END,
                CASE WHEN goles_visitante = goles_local THEN 1 ELSE 0 END,
                CASE WHEN goles_visitante < goles_local THEN 1 ELSE 0 END
            FROM partido
            WHERE id_torneo = p_id_torneo 
              AND confirmado_en IS NOT NULL
              AND goles_local IS NOT NULL
              AND goles_visitante IS NOT NULL
        ) t
        GROUP BY id_equipo
    )
    UPDATE posicion p
       SET puntos = COALESCE(e.puntos, 0),
           partidos_jugados = COALESCE(e.partidos_jugados, 0),
           goles_a_favor = COALESCE(e.goles_a_favor, 0),
           goles_en_contra = COALESCE(e.goles_en_contra, 0),
           ganados = COALESCE(e.ganados, 0),
           empatados = COALESCE(e.empatados, 0),
           perdidos = COALESCE(e.perdidos, 0),
           actualizado_en = CURRENT_TIMESTAMP
      FROM estadisticas e
     WHERE p.id_equipo = e.id_equipo
       AND p.id_torneo = p_id_torneo;
END;
$$ LANGUAGE plpgsql;

-- Función: trigger para recálculo automático
CREATE OR REPLACE FUNCTION fn_trg_partido_posiciones()
RETURNS trigger AS $$
DECLARE
    v_torneo INT;
BEGIN
    v_torneo := COALESCE(NEW.id_torneo, OLD.id_torneo);
    
    IF v_torneo IS NOT NULL THEN
        PERFORM fn_recalcular_posiciones(v_torneo);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VALIDACIONES
-- ================================================

-- Función: verificar si persona está suspendida
CREATE OR REPLACE FUNCTION fn_verificar_suspension(
    p_id_persona INT,
    p_id_torneo INT,
    p_fecha_partido DATE DEFAULT CURRENT_DATE
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
              (s.tipo_suspension = 'por_fecha' 
               AND s.fecha_fin_suspension >= p_fecha_partido)
              OR
              (s.tipo_suspension = 'por_partidos' 
               AND s.cumplidas < COALESCE(s.fechas_suspension, 0))
          )
    );
END;
$$ LANGUAGE plpgsql;

-- Función: Validar que participante no esté suspendido (VERSIÓN SIMPLIFICADA)
CREATE OR REPLACE FUNCTION fn_validar_suspension_participante()
RETURNS TRIGGER AS $$
DECLARE
    v_id_persona INT;
    v_id_torneo INT;
    v_fecha_partido DATE;
    v_suspendido BOOLEAN;
BEGIN
    -- Obtener ID de persona, torneo y fecha
    SELECT 
        pi.id_persona,
        pl.id_torneo,
        p.fecha
    INTO 
        v_id_persona,
        v_id_torneo,
        v_fecha_partido
    FROM participan_partido pp
    JOIN partido p ON p.id_partido = pp.id_partido
    JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
    JOIN plantel pl ON pl.id_plantel = pi.id_plantel
    WHERE pp.id_participante_partido = NEW.id_participante_partido;

    -- Si no encontramos datos, salir
    IF v_id_persona IS NULL OR v_id_torneo IS NULL THEN
        RETURN NEW;
    END IF;

    -- Verificar suspensión usando fn_verificar_suspension
    v_suspendido := fn_verificar_suspension(
        v_id_persona,
        v_id_torneo,
        COALESCE(v_fecha_partido, CURRENT_DATE)
    );

    IF v_suspendido THEN
        RAISE EXCEPTION 'El jugador/entrenador (ID: %) está suspendido y no puede participar', v_id_persona;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: actualizar suspensiones por partidos cumplidos
CREATE OR REPLACE FUNCTION fn_actualizar_suspensiones_partido()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si el partido fue confirmado
    IF NEW.confirmado_en IS NOT NULL AND OLD.confirmado_en IS NULL THEN
        -- Actualizar suspensiones por partidos
        UPDATE suspension s
        SET cumplidas = cumplidas + 1,
            partidos_cumplidos = array_append(partidos_cumplidos, NEW.id_partido),
            actualizado_en = CURRENT_TIMESTAMP
        WHERE s.id_torneo = NEW.id_torneo
          AND s.tipo_suspension = 'por_partidos'
          AND s.activa = TRUE
          AND s.cumplidas < s.fechas_suspension
          AND NEW.id_partido != ALL(s.partidos_cumplidos)
          AND (
              -- Si la suspensión tiene partido origen, verificar que sea posterior
              s.id_partido_origen IS NULL 
              OR s.id_partido_origen < NEW.id_partido
          )
          AND (
              -- Verificar que el suspendido participó en el partido
              EXISTS (
                  SELECT 1 FROM participan_partido pp
                  JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
                  WHERE pp.id_partido = NEW.id_partido
                  AND pi.id_persona = s.id_persona
              )
          );
        
        -- Desactivar suspensiones cumplidas
        UPDATE suspension s
        SET activa = FALSE,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE s.id_torneo = NEW.id_torneo
          AND s.tipo_suspension = 'por_partidos'
          AND s.activa = TRUE
          AND s.cumplidas >= s.fechas_suspension;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: validar inscripción única por equipo-torneo
CREATE OR REPLACE FUNCTION fn_validar_inscripcion_unica()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM inscripcion_torneo it
        WHERE it.id_equipo = NEW.id_equipo
          AND it.id_torneo = NEW.id_torneo
          AND it.id_inscripcion != COALESCE(NEW.id_inscripcion, 0)
    ) THEN
        RAISE EXCEPTION 'El equipo ya está inscrito en este torneo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: validar edad según categoría
CREATE OR REPLACE FUNCTION fn_validar_edad_categoria(
    p_fecha_nacimiento DATE,
    p_categoria categoria_tipo
)
RETURNS BOOLEAN AS $$
DECLARE
    v_edad INT;
    v_limite INT;
BEGIN
    -- Solo validar categorías Sub-X
    IF p_categoria NOT IN ('Sub 12', 'Sub 14', 'Sub 16', 'Sub 19') THEN
        RETURN TRUE;
    END IF;

    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_nacimiento));
    
    v_limite := CASE p_categoria
        WHEN 'Sub 12' THEN 12
        WHEN 'Sub 14' THEN 14
        WHEN 'Sub 16' THEN 16
        WHEN 'Sub 19' THEN 19
        ELSE 100  -- Nunca debería llegar aquí
    END;

    RETURN v_edad <= v_limite;
END;
$$ LANGUAGE plpgsql;

-- Función: validar que persona es árbitro activo
CREATE OR REPLACE FUNCTION fn_validar_arbitro_activo(
    p_id_persona INT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
          FROM persona_rol pr
         WHERE pr.id_persona = p_id_persona
           AND pr.rol = 'arbitro'
           AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- Función: validar compatibilidad género equipo-torneo
CREATE OR REPLACE FUNCTION fn_validar_genero_inscripcion(
    p_id_equipo INT,
    p_id_torneo INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_genero_equipo genero_competencia_tipo;
    v_genero_torneo genero_competencia_tipo;
BEGIN
    SELECT genero INTO v_genero_equipo FROM equipo WHERE id_equipo = p_id_equipo;
    SELECT genero INTO v_genero_torneo FROM torneo WHERE id_torneo = p_id_torneo;

    -- Torneos mixtos aceptan cualquier equipo
    IF v_genero_torneo = 'Mixto' THEN
        RETURN TRUE;
    END IF;

    -- Para torneos no mixtos, deben coincidir
    RETURN v_genero_equipo = v_genero_torneo;
END;
$$ LANGUAGE plpgsql;

-- Función: Log de confirmación de partido
CREATE OR REPLACE FUNCTION fn_log_confirmacion_partido(
    p_id_partido INT,
    p_confirmado_por VARCHAR
)
RETURNS VOID AS $$
BEGIN
    -- Podrías loguear a auditoria_log o tabla específica
    INSERT INTO auditoria_log (
        tabla_afectada,
        id_registro,
        operacion,
        valores_nuevos,
        usuario
    ) VALUES (
        'partido',
        p_id_partido,
        'CONFIRMAR',
        jsonb_build_object(
            'confirmado_por', p_confirmado_por,
            'confirmado_en', CURRENT_TIMESTAMP
        ),
        p_confirmado_por
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIONES PARA VALIDACIÓN EN TRIGGERS
-- ================================================

-- Función: Validar árbitros en partido (para trigger)
CREATE OR REPLACE FUNCTION fn_validar_arbitros_partido()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar árbitro 1
    IF NEW.id_arbitro1 IS NOT NULL AND NOT fn_validar_arbitro_activo(NEW.id_arbitro1) THEN
        RAISE EXCEPTION 'El árbitro 1 no es un árbitro activo';
    END IF;

    -- Validar árbitro 2
    IF NEW.id_arbitro2 IS NOT NULL AND NOT fn_validar_arbitro_activo(NEW.id_arbitro2) THEN
        RAISE EXCEPTION 'El árbitro 2 no es un árbitro activo';
    END IF;

    -- Validar que sean distintos (si ambos están presentes)
    IF NEW.id_arbitro1 IS NOT NULL AND NEW.id_arbitro2 IS NOT NULL 
       AND NEW.id_arbitro1 = NEW.id_arbitro2 THEN
        RAISE EXCEPTION 'Los árbitros deben ser personas distintas';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Validar capitanes en partido (para trigger)
CREATE OR REPLACE FUNCTION fn_validar_capitanes_partido()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar capitán local
    IF NEW.id_capitan_local IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM plantel_integrante pi
            JOIN plantel p ON pi.id_plantel = p.id_plantel
            WHERE pi.id_plantel_integrante = NEW.id_capitan_local
            AND p.id_equipo = NEW.id_local
            AND p.id_torneo = NEW.id_torneo
        ) THEN
            RAISE EXCEPTION 'El capitán local no pertenece al equipo local en este torneo';
        END IF;
    END IF;

    -- Validar capitán visitante
    IF NEW.id_capitan_visitante IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM plantel_integrante pi
            JOIN plantel p ON pi.id_plantel = p.id_plantel
            WHERE pi.id_plantel_integrante = NEW.id_capitan_visitante
            AND p.id_equipo = NEW.id_visitante
            AND p.id_torneo = NEW.id_torneo
        ) THEN
            RAISE EXCEPTION 'El capitán visitante no pertenece al equipo visitante en este torneo';
        END IF;
    END IF;

    -- Validar que sean distintos (si ambos están presentes)
    IF NEW.id_capitan_local IS NOT NULL AND NEW.id_capitan_visitante IS NOT NULL 
       AND NEW.id_capitan_local = NEW.id_capitan_visitante THEN
        RAISE EXCEPTION 'Los capitanes deben ser personas distintas';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;