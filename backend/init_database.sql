-- SCRIPT UNIFICADO: Esquema + funciones (ajustadas)
-- Asegúrate de ejecutarlo en el schema PUBLIC o adapta search_path si lo usas distinto.



-- SCRIPT CORREGIDO PARA POSTGRESQL
-- Ejecutar en schema public (o adaptar search_path)

-- -------------------------
-- TABLA: club
-- -------------------------
CREATE TABLE IF NOT EXISTS club (
    id_club    SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    provincia  VARCHAR(100),
    ciudad     VARCHAR(100),
    direccion  VARCHAR(200),
    CONSTRAINT club_unq_nombre_ciudad UNIQUE (nombre, ciudad)
);

-- -------------------------
-- TABLA: equipo
-- -------------------------
CREATE TABLE IF NOT EXISTS equipo (
    id_equipo  SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    id_club    INT NOT NULL REFERENCES club(id_club),
    categoria  VARCHAR(50) NOT NULL,
    genero     VARCHAR(20) NOT NULL,
    CONSTRAINT check_equipo_genero CHECK (genero IN ('Masculino','Femenino','Mixto')),
    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);

-- -------------------------
-- TABLA: jugador
-- -------------------------
CREATE TABLE IF NOT EXISTS jugador (
    id_jugador       SERIAL PRIMARY KEY,
    dni              VARCHAR(20),
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100),
    genero           VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    CONSTRAINT chk_jugador_genero CHECK (genero IN ('Masculino','Femenino'))
);

-- -------------------------
-- TABLA: entrenador
-- -------------------------
CREATE TABLE IF NOT EXISTS entrenador (
    id_entrenador    SERIAL PRIMARY KEY,
    dni              VARCHAR(20),
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE
);

-- -------------------------
-- TABLA: arbitro
-- -------------------------
CREATE TABLE IF NOT EXISTS arbitro (
    id_arbitro       SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    dni              VARCHAR(20) UNIQUE
);

-- -------------------------
-- TABLA: plantel_equipo (plantel permanente del club/equipo)
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel_equipo (
    id_plantel        SERIAL PRIMARY KEY,
    id_equipo         INT NOT NULL REFERENCES equipo(id_equipo) ON DELETE CASCADE,
    id_jugador        INT REFERENCES jugador(id_jugador),
    id_entrenador     INT REFERENCES entrenador(id_entrenador),
    posicion          VARCHAR(50),
    fecha_alta        DATE DEFAULT CURRENT_DATE,
    fecha_baja        DATE,

    CONSTRAINT plantel_equipo_jugador_unq UNIQUE (id_equipo, id_jugador),

);

-- -------------------------
-- TABLA: torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS torneo (
    id_torneo    SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    categoria    VARCHAR(20) NOT NULL,
    genero       VARCHAR(20) NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin    DATE,
    activo       BOOLEAN DEFAULT TRUE,
    CONSTRAINT torneo_nombre_cat UNIQUE (nombre, categoria),
    CONSTRAINT chk_torneo_genero CHECK (genero IN ('Masculino','Femenino','Mixto'))
);

-- -------------------------
-- TABLA: fase (para eliminatorias)
-- -------------------------
CREATE TABLE IF NOT EXISTS fase (
    id_fase       SERIAL PRIMARY KEY,
    torneo_id     INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre        VARCHAR(50) NOT NULL,
    tipo          VARCHAR(20) NOT NULL,   -- 'eliminacion' | 'playoff' | etc.
    orden         INT,
    fecha_inicio  DATE,
    fecha_fin     DATE
);

-- -------------------------
-- TABLA: inscripcion_equipo (equipo participa en un torneo)
-- -------------------------
CREATE TABLE IF NOT EXISTS inscripcion_equipo (
    id                SERIAL PRIMARY KEY,
    equipo_id         INT NOT NULL REFERENCES equipo(id_equipo),
    torneo_id         INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    categoria         VARCHAR(50) NOT NULL,
    genero            VARCHAR(20) NOT NULL,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    CONSTRAINT inscripcion_equipo_torneo_unq UNIQUE (equipo_id, torneo_id),
    CONSTRAINT chk_inscripcion_genero CHECK (genero IN ('Masculino','Femenino','Mixto'))
);


-- -------------------------
-- TABLA: partido
-- -------------------------
CREATE TABLE IF NOT EXISTS partido (
    id_partido                 SERIAL PRIMARY KEY,
    id_torneo                  INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    id_fase                    INT REFERENCES fase(id_fase),
    fecha                      DATE DEFAULT CURRENT_DATE,
    horario                    TIME,
    id_local                   INT NOT NULL REFERENCES (equipo_id),
    id_visitante               INT NOT NULL REFERENCES (equipo_id),
    goles_local                INT DEFAULT 0,
    goles_visitante            INT DEFAULT 0,
    id_arbitro1                INT NOT NULL REFERENCES arbitro(id_arbitro),
    id_arbitro2                INT NOT NULL REFERENCES arbitro(id_arbitro),
    ubicacion                  VARCHAR(200),
    observaciones              VARCHAR(1000),
    tipo_fase                  VARCHAR(20) NOT NULL DEFAULT 'liga', -- 'liga' o 'eliminacion'
    numero_fecha               INT,
    CONSTRAINT chk_arbitros_distintos CHECK (id_arbitro1 <> id_arbitro2),
    CONSTRAINT chk_equipos_distintos CHECK (id_local <> id_visitante)
);
-------------------------------------------
-- Tabla para asignar jugadores a cada partido
-- y tambien sus N° de camiseta
-------------------------------------------
CREATE TABLE IF NOT EXISTS jugadores_partidos (
    id_jugador_partido      SERIAL PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_jugador              INT NOT NULL REFERENCES jugador (id_jugador),
    numero_camiseta         INT CHECK (numero_camiseta > 0),

    CONSTRAINT un_jugador_por_partido UNIQUE (id_partido, id_jugador)
);

-- -------------------------
-- TABLA: gol
-- -------------------------
CREATE TABLE IF NOT EXISTS gol (
    id_gol        SERIAL PRIMARY KEY,
    id_partido    INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_jugador    INT NOT NULL REFERENCES jugador(id_jugador),
    minuto        INT,
    cuarto        INT CHECK (cuarto BETWEEN 1 AND 4),
    es_autogol    BOOLEAN DEFAULT FALSE
);

-- -------------------------
-- TABLA: tarjeta
-- -------------------------
CREATE TABLE IF NOT EXISTS tarjeta (
    id_tarjeta    SERIAL PRIMARY KEY,
    id_partido    INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_jugador    INT NOT NULL REFERENCES jugador(id_jugador),
    id_arbitro1   INT REFERENCES arbitro(id_arbitro),
    id_arbitro2   INT REFERENCES arbitro(id_arbitro),
    tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('verde','amarilla','roja')),
    minuto        INT,
    cuarto        INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones VARCHAR(500)
);

-- -------------------------
-- TABLA: posicion
-- -------------------------
CREATE TABLE IF NOT EXISTS posicion (
    id_posicion          SERIAL PRIMARY KEY,
    id_torneo            INT NOT NULL REFERENCES torneo(id_torneo),
    id_equipo            INT NOT NULL REFERENCES equipo(id_equipo),
    puntos               INT DEFAULT 0,
    partidos_jugados     INT DEFAULT 0,
    ganados              INT DEFAULT 0,
    empatados            INT DEFAULT 0,
    perdidos             INT DEFAULT 0,
    goles_a_favor        INT DEFAULT 0,
    goles_en_contra      INT DEFAULT 0,
    diferencia_gol       INT GENERATED ALWAYS AS (goles_a_favor - goles_en_contra) STORED,
    fecha_actualizacion  TIMESTAMP DEFAULT now(),
    CONSTRAINT posicion_equipo_torneo_unq UNIQUE (id_torneo, id_equipo)
);

-- -------------------------
-- ÍNDICES recomendados (opcionales)
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_equipo_id_club ON equipo(id_club);
CREATE INDEX IF NOT EXISTS idx_jugador_dni ON jugador(dni);
CREATE INDEX IF NOT EXISTS idx_partido_id_torneo_fecha ON partido(id_torneo, fecha);

-- =========================
-- 2) FUNCIONES Y TRIGGERS (mejoradas)
-- =========================

/*
 * Nota: incluimos "SET search_path = public" para evitar warnings en entornos
 * como Supabase que detectan funciones con search_path mutable.
 */

-- 1️⃣ Actualizar posiciones (INSERT y UPDATE)
CREATE OR REPLACE FUNCTION actualizar_posiciones()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    equipo_local INT;
    equipo_visitante INT;
BEGIN
    -- Solo aplicar la lógica de posiciones para partidos de liga
    IF NEW.tipo_fase IS DISTINCT FROM 'liga' THEN
        RETURN NEW;
    END IF;

    -- Obtener equipos
    SELECT equipo_id INTO equipo_local FROM inscripcion_equipo WHERE id = NEW.local_inscripcion_id;
    SELECT equipo_id INTO equipo_visitante FROM inscripcion_equipo WHERE id = NEW.visitante_inscripcion_id;

    -- Crear filas si no existen (para NEW)
    INSERT INTO posicion(torneo_id, equipo_id)
        VALUES (NEW.torneo_id, equipo_local) ON CONFLICT DO NOTHING;
    INSERT INTO posicion(torneo_id, equipo_id)
        VALUES (NEW.torneo_id, equipo_visitante) ON CONFLICT DO NOTHING;

    -- Si es UPDATE: primero deshacer el efecto del OLD (si existe y era liga)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.tipo_fase IS DISTINCT FROM 'liga' THEN
            -- si OLD no era liga, no hay que restar nada
            NULL;
        ELSE
            -- Restar OLD local
            UPDATE posicion
               SET partidos_jugados = partidos_jugados - 1,
                   puntos = puntos - CASE WHEN OLD.goles_local>OLD.goles_visitante THEN 3
                                           WHEN OLD.goles_local=OLD.goles_visitante THEN 1
                                           ELSE 0 END,
                   ganados = ganados - CASE WHEN OLD.goles_local>OLD.goles_visitante THEN 1 ELSE 0 END,
                   empatados = empatados - CASE WHEN OLD.goles_local=OLD.goles_visitante THEN 1 ELSE 0 END,
                   perdidos = perdidos - CASE WHEN OLD.goles_local<OLD.goles_visitante THEN 1 ELSE 0 END,
                   goles_a_favor = goles_a_favor - OLD.goles_local,
                   goles_en_contra = goles_en_contra - OLD.goles_visitante,
                   fecha_actualizacion = now()
             WHERE torneo_id = OLD.torneo_id AND equipo_id = equipo_local;

            -- Restar OLD visitante
            UPDATE posicion
               SET partidos_jugados = partidos_jugados - 1,
                   puntos = puntos - CASE WHEN OLD.goles_visitante>OLD.goles_local THEN 3
                                           WHEN OLD.goles_visitante=OLD.goles_local THEN 1
                                           ELSE 0 END,
                   ganados = ganados - CASE WHEN OLD.goles_visitante>OLD.goles_local THEN 1 ELSE 0 END,
                   empatados = empatados - CASE WHEN OLD.goles_visitante=OLD.goles_local THEN 1 ELSE 0 END,
                   perdidos = perdidos - CASE WHEN OLD.goles_visitante<OLD.goles_local THEN 1 ELSE 0 END,
                   goles_a_favor = goles_a_favor - OLD.goles_visitante,
                   goles_en_contra = goles_en_contra - OLD.goles_local,
                   fecha_actualizacion = now()
             WHERE torneo_id = OLD.torneo_id AND equipo_id = equipo_visitante;
        END IF;
    END IF;

    -- Ahora aplicar NEW (sumar)
    UPDATE posicion
       SET partidos_jugados = partidos_jugados + 1,
           puntos = puntos + CASE WHEN NEW.goles_local>NEW.goles_visitante THEN 3
                                   WHEN NEW.goles_local=NEW.goles_visitante THEN 1
                                   ELSE 0 END,
           ganados = ganados + CASE WHEN NEW.goles_local>NEW.goles_visitante THEN 1 ELSE 0 END,
           empatados = empatados + CASE WHEN NEW.goles_local=NEW.goles_visitante THEN 1 ELSE 0 END,
           perdidos = perdidos + CASE WHEN NEW.goles_local<NEW.goles_visitante THEN 1 ELSE 0 END,
           goles_a_favor = goles_a_favor + NEW.goles_local,
           goles_en_contra = goles_en_contra + NEW.goles_visitante,
           fecha_actualizacion = now()
     WHERE torneo_id = NEW.torneo_id AND equipo_id = equipo_local;

    UPDATE posicion
       SET partidos_jugados = partidos_jugados + 1,
           puntos = puntos + CASE WHEN NEW.goles_visitante>NEW.goles_local THEN 3
                                   WHEN NEW.goles_visitante=NEW.goles_local THEN 1
                                   ELSE 0 END,
           ganados = ganados + CASE WHEN NEW.goles_visitante>NEW.goles_local THEN 1 ELSE 0 END,
           empatados = empatados + CASE WHEN NEW.goles_visitante=NEW.goles_local THEN 1 ELSE 0 END,
           perdidos = perdidos + CASE WHEN NEW.goles_visitante<NEW.goles_local THEN 1 ELSE 0 END,
           goles_a_favor = goles_a_favor + NEW.goles_visitante,
           goles_en_contra = goles_en_contra + NEW.goles_local,
           fecha_actualizacion = now()
     WHERE torneo_id = NEW.torneo_id AND equipo_id = equipo_visitante;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_posicion_partido ON partido;
CREATE TRIGGER trg_actualizar_posicion_partido
AFTER INSERT OR UPDATE ON partido
FOR EACH ROW
EXECUTE FUNCTION actualizar_posiciones();


-- 2️⃣ Revertir posiciones al borrar partido
CREATE OR REPLACE FUNCTION deshacer_posicion_partido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    equipo_local INT;
    equipo_visitante INT;
BEGIN
    -- Solo si el partido era de liga
    IF OLD.tipo_fase IS DISTINCT FROM 'liga' THEN
        RETURN OLD;
    END IF;

    SELECT equipo_id INTO equipo_local FROM inscripcion_equipo WHERE id = OLD.local_inscripcion_id;
    SELECT equipo_id INTO equipo_visitante FROM inscripcion_equipo WHERE id = OLD.visitante_inscripcion_id;

    -- Restar local
    UPDATE posicion
       SET partidos_jugados = partidos_jugados - 1,
           puntos = puntos - CASE WHEN OLD.goles_local>OLD.goles_visitante THEN 3
                                   WHEN OLD.goles_local=OLD.goles_visitante THEN 1
                                   ELSE 0 END,
           ganados = ganados - CASE WHEN OLD.goles_local>OLD.goles_visitante THEN 1 ELSE 0 END,
           empatados = empatados - CASE WHEN OLD.goles_local=OLD.goles_visitante THEN 1 ELSE 0 END,
           perdidos = perdidos - CASE WHEN OLD.goles_local<OLD.goles_visitante THEN 1 ELSE 0 END,
           goles_a_favor = goles_a_favor - OLD.goles_local,
           goles_en_contra = goles_en_contra - OLD.goles_visitante,
           fecha_actualizacion = now()
     WHERE torneo_id = OLD.torneo_id AND equipo_id = equipo_local;

    -- Restar visitante
    UPDATE posicion
       SET partidos_jugados = partidos_jugados - 1,
           puntos = puntos - CASE WHEN OLD.goles_visitante>OLD.goles_local THEN 3
                                   WHEN OLD.goles_visitante=OLD.goles_local THEN 1
                                   ELSE 0 END,
           ganados = ganados - CASE WHEN OLD.goles_visitante>OLD.goles_local THEN 1 ELSE 0 END,
           empatados = empatados - CASE WHEN OLD.goles_visitante=OLD.goles_local THEN 1 ELSE 0 END,
           perdidos = perdidos - CASE WHEN OLD.goles_visitante<OLD.goles_local THEN 1 ELSE 0 END,
           goles_a_favor = goles_a_favor - OLD.goles_visitante,
           goles_en_contra = goles_en_contra - OLD.goles_local,
           fecha_actualizacion = now()
     WHERE torneo_id = OLD.torneo_id AND equipo_id = equipo_visitante;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_deshacer_posicion_partido ON partido;
CREATE TRIGGER trg_deshacer_posicion_partido
AFTER DELETE ON partido
FOR EACH ROW
EXECUTE FUNCTION deshacer_posicion_partido();


-- 3️⃣ Verificar género del plantel (inscripcion_plantel)
CREATE OR REPLACE FUNCTION verificar_genero_plantel()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    jugador_gen VARCHAR(20);
    inscripcion_gen VARCHAR(20);
BEGIN
    IF NEW.jugador_id IS NOT NULL THEN
        SELECT genero INTO jugador_gen FROM jugador WHERE id = NEW.jugador_id;
        -- usamos la info de la inscripcion (ya tiene genero)
        SELECT genero INTO inscripcion_gen FROM inscripcion_equipo WHERE id = NEW.inscripcion_id;
        IF inscripcion_gen IS NULL THEN
            RAISE EXCEPTION 'Inscripcion no encontrada para verificar genero';
        END IF;
        IF inscripcion_gen <> 'Mixto' AND jugador_gen <> inscripcion_gen THEN
            RAISE EXCEPTION 'El género del jugador (%), no coincide con la inscripcion (%).', jugador_gen, inscripcion_gen;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verificar_genero_plantel ON inscripcion_plantel;
CREATE TRIGGER trg_verificar_genero_plantel
BEFORE INSERT OR UPDATE ON inscripcion_plantel
FOR EACH ROW
EXECUTE FUNCTION verificar_genero_plantel();


-- 4️⃣ Verificar categoría en inscripcion
CREATE OR REPLACE FUNCTION verificar_categoria_inscripcion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    equipo_cat VARCHAR(50);
    torneo_cat VARCHAR(50);
BEGIN
    SELECT categoria INTO equipo_cat FROM equipo WHERE id = NEW.equipo_id;
    SELECT categoria INTO torneo_cat FROM torneo WHERE id = NEW.torneo_id;
    IF NOT (NEW.categoria = equipo_cat AND NEW.categoria = torneo_cat) THEN
        RAISE EXCEPTION 'La categoría de la inscripción (%) no coincide con el equipo (%) o torneo (%).', NEW.categoria, equipo_cat, torneo_cat;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verificar_categoria_inscripcion ON inscripcion_equipo;
CREATE TRIGGER trg_verificar_categoria_inscripcion
BEFORE INSERT OR UPDATE ON inscripcion_equipo
FOR EACH ROW
EXECUTE FUNCTION verificar_categoria_inscripcion();


-- 5️⃣ Función que copia automáticamente el plantel al torneo (AFTER INSERT inscripcion_equipo)
CREATE OR REPLACE FUNCTION fn_inscribir_plantel()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO inscripcion_plantel (
      inscripcion_id,
      jugador_id,
      entrenador_id,
      numero_camiseta,
      posicion,
      fecha_alta
  )
  SELECT 
      NEW.id,
      pe.jugador_id,
      pe.entrenador_id,
      pe.nro_camiseta,
      pe.posicion,
      CURRENT_DATE
  FROM plantel_equipo pe
  WHERE pe.equipo_id = NEW.equipo_id
    AND CURRENT_DATE BETWEEN pe.fecha_alta AND COALESCE(pe.fecha_baja, '9999-12-31')
  ON CONFLICT (inscripcion_id, jugador_id) DO NOTHING
  ;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inscribir_plantel ON inscripcion_equipo;
CREATE TRIGGER trg_inscribir_plantel
AFTER INSERT ON inscripcion_equipo
FOR EACH ROW
EXECUTE FUNCTION fn_inscribir_plantel();


-- 6️⃣ Función para inscribir plantel manualmente (procedimiento equivalente)
CREATE OR REPLACE FUNCTION fn_inscribir_plantel_manual(p_inscripcion_id INT, p_equipo_id INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO inscripcion_plantel (
      inscripcion_id,
      jugador_id,
      entrenador_id,
      numero_camiseta,
      posicion,
      fecha_alta
  )
  SELECT 
      p_inscripcion_id,
      pe.jugador_id,
      pe.entrenador_id,
      pe.nro_camiseta,
      pe.posicion,
      CURRENT_DATE
  FROM plantel_equipo pe
  WHERE pe.equipo_id = p_equipo_id
    AND CURRENT_DATE BETWEEN pe.fecha_alta AND COALESCE(pe.fecha_baja, '9999-12-31')
  ON CONFLICT (inscripcion_id, jugador_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- 7️⃣ Evitar partidos duplicados (considera fase_id)
CREATE OR REPLACE FUNCTION verificar_partido_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- 1) Evitar que la misma pareja juegue más de una vez en la misma fecha o jornada
  IF EXISTS (
    SELECT 1 FROM partido p
    WHERE p.torneo_id = NEW.torneo_id
      AND COALESCE(p.fase_id,0) = COALESCE(NEW.fase_id,0)
      AND (
        (p.local_inscripcion_id = NEW.local_inscripcion_id AND p.visitante_inscripcion_id = NEW.visitante_inscripcion_id)
        OR
        (p.local_inscripcion_id = NEW.visitante_inscripcion_id AND p.visitante_inscripcion_id = NEW.local_inscripcion_id)
      )
      AND p.id <> COALESCE(NEW.id, 0)
      AND (
        (NEW.fecha IS NOT NULL AND p.fecha = NEW.fecha)
        OR
        (NEW.numero_fecha IS NOT NULL AND p.numero_fecha = NEW.numero_fecha)
      )
  ) THEN
    RAISE EXCEPTION 
      'Ya existe un partido entre estos equipos en este torneo/fase para la misma fecha/jornada';
  END IF;

  -- 2) Evitar que un equipo tenga más de un partido en la misma jornada
  IF NEW.numero_fecha IS NOT NULL THEN
    -- Local
    IF EXISTS (
      SELECT 1 FROM partido p
      WHERE p.torneo_id = NEW.torneo_id
        AND p.numero_fecha = NEW.numero_fecha
        AND p.id <> COALESCE(NEW.id, 0)
        AND (p.local_inscripcion_id = NEW.local_inscripcion_id OR p.visitante_inscripcion_id = NEW.local_inscripcion_id)
    ) THEN
      RAISE EXCEPTION 
        'El equipo (inscripcion %) ya tiene otro partido en la jornada % del torneo %',
        NEW.local_inscripcion_id, NEW.numero_fecha, NEW.torneo_id;
    END IF;

    -- Visitante
    IF EXISTS (
      SELECT 1 FROM partido p
      WHERE p.torneo_id = NEW.torneo_id
        AND p.numero_fecha = NEW.numero_fecha
        AND p.id <> COALESCE(NEW.id, 0)
        AND (p.local_inscripcion_id = NEW.visitante_inscripcion_id OR p.visitante_inscripcion_id = NEW.visitante_inscripcion_id)
    ) THEN
      RAISE EXCEPTION 
        'El equipo (inscripcion %) ya tiene otro partido en la jornada % del torneo %',
        NEW.visitante_inscripcion_id, NEW.numero_fecha, NEW.torneo_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- Drop y creación del trigger
DROP TRIGGER IF EXISTS trg_verificar_partido_unico ON partido;
CREATE TRIGGER trg_verificar_partido_unico
BEFORE INSERT OR UPDATE ON partido
FOR EACH ROW
EXECUTE FUNCTION verificar_partido_unico();


-- 8️⃣ Validar cantidad de goles según marcador (INSERT y UPDATE en gol)
CREATE OR REPLACE FUNCTION validar_goles_partido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    goles_equipo_actual INT;
    max_goles_equipo INT;
    equipo_local_id INT;
    equipo_visitante_id INT;
    partido_record RECORD;
BEGIN
    -- Obtener partido y sus inscripciones locales/visitantes
    SELECT local_inscripcion_id, visitante_inscripcion_id, goles_local, goles_visitante
    INTO partido_record
    FROM partido
    WHERE id = COALESCE(NEW.partido_id, 0);

    IF partido_record IS NULL THEN
        RAISE EXCEPTION 'Partido % no encontrado', NEW.partido_id;
    END IF;

    equipo_local_id := partido_record.local_inscripcion_id;
    equipo_visitante_id := partido_record.visitante_inscripcion_id;

    -- Definir máximo permitido según a qué equipo pertenece NEW.inscripcion_id
    IF NEW.inscripcion_id = equipo_local_id THEN
        max_goles_equipo := partido_record.goles_local;
    ELSIF NEW.inscripcion_id = equipo_visitante_id THEN
        max_goles_equipo := partido_record.goles_visitante;
    ELSE
        RAISE EXCEPTION 'La inscripcion (%) no corresponde a ninguno de los equipos del partido %', NEW.inscripcion_id, NEW.partido_id;
    END IF;

    -- Contar goles actuales para esa inscripcion en este partido, excluyendo el propio registro si es UPDATE
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO goles_equipo_actual
        FROM gol
        WHERE partido_id = NEW.partido_id
          AND inscripcion_id = NEW.inscripcion_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Excluir la fila OLD.id del conteo si existía
        SELECT COUNT(*) INTO goles_equipo_actual
        FROM gol
        WHERE partido_id = NEW.partido_id
          AND inscripcion_id = NEW.inscripcion_id
          AND id <> COALESCE(OLD.id, 0);
    ELSE
        -- no debería entrar
        goles_equipo_actual := 0;
    END IF;

    IF goles_equipo_actual >= max_goles_equipo THEN
        RAISE EXCEPTION 'No se pueden registrar más goles para la inscripcion % en el partido % (max %).', NEW.inscripcion_id, NEW.partido_id, max_goles_equipo;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_goles_partido ON gol;
CREATE TRIGGER trg_validar_goles_partido
BEFORE INSERT OR UPDATE ON gol
FOR EACH ROW
EXECUTE FUNCTION validar_goles_partido();

-- =========================
-- Fin del script
-- =========================

