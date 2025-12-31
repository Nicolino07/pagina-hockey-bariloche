
-- ================================================
-- TIPOS ENUM PARA ESTANDARIZACIÓN
-- ================================================

CREATE TYPE genero_persona_tipo AS ENUM ('Masculino', 'Femenino');
CREATE TYPE genero_competencia_tipo AS ENUM ('Masculino', 'Femenino', 'Mixto');
CREATE TYPE categoria_tipo AS ENUM ('A', 'B', 'Sub 19', 'Sub 16', 'Sub 14', 'Sub 12');

CREATE TYPE rol_persona_tipo AS ENUM ('jugador', 'entrenador', 'arbitro');
CREATE TYPE rol_plantel_tipo AS ENUM ('jugador', 'entrenador');

CREATE TYPE tipo_tarjeta_enum AS ENUM ('verde', 'amarilla', 'roja');
CREATE TYPE tipo_suspension_enum AS ENUM ('por_partidos', 'por_fecha');
CREATE TYPE referencia_gol_enum AS ENUM ('GJ', 'GC', 'GP', 'DP');
CREATE TYPE tipo_fase_enum AS ENUM ('liga', 'eliminacion', 'grupos');

-- tipo para seguridad de usuarios
CREATE TYPE usuario_tipo AS ENUM ('superusuario', 'admin', 'editor', 'lector');
CREATE TYPE operacion_permiso_tipo AS ENUM ('select', 'insert', 'update', 'delete');

-- ================================================
-- INICIO: CREACIÓN DE TABLAS 
-- ================================================

-- -------------------------
-- TABLA: club
-- -------------------------
CREATE TABLE IF NOT EXISTS club (
    id_club        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    provincia      VARCHAR(100) NOT NULL CHECK(provincia <> ''),
    ciudad         VARCHAR(100) NOT NULL CHECK(ciudad <> ''),
    direccion      VARCHAR(200),
    telefono       VARCHAR(20),
    email          VARCHAR(100),
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT club_unq_nombre_ciudad UNIQUE (nombre, ciudad)
);


-- -------------------------
-- TABLA: equipo
-- -------------------------
CREATE TABLE IF NOT EXISTS equipo (
    id_equipo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    id_club        INT NOT NULL REFERENCES club(id_club) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria      categoria_tipo NOT NULL,
    genero         genero_competencia_tipo NOT NULL,
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);


-- -------------------------
-- TABLA: persona
-- -------------------------
CREATE TABLE IF NOT EXISTS persona (
    id_persona          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni                 INT CHECK(dni > 0) UNIQUE,
    nombre              VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    apellido            VARCHAR(100) NOT NULL CHECK(apellido <> ''),
    fecha_nacimiento    DATE,
    genero              genero_persona_tipo NOT NULL,
    telefono            VARCHAR(20),
    email               VARCHAR(100),
    direccion           VARCHAR(200),
    
    -- Campos de auditoría
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por          VARCHAR(100),
    actualizado_por     VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS persona_rol (
  id_persona_rol  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona      INT NOT NULL REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE CASCADE,
  rol             rol_persona_tipo NOT NULL,
  fecha_desde     DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_hasta     DATE,
  
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por      VARCHAR(100),
  actualizado_por VARCHAR(100),

  CHECK (fecha_hasta IS NULL OR fecha_hasta > fecha_desde)
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_persona_rol_activo
ON persona_rol (id_persona, rol)
WHERE fecha_hasta IS NULL;




-- -------------------------
-- TABLA: torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS torneo (
    id_torneo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    categoria      categoria_tipo NOT NULL,
    genero         genero_competencia_tipo NOT NULL,
    fecha_inicio   DATE DEFAULT CURRENT_DATE,
    fecha_fin      DATE CHECK (fecha_fin > fecha_inicio),
    activo         BOOLEAN DEFAULT TRUE,
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT torneo_nombre_cat UNIQUE (nombre, categoria)
);

-- -------------------------
-- TABLA: inscripcion_torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS inscripcion_torneo (
    id_inscripcion      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo           INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo           INT NOT NULL REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    genero              genero_competencia_tipo NOT NULL,
    fecha_inscripcion   DATE DEFAULT CURRENT_DATE,
    
    -- Campos de auditoría
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por          VARCHAR(100),
    actualizado_por     VARCHAR(100),

    CONSTRAINT inscripcion_equipo_torneo_unq UNIQUE (id_equipo, id_torneo)
);

-- -------------------------
-- TABLA: plantel
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel (
    id_plantel      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo       INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo       INT NOT NULL REFERENCES torneo(id_torneo),
    fecha_creacion  DATE DEFAULT CURRENT_DATE,
    
    -- Campos de auditoría
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),
    
    -- Un plantel por equipo-torneo
    UNIQUE(id_equipo, id_torneo)  
);

-- -------------------------
-- TABLA: plantel_integrante
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel_integrante (
    id_plantel_integrante   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_plantel              INT NOT NULL REFERENCES plantel(id_plantel) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_persona              INT NOT NULL REFERENCES persona(id_persona),
    rol_en_plantel          rol_plantel_tipo NOT NULL,
    numero_camiseta         INT,                -- referencia (opcional) de número de camiseta
    fecha_alta              DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_baja              DATE CHECK (fecha_baja > fecha_alta),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    CONSTRAINT unq_plantel_persona_rol UNIQUE (id_plantel, id_persona, rol_en_plantel),
    -- integrante del plantel solo puede ser jugador o entrenador (nunca arbitro)
    CONSTRAINT chk_jugador_entrenador CHECK (rol_en_plantel = 'jugador' OR rol_en_plantel = 'entrenador')
);

-- -------------------------
-- TABLA: fase
-- -------------------------
CREATE TABLE IF NOT EXISTS fase (
    id_fase         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo       INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre          VARCHAR(50) NOT NULL CHECK(nombre <> ''),
    tipo            tipo_fase_enum NOT NULL,
    orden           INT,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    
    -- Campos de auditoría
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- -------------------------
-- TABLA: partido
-- -------------------------
CREATE TABLE IF NOT EXISTS partido (
    id_partido                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo                  INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    id_fase                    INT REFERENCES fase(id_fase),
    fecha                      DATE DEFAULT CURRENT_DATE,
    horario                    TIME,
    id_local                   INT NOT NULL REFERENCES equipo(id_equipo),
    id_visitante               INT NOT NULL REFERENCES equipo(id_equipo),
    goles_local                INT DEFAULT 0,
    goles_visitante            INT DEFAULT 0,
    id_arbitro1                INT REFERENCES persona(id_persona),
    id_arbitro2                INT REFERENCES persona(id_persona),
    id_capitan_local           INT REFERENCES plantel_integrante(id_plantel_integrante),
    id_capitan_visitante       INT REFERENCES plantel_integrante(id_plantel_integrante),
    juez_mesa_local            VARCHAR(100),
    juez_mesa_visitante        VARCHAR(100),
    ubicacion                  VARCHAR(200),
    observaciones              VARCHAR(1000),
    tipo_fase                  tipo_fase_enum NOT NULL DEFAULT 'liga',
    numero_fecha               INT,
    
    -- Campos de auditoría
    creado_en                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por                 VARCHAR(100),
    actualizado_por            VARCHAR(100),
    confirmado_por             VARCHAR(100),
    confirmado_en              TIMESTAMP,
    
    CONSTRAINT chk_arbitros_distintos CHECK (id_arbitro1 <> id_arbitro2),
    CONSTRAINT chk_equipos_distintos CHECK (id_local <> id_visitante),
    CONSTRAINT chk_capitanes_local_visitante CHECK (id_capitan_local IS NULL OR id_capitan_visitante IS NULL OR id_capitan_local <> id_capitan_visitante),
    CONSTRAINT partido_unq_equipo_fecha_horario UNIQUE (id_torneo, fecha, id_local, id_visitante)

);

-- -------------------------
-- TABLA: participan_partido
-- -------------------------
CREATE TABLE IF NOT EXISTS participan_partido (
    id_participante_partido INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_plantel_integrante   INT NOT NULL REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE CASCADE,
    numero_camiseta         INT CHECK (numero_camiseta > 0),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    -- Asegura que un jugador/entrenador no se registre dos veces para el mismo partido
    CONSTRAINT unq_jugador_partido UNIQUE (id_partido, id_plantel_integrante)
);

-- -------------------------
-- TABLA: gol
-- -------------------------
CREATE TABLE IF NOT EXISTS gol (
    id_gol                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON UPDATE CASCADE ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido) ON UPDATE CASCADE ON DELETE CASCADE,
    minuto                  INT CHECK (minuto >= 0),
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    -- GJ = Gol jugada, GC = Gol corner corto, GP = Gol penal, DP = Definición penales
    referencia_gol          referencia_gol_enum,
    es_autogol              BOOLEAN DEFAULT FALSE,
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Para anular goles (ej. por VAR)
    anulado                 BOOLEAN DEFAULT FALSE,
    anulado_por             VARCHAR(100),
    anulado_en              TIMESTAMP,
    motivo_anulacion        VARCHAR(500)
);

-- -------------------------
-- TABLA: tarjeta
-- -------------------------
CREATE TABLE IF NOT EXISTS tarjeta (
    id_tarjeta              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido),
    tipo                    tipo_tarjeta_enum NOT NULL,
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones           VARCHAR(500),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Para apelaciones o revisiones
    revisada                BOOLEAN DEFAULT FALSE,
    revisada_por            VARCHAR(100),
    revisada_en             TIMESTAMP,
    decision_revision       VARCHAR(200)
);

-- -------------------------
-- TABLA: suspension
-- -------------------------
CREATE TABLE IF NOT EXISTS suspension (
    id_suspension           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_persona              INT NOT NULL REFERENCES persona(id_persona),
    id_torneo               INT NOT NULL REFERENCES torneo(id_torneo),
    id_partido_origen       INT REFERENCES partido(id_partido), -- Partido que generó la suspensión
    tipo_suspension         tipo_suspension_enum NOT NULL,
    motivo                  VARCHAR(500) NOT NULL CHECK(motivo <> ''),
    fechas_suspension       INT, -- cuántos partidos debe cumplir (NULL si tipo = por_fecha)
    fecha_fin_suspension    DATE NULL, -- fecha hasta la cual dura la suspensión (NULL si tipo = por_partidos)
    cumplidas               INT NOT NULL DEFAULT 0,
    activa                  BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Tracking de partidos cumplidos
    partidos_cumplidos      INT[] DEFAULT '{}' -- IDs de partidos ya cumplidos
 
);

-- -------------------------
-- TABLA: posicion
-- -------------------------
CREATE TABLE IF NOT EXISTS posicion (
    id_posicion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
    
    -- Campos de auditoría
    creado_en            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por           VARCHAR(100),
    actualizado_por      VARCHAR(100),
    
    CONSTRAINT posicion_equipo_torneo_unq UNIQUE (id_torneo, id_equipo)
);

-- ================================================
-- TABLA DE AUDITORÍA GENERAL 
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_log               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada       VARCHAR(100) NOT NULL,
    id_registro          INT,
    operacion            VARCHAR(20) CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores   JSONB,
    valores_nuevos       JSONB,
    usuario              VARCHAR(100),
    fecha_hora           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address           INET,
    user_agent           TEXT
);

-- ================================================
-- TABLA: USUARIO
-- ================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username          VARCHAR(50) UNIQUE NOT NULL CHECK(username <> ''),
    email             VARCHAR(100) UNIQUE NOT NULL CHECK(email <> ''),
    password_hash     TEXT NOT NULL CHECK(password_hash <> ''),
    rol               usuario_tipo NOT NULL DEFAULT 'lector',
    activo            BOOLEAN DEFAULT TRUE,

    -- Seguridad
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta   TIMESTAMP,
    ultimo_login      TIMESTAMP,

    -- Vinculación con persona 
    id_persona        INT REFERENCES persona(id_persona),

    -- Auditoría
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por        VARCHAR(100),
    actualizado_por   VARCHAR(100),

    CONSTRAINT chk_usuario_bloqueo CHECK (bloqueado_hasta IS NULL OR bloqueado_hasta > creado_en)
);

-- ================================================
-- TABLA: permiso_user_tabla
-- ================================================

CREATE TABLE permiso_user_tabla (
    id_permiso        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_usuario       usuario_tipo NOT NULL,
    tabla             VARCHAR(30) NOT NULL,
    operacion         operacion_permiso_tipo NOT NULL,
    permitido         BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por        VARCHAR(100),

    CONSTRAINT unq_permiso UNIQUE (rol_usuario, tabla, operacion)
);

-- ================================================
-- TABLA: refresh_token
-- ===============================================

CREATE TABLE IF NOT EXISTS refresh_token (
    id_refresh_token INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario       INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token_hash       TEXT NOT NULL,
    expires_at       TIMESTAMP NOT NULL,
    revoked          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_ip    INET,
    user_agent       TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_usuario
    ON refresh_token(id_usuario);

CREATE INDEX IF NOT EXISTS idx_refresh_token_activo
    ON refresh_token(revoked, expires_at);

-- ===============================================
-- TABLA: fixture_fecha
-- ===============================================

CREATE TABLE fixture_fecha (
    id_fixture_fecha INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo        INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    numero_fecha     INT NOT NULL,
    rueda            INT NOT NULL DEFAULT 1,
    fecha_programada DATE,

    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por       VARCHAR(100),

    CONSTRAINT unq_fixture_fecha UNIQUE (id_torneo, numero_fecha)
);

-- ===============================================
-- TABLA: fixture_partido
-- ===============================================

CREATE TABLE fixture_partido (
    id_fixture_partido INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_fixture_fecha   INT NOT NULL REFERENCES fixture_fecha(id_fixture_fecha) ON DELETE CASCADE,
    id_equipo_local    INT NOT NULL REFERENCES equipo(id_equipo),
    id_equipo_visitante INT NOT NULL REFERENCES equipo(id_equipo),

    jugado             BOOLEAN DEFAULT FALSE,
    id_partido_real    INT REFERENCES partido(id_partido),

    creado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por         VARCHAR(100),

    CONSTRAINT chk_fixture_equipos_distintos
      CHECK (id_equipo_local <> id_equipo_visitante),

    CONSTRAINT unq_fixture_partido
      UNIQUE (id_fixture_fecha, id_equipo_local, id_equipo_visitante)
);


-- ================================================
-- FIN DE TABLAS
-- ================================================

-- ================================================
-- Triggers/Funciones
-- ================================================

-- Función para verificar permisos antes de operaciones DML 
CREATE OR REPLACE FUNCTION fn_check_permiso()
RETURNS trigger AS $$
DECLARE
  v_rol text;
  v_tabla text := TG_TABLE_NAME;
  v_operacion text := lower(TG_OP);
  v_ok boolean;
BEGIN
  v_rol := current_setting('app.current_user_role', true);

  IF v_rol IS NULL THEN
    RAISE EXCEPTION 'Rol no definido en la sesión';
  END IF;

  -- Superusuario bypass
  IF v_rol = 'superusuario' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT permitido
  INTO v_ok
  FROM permiso_user_tabla
  WHERE rol_usuario = v_rol::usuario_tipo
    AND tabla = v_tabla
    AND operacion = v_operacion::operacion_permiso_tipo;

  IF NOT COALESCE(v_ok, false) THEN
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

-- Función para bloquear modificaciones en la tabla posicion

CREATE OR REPLACE FUNCTION fn_bloquear_posicion()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION USING
    MESSAGE = 'La tabla posicion es de uso exclusivo del sistema',
    ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Función para generar fixture de ida y vuelta
-- ===============================================

CREATE OR REPLACE FUNCTION fn_generar_fixture_ida_vuelta(
  p_id_torneo INT,
  p_creado_por VARCHAR
)
RETURNS void AS $$
DECLARE
  equipos INT[];
  total INT;
  i INT;
  j INT;
  fecha INT := 1;
  id_fecha_ida INT;
  id_fecha_vuelta INT;
BEGIN
  SELECT array_agg(id_equipo ORDER BY id_equipo)
  INTO equipos
  FROM inscripcion_torneo
  WHERE id_torneo = p_id_torneo;

  total := array_length(equipos, 1);

  IF total < 2 THEN
    RAISE EXCEPTION 'No hay suficientes equipos';
  END IF;

  FOR i IN 1..total-1 LOOP
    -- FECHA IDA
    INSERT INTO fixture_fecha (id_torneo, numero_fecha, rueda, creado_por)
    VALUES (p_id_torneo, fecha, 1, p_creado_por)
    RETURNING id_fixture_fecha INTO id_fecha_ida;

    -- FECHA VUELTA
    INSERT INTO fixture_fecha (id_torneo, numero_fecha, rueda, creado_por)
    VALUES (p_id_torneo, fecha + total - 1, 2, p_creado_por)
    RETURNING id_fixture_fecha INTO id_fecha_vuelta;

    FOR j IN i+1..total LOOP
      -- IDA
      INSERT INTO fixture_partido (
        id_fixture_fecha,
        id_equipo_local,
        id_equipo_visitante,
        creado_por
      )
      VALUES (
        id_fecha_ida,
        equipos[i],
        equipos[j],
        p_creado_por
      );

      -- VUELTA (invierten localía)
      INSERT INTO fixture_partido (
        id_fixture_fecha,
        id_equipo_local,
        id_equipo_visitante,
        creado_por
      )
      VALUES (
        id_fecha_vuelta,
        equipos[j],
        equipos[i],
        p_creado_por
      );
    END LOOP;

    fecha := fecha + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger para la tabla partido
CREATE TRIGGER trg_permiso_partido
BEFORE INSERT OR UPDATE OR DELETE ON partido
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para la tabla usuario
CREATE TRIGGER trg_permiso_usuario
BEFORE INSERT OR UPDATE OR DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();   

-- Trigger para persona 
CREATE TRIGGER trg_permiso_persona
BEFORE INSERT OR UPDATE OR DELETE ON persona
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para equipo
CREATE TRIGGER trg_permiso_equipo
BEFORE INSERT OR UPDATE OR DELETE ON equipo
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para torneo
CREATE TRIGGER trg_permiso_torneo
BEFORE INSERT OR UPDATE OR DELETE ON torneo
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para inscripcion_torneo
CREATE TRIGGER trg_permiso_inscripcion_torneo
BEFORE INSERT OR UPDATE OR DELETE ON inscripcion_torneo
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();   

-- Trigger para plantel
CREATE TRIGGER trg_permiso_plantel
BEFORE INSERT OR UPDATE OR DELETE ON plantel
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();   

-- Trigger para plantel_integrante
CREATE TRIGGER trg_permiso_plantel_integrante
BEFORE INSERT OR UPDATE OR DELETE ON plantel_integrante     
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para gol
CREATE TRIGGER trg_permiso_gol
BEFORE INSERT OR UPDATE OR DELETE ON gol
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();   

-- Trigger para tarjeta
CREATE TRIGGER trg_permiso_tarjeta
BEFORE INSERT OR UPDATE OR DELETE ON tarjeta    
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- Trigger para suspension
CREATE TRIGGER trg_permiso_suspension
BEFORE INSERT OR UPDATE OR DELETE ON suspension    
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_bloqueo_posicion
BEFORE INSERT OR UPDATE OR DELETE ON posicion
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_posicion();

CREATE TRIGGER trg_permiso_club
BEFORE INSERT OR UPDATE OR DELETE ON club
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_fase
BEFORE INSERT OR UPDATE OR DELETE ON fase
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_participan_partido
BEFORE INSERT OR UPDATE OR DELETE ON participan_partido
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_persona_rol
BEFORE INSERT OR UPDATE OR DELETE ON persona_rol
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_refresh_token
BEFORE INSERT OR UPDATE OR DELETE ON refresh_token
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_fixture_fecha
BEFORE INSERT OR UPDATE OR DELETE ON fixture_fecha
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_fixture_partido
BEFORE INSERT OR UPDATE OR DELETE ON fixture_partido
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

CREATE TRIGGER trg_permiso_permiso_user_tabla
BEFORE INSERT OR UPDATE OR DELETE ON permiso_user_tabla
FOR EACH ROW EXECUTE FUNCTION fn_check_permiso();

-- ================================================
-- Funciones para posiciones. agregar, eleminar o actualizar
-- ================================================

-- Función para inicializar posición al inscribir equipo en torneo
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
    0,0,0,0,0,0,0
  )
  ON CONFLICT (id_torneo, id_equipo) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_init_posicion
AFTER INSERT ON inscripcion_torneo
FOR EACH ROW
EXECUTE FUNCTION fn_init_posicion();


-- Función para recalcular posiciones de un torneo

CREATE OR REPLACE FUNCTION fn_recalcular_posiciones(id_torneo INT)
RETURNS void AS $$
BEGIN
  WITH estadisticas AS (
    SELECT 
      id_equipo,
      COUNT(*) as partidos_jugados,
      SUM(CASE WHEN goles_local > goles_visitante THEN 3
               WHEN goles_local = goles_visitante THEN 1
               ELSE 0 END) as puntos_local,
      SUM(CASE WHEN goles_visitante > goles_local THEN 3
               WHEN goles_visitante = goles_local THEN 1
               ELSE 0 END) as puntos_visitante,
      SUM(goles_local) as goles_local,
      SUM(goles_visitante) as goles_visitante,
        -- Estadísticas detalladas
      SUM(CASE WHEN goles_local > goles_visitante THEN 1 ELSE 0 END) as ganados_local,
      SUM(CASE WHEN goles_local = goles_visitante THEN 1 ELSE 0 END) as empatados_local,
      SUM(CASE WHEN goles_local < goles_visitante THEN 1 ELSE 0 END) as perdidos_local,
      SUM(CASE WHEN goles_visitante > goles_local THEN 1 ELSE 0 END) as ganados_visitante,
      SUM(CASE WHEN goles_visitante = goles_local THEN 1 ELSE 0 END) as empatados_visitante,
      SUM(CASE WHEN goles_visitante < goles_local THEN 1 ELSE 0 END) as perdidos_visitante
    FROM (
      SELECT id_local as id_equipo, goles_local, goles_visitante
      FROM partido 
      WHERE id_torneo = $1 AND confirmado_en IS NOT NULL
      UNION ALL
      SELECT id_visitante, goles_visitante, goles_local
      FROM partido
      WHERE id_torneo = $1 AND confirmado_en IS NOT NULL
    ) t
    GROUP BY id_equipo
  )
  UPDATE posicion p
  SET 
    puntos = COALESCE(e.puntos_local, 0) + COALESCE(e.puntos_visitante, 0),
    partidos_jugados = COALESCE(e.partidos_jugados, 0),
    goles_a_favor = COALESCE(e.goles_local, 0) + COALESCE(e.goles_visitante, 0),
    goles_en_contra = COALESCE(e.goles_visitante, 0) + COALESCE(e.goles_local, 0),
    ganados = COALESCE(e.ganados_local, 0) + COALESCE(e.ganados_visitante, 0),
    empatados = COALESCE(e.empatados_local, 0) + COALESCE(e.empatados_visitante, 0),
    perdidos = COALESCE(e.perdidos_local, 0) + COALESCE(e.perdidos_visitante, 0),
    actualizado_en = CURRENT_TIMESTAMP
  FROM estadisticas e
  WHERE p.id_equipo = e.id_equipo AND p.id_torneo = $1;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular posiciones al actualizar un partido
CREATE OR REPLACE FUNCTION fn_trg_partido_posiciones()
RETURNS trigger AS $$
DECLARE
  v_torneo INT;
BEGIN
  v_torneo := COALESCE(NEW.id_torneo, OLD.id_torneo);

  PERFORM fn_recalcular_posiciones(v_torneo);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- trigger asociado
CREATE TRIGGER trg_partido_posiciones
AFTER INSERT OR UPDATE OR DELETE ON partido
FOR EACH ROW
EXECUTE FUNCTION fn_trg_partido_posiciones();



-- ================================================
-- VISTAS 
-- ================================================

-- Vista para auditoría reciente
CREATE OR REPLACE VIEW v_auditoria_reciente AS
SELECT 
    tabla_afectada,
    operacion,
    usuario,
    COUNT(*) as cantidad,
    MAX(fecha_hora) as ultima_operacion
FROM auditoria_log
WHERE fecha_hora >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY tabla_afectada, operacion, usuario
ORDER BY ultima_operacion DESC;

CREATE OR REPLACE VIEW v_cambios_partidos AS
SELECT 
    p.id_partido,
    p.id_local,
    p.id_visitante,
    p.fecha,
    al.usuario,
    al.operacion,
    al.fecha_hora as cuando
FROM partido p
JOIN auditoria_log al ON al.id_registro = p.id_partido AND al.tabla_afectada = 'partido'
WHERE al.fecha_hora >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY al.fecha_hora DESC;

-- Vista para fixture de ida y vuelta

CREATE OR REPLACE VIEW v_fixture_ida_vuelta AS
SELECT
  t.nombre AS torneo,
  ff.numero_fecha,
  ff.rueda,
  el.nombre AS local,
  ev.nombre AS visitante,
  fp.jugado
FROM fixture_partido fp
JOIN fixture_fecha ff ON ff.id_fixture_fecha = fp.id_fixture_fecha
JOIN torneo t ON t.id_torneo = ff.id_torneo
JOIN equipo el ON el.id_equipo = fp.id_equipo_local
JOIN equipo ev ON ev.id_equipo = fp.id_equipo_visitante
ORDER BY ff.rueda, ff.numero_fecha;



-- ================================================
-- ÍNDICES 
-- ================================================


-- PERSONA
CREATE INDEX IF NOT EXISTS idx_persona_dni
    ON persona(dni);

CREATE INDEX IF NOT EXISTS idx_persona_nombre_apellido
    ON persona(nombre, apellido);

-- PERSONA_ROL
CREATE INDEX IF NOT EXISTS idx_persona_rol_persona
    ON persona_rol(id_persona);

CREATE INDEX IF NOT EXISTS idx_persona_rol_rol
    ON persona_rol(rol);

CREATE INDEX IF NOT EXISTS idx_persona_rol_activo
    ON persona_rol(id_persona)
    WHERE fecha_hasta IS NULL;

-- EQUIPO / PLANTEL
CREATE INDEX IF NOT EXISTS idx_equipo_club
    ON equipo(id_club);

CREATE INDEX IF NOT EXISTS idx_plantel_equipo
    ON plantel(id_equipo);

-- PLANTEL_INTEGRANTE
CREATE INDEX IF NOT EXISTS idx_pi_plantel
    ON plantel_integrante(id_plantel);

CREATE INDEX IF NOT EXISTS idx_pi_persona
    ON plantel_integrante(id_persona);

CREATE INDEX IF NOT EXISTS idx_pi_rol
    ON plantel_integrante(rol_en_plantel);

CREATE INDEX IF NOT EXISTS idx_pi_fecha_baja
    ON plantel_integrante(fecha_baja);

-- PARTIDO
CREATE INDEX IF NOT EXISTS idx_partido_torneo_fecha
    ON partido(id_torneo, fecha);

CREATE INDEX IF NOT EXISTS idx_partido_local
    ON partido(id_local);

CREATE INDEX IF NOT EXISTS idx_partido_visitante
    ON partido(id_visitante);

-- INSCRIPCIONES
CREATE INDEX IF NOT EXISTS idx_inscripcion_torneo
    ON inscripcion_torneo(id_torneo);

CREATE INDEX IF NOT EXISTS idx_inscripcion_equipo
    ON inscripcion_torneo(id_equipo);

-- PARTICIPANTES
CREATE INDEX IF NOT EXISTS idx_participacion_partido
    ON participan_partido(id_partido);

CREATE INDEX IF NOT EXISTS idx_participante_integrante
    ON participan_partido(id_plantel_integrante);

-- GOLES / TARJETAS
CREATE INDEX IF NOT EXISTS idx_gol_partido
    ON gol(id_partido);

CREATE INDEX IF NOT EXISTS idx_tarjeta_partido
    ON tarjeta(id_partido);

-- POSICIONES
CREATE INDEX IF NOT EXISTS idx_posicion_torneo
    ON posicion(id_torneo);

-- SUSPENSIONES
CREATE INDEX IF NOT EXISTS idx_susp_persona
    ON suspension(id_persona);

CREATE INDEX IF NOT EXISTS idx_susp_torneo
    ON suspension(id_torneo);

CREATE INDEX IF NOT EXISTS idx_susp_persona_activa
    ON suspension(id_persona)
    WHERE activa = true;

-- Índices para suspensiones mejorados
CREATE INDEX IF NOT EXISTS idx_susp_activa_fecha 
    ON suspension(activa, fecha_fin_suspension);


CREATE INDEX IF NOT EXISTS idx_susp_fin
    ON suspension(fecha_fin_suspension);

-- Para búsqueda de jugadores por equipo-torneo (common query)
CREATE INDEX IF NOT EXISTS idx_plantel_integrante_plantel_rol
    ON plantel_integrante(id_plantel, rol_en_plantel, fecha_baja);

-- Para consultas de partidos por fecha (calendarios)
CREATE INDEX IF NOT EXISTS idx_partido_fecha_horario
    ON partido(fecha, horario);

-- Para estadísticas rápidas
CREATE INDEX IF NOT EXISTS idx_gol_jugador
    ON gol(id_participante_partido, anulado);

-- ================================================
-- ÍNDICES PARA AUDITORÍA/SEGURIDAD
-- ================================================

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fecha 
    ON auditoria_log(tabla_afectada, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario 
    ON auditoria_log(usuario, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_auditoria_operacion 
    ON auditoria_log(operacion, fecha_hora);


-- Índices para campos de auditoría frecuentemente consultados
CREATE INDEX IF NOT EXISTS idx_creado_en_partido 
    ON partido(creado_en);

CREATE INDEX IF NOT EXISTS idx_actualizado_en_partido 
    ON partido(actualizado_en);

CREATE INDEX IF NOT EXISTS idx_confirmado_en_partido 
    ON partido(confirmado_en);

CREATE INDEX IF NOT EXISTS idx_creado_por_partido 
    ON partido(creado_por);

-- Índices para seguridad de usuarios

CREATE INDEX idx_usuario_rol
  ON usuario(rol);

CREATE INDEX idx_usuario_activo
  ON usuario(activo);

CREATE INDEX idx_usuario_persona
  ON usuario(id_persona);

-- Índices de seguridad adicionales
CREATE INDEX IF NOT EXISTS idx_permiso_rol_tabla 
    ON permiso_user_tabla(rol_usuario, tabla, operacion);

CREATE INDEX IF NOT EXISTS idx_usuario_activo_bloqueado 
    ON usuario(activo, bloqueado_hasta) 
    WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_usuario_credenciales 
    ON usuario(username, email) 
    WHERE activo = true;


-- ================================================
-- FIN DE ÍNDICES
-- ================================================
