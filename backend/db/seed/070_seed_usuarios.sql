
BEGIN;

INSERT INTO usuario (username, email, password_hash, tipo, creado_por) VALUES
(
  'Nico_super',
  'admin@pagina-hockey.com',
  '$argon2id$v=19$m=65536,t=3,p=4$ds5ZixFC6H0PIcQ4Z0yJcQ$fVlPlZ4NnxO8khs1DXwJ5xW0dtxiNpBS//cw9nvGYQU',
  'SUPERUSUARIO',
  'seed'
),
(
  'Delegado_01',
  'delegado_01@pagina-hockey.com',
  '$argon2id$v=19$m=65536,t=3,p=4$vffeu7cWIiTkvFeKcU6J0Q$KrR7/qA0nDKHyrdWX/bxlSZabhU4MYmFIus3fLfhrHQ',
  'ADMIN',
  'seed'
),
(
  'Delegado_02',
  'delegado_02@pagina-hockey.com',
  '$argon2id$v=19$m=65536,t=3,p=4$jXFOSal1jvH+/5+zdm7NWQ$Gk3Gzvh3ydifIy5r5TtFSMJzqX9K4wsJ6mQ1hZI3Fuo',
  'LECTOR',
  'seed'
);

COMMIT;
