-- 8 inscripciones en torneo 1 (IDs 1-8)
BEGIN;

INSERT INTO inscripcion_torneo (id_torneo, id_equipo, creado_por) VALUES
(1, 1, 'seed'),  -- insc 1: Nahuel
(1, 2, 'seed'),  -- insc 2: Andino
(1, 3, 'seed'),  -- insc 3: Lagos
(1, 4, 'seed'),  -- insc 4: Patagonia
(1, 5, 'seed'),  -- insc 5: Catedral
(1, 6, 'seed'),  -- insc 6: Angostura
(1, 7, 'seed'),  -- insc 7: Roca
(1, 8, 'seed');  -- insc 8: Neuquén

COMMIT;
