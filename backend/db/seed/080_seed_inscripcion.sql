
BEGIN;


INSERT INTO inscripcion_torneo (id_torneo, id_equipo,creado_por)
VALUES 
    -- id_torneo = 1 (FEMENINO B)
    (1,1,'seed'),
    (1,3,'seed'),
    (1,5,'seed'),
    (1,7,'seed'),
    -- id_torneo = 2 (MASCULINO A)
    (2,2,'seed'),
    (2,4,'seed'),
    (2,6,'seed'),
    (2,8,'seed');

COMMIT;