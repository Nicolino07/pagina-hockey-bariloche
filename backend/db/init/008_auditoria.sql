BEGIN;

-- ================================================
-- AUDITORÍA GENERAL
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_log             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada     VARCHAR(100) NOT NULL CHECK (tabla_afectada <> ''),
    id_registro        TEXT,
    operacion          VARCHAR(20) NOT NULL
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores JSONB,
    valores_nuevos     JSONB,
    id_usuario         INT REFERENCES usuario(id_usuario),
    fecha_hora         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address         INET,
    user_agent         TEXT
);
 
COMMIT;