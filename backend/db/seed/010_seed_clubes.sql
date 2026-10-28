-- 8 clubes (IDs 1-8)
BEGIN;

INSERT INTO club (nombre, provincia, ciudad, creado_por) VALUES
('Club Deportivo Nahuel',    'Río Negro', 'Bariloche',          'seed'),  -- 1
('Andino Hockey Club',       'Río Negro', 'Bariloche',          'seed'),  -- 2
('Lagos del Sur HC',         'Río Negro', 'Bariloche',          'seed'),  -- 3
('Patagonia Norte Hockey',   'Río Negro', 'Dina Huapi',         'seed'),  -- 4
('Cerro Catedral HC',        'Río Negro', 'Bariloche',          'seed'),  -- 5
('Villa La Angostura HC',    'Neuquén',   'Villa La Angostura', 'seed'),  -- 6
('Roca Hockey Club',         'Río Negro', 'General Roca',       'seed'),  -- 7
('Neuquén Hockey Club',      'Neuquén',   'Neuquén',            'seed');  -- 8

COMMIT;
