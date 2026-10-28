-- 8 equipos, uno por club (IDs 1-8)
-- Todos MAYORES MASCULINO para el mismo torneo
BEGIN;

INSERT INTO equipo (id_club, nombre, categoria, division, genero, creado_por) VALUES
(1, 'Nahuel Caballeros',      'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 1
(2, 'Andino Caballeros',      'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 2
(3, 'Lagos Caballeros',       'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 3
(4, 'Patagonia Caballeros',   'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 4
(5, 'Catedral HC',            'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 5
(6, 'Angostura HC',           'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 6
(7, 'Roca HC',                'MAYORES', 'A', 'MASCULINO', 'seed'),  -- equipo 7
(8, 'Neuquén HC',             'MAYORES', 'A', 'MASCULINO', 'seed');  -- equipo 8

COMMIT;
