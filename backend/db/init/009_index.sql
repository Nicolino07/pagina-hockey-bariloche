-- creacion de indices para el sistema
BEGIN;

CREATE INDEX idx_refresh_token_hash
ON refresh_token (token_hash);

CREATE INDEX idx_refresh_token_usuario
ON refresh_token (id_usuario);

COMMIT;