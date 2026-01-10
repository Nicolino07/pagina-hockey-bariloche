
BEGIN;

INSERT INTO torneo (nombre, categoria, genero, creado_por) 
VALUES
    ('Torneo Apertura', 'B', 'FEMENINO', 'seed'),
    ('Torneo Clausura', 'A', 'MASCULINO', 'seed');


COMMIT;