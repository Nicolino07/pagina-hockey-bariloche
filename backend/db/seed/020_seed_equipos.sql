BEGIN;

-- Damas
INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Damas', 'A','FEMENINO', 'seed'),
(2, 'Andino Damas', 'A','FEMENINO', 'seed'),
(3, 'Lagos Damas', 'A','FEMENINO', 'seed'),
(4, 'Patagonia Damas', 'A', 'FEMENINO', 'seed');

-- Caballeros

INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Caballeros', 'A','MASCULINO', 'seed'),
(2,  'Andino Caballeros', 'A', 'MASCULINO', 'seed'),
(3,  'Lagos Caballeros',  'A','MASCULINO', 'seed'),
(4,  'Patagonia Caballeros', 'A', 'MASCULINO', 'seed');

COMMIT;

