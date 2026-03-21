
BEGIN;

INSERT INTO torneo (nombre, categoria, division, genero, creado_por)
VALUES
    ('Torneo Apertura', 'MAYORES', 'B', 'FEMENINO',  'seed'),
    ('Torneo Clausura', 'MAYORES', 'A', 'MASCULINO', 'seed');


COMMIT;