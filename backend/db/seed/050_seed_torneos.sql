-- 1 torneo LIGA MAYORES MASCULINO (ID 1)
BEGIN;

INSERT INTO torneo (nombre, categoria, division, genero, tipo, fecha_inicio, fecha_fin, creado_por)
VALUES ('Torneo Apertura 2024', 'MAYORES', 'A', 'MASCULINO', 'LIGA', '2024-03-02', '2024-06-30', 'seed');

COMMIT;
