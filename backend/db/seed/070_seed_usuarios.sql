
BEGIN;

-- Datos de usuarios
INSERT INTO usuario (username, email, password_hash, tipo, creado_por) VALUES
('Nico_super', 'admin@pagina-hockey.com', '$2b$12$KIXQJYk7Zx1k3jH6u1jD9uYpZ0FzQeW8y5Zl1E6hZl1E6hZl1E6hZl1', 'superusuario', 'seed'), -- password: admin123
('Delegado_01', 'delegado_01@pagina-hockey.com', '$2b$12$7QJYk7Zx1k3jH6u1jD9uYpZ0FzQeW8y5Zl1E6hZl1E6hZl1E6hZl2', 'admin', 'seed'), -- password: coach123
('Delegado_02', 'delegado_02@pagina-hockey.com', '$2b$12$3Yk7Zx1k3jH6u1jD9uYpZ0FzQeW8y5Zl1E6hZl1E6hZl1E6hZl3', 'lector', 'seed'), -- password: player123
('Delegado_03', 'delegado_03@pagina-hockey.com', '$2b$12$3Yk7Zx1k3jH6u1jD9uYpZ0FzQeW8y5Zl1E6hZl1E6hZl1E6hZl4', 'editor', 'seed'); -- password: player123

COMMIT;
