BEGIN;

INSERT INTO equipo (id_club, nombre, categoria, division, genero, creado_por) VALUES
-- equipos id 1 y 2
(1,  'Nahuel Damas',        'MAYORES', 'B', 'FEMENINO',  'seed'),
(1,  'Nahuel Caballeros',   'MAYORES', 'A', 'MASCULINO', 'seed'),
-- equipos id 3 y 4
(2, 'Andino Damas',         'MAYORES', 'B', 'FEMENINO',  'seed'),
(2,  'Andino Caballeros',   'MAYORES', 'A', 'MASCULINO', 'seed'),
-- equipos id 5 y 6
(3, 'Lagos Damas',          'MAYORES', 'B', 'FEMENINO',  'seed'),
(3,  'Lagos Caballeros',    'MAYORES', 'A', 'MASCULINO', 'seed'),
-- equipos id 7 y 8
(4, 'Patagonia Damas',      'MAYORES', 'B', 'FEMENINO',  'seed'),
(4,  'Patagonia Caballeros','MAYORES', 'A', 'MASCULINO', 'seed');


COMMIT;

