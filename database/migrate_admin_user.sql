-- Migracion: agregar usuario admin2 (contrasena: admin123)
INSERT INTO usuarios_admin (nombre_usuario, contrasena_hash, rol)
SELECT 'admin2', '$2b$10$GyloJ.yx7BUWc4bzCz7Mlu9Hj7Pl44d34syAIhN/aR6M9rHhrQCau', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE nombre_usuario = 'admin2');
