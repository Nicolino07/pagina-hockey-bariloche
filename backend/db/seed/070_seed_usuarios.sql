
BEGIN;

INSERT INTO usuario (username, email, password_hash, tipo, creado_por) VALUES
(
  'Nico_super',
  'admin@pagina-hockey.com',
  '$argon2id$v=19$m=65536,t=3,p=4$ds5ZixFC6H0PIcQ4Z0yJcQ$fVlPlZ4NnxO8khs1DXwJ5xW0dtxiNpBS//cw9nvGYQU',
  'SUPERUSUARIO',
  'seed'
);
-- password: admin123


COMMIT;


