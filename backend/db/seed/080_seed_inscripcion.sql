
BEGIN;


INSERT INTO inscripcion_torneo (id_torneo, id_equipo,creado_por)
VALUES 
    -- id_torneo = 1 (FEMENINO B)
    (1,1,'seed'),
    (1,2,'seed'),
    (1,3,'seed'),
    (1,4,'seed'),
    -- id_torneo = 2 (MASCULINO A)
    (2,5,'seed'),
    (2,6,'seed'),
    (2,7,'seed'),
    (2,8,'seed');

COMMIT;