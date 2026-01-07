
BEGIN;

INSERT INTO torneo (nombre, categoria, genero, creado_por) 
VALUES
    ('Torneo Apertura', 'B', 'Femenino', 'seed'),
    ('Torneo Clausura', 'A', 'Masculino', 'seed');


COMMIT;