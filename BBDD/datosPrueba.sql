TRUNCATE TABLE documentos, mensajes, chats, subscripcion, usuarios 
RESTART IDENTITY CASCADE;

-- ============================
-- USUARIOS
-- ============================
INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol, preferencias)
VALUES
('Juan', 'Pérez García', 'juan@example.com', '$2b$10$8m8Qm0qYpYg6u7YpQw1e8u5Q0pGx7xYQ0YQ0YQ0YQ0YQ0YQ0YQ0y', 'usuario', '{"tema":"oscuro"}'),
('Ana', 'López Martín', 'ana@example.com', '$2b$10$9n9Rn1rZqZz7v8ZrRw2f9v6R1qHy8zZQ1ZQ1ZQ1ZQ1ZQ1ZQ1ZQ1z', 'usuario', '{"idioma":"es"}'),
('Admin', 'Root', 'admin@example.com', '$2b$10$7l7Pm9pXpXx6t6XpPw3d7u4P9oFx6xXP9XP9XP9XP9XP9XP9XP9x', 'admin', '{"panel":"avanzado"}');
-- juan123
-- ana123
-- admin123

-- ============================
-- SUBSCRIPCIONES
-- ============================
INSERT INTO subscripcion (id_usuario, num_tarjeta, plan, estado, inicio_periodo, final_periodo)
VALUES
(1, '1111-2222-3333-4444', 'free', 'activa', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days'),
(2, '5555-6666-7777-8888', 'pro', 'activa', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'),
(3, '9999-0000-1111-2222', 'pro', 'pendiente', NOW(), NOW() + INTERVAL '30 days');

-- ============================
-- CHATS
-- ============================
INSERT INTO chats (id_usuario, titulo, context)
VALUES
(1, 'Chat médico', '[]'),
(2, 'Chat general', '[]'),
(3, 'Consultas legales', '[]')
RETURNING id_chat;

-- ============================
-- MENSAJES
-- ============================
INSERT INTO mensajes (id_chat, rol, contenido)
VALUES
(1, 'usuario', 'Hola, necesito ayuda con un informe médico.'),
(1, 'ia', 'Claro, ¿qué tipo de informe necesitas?'),
(2, 'usuario', '¿Puedes recomendarme un libro?'),
(3, 'usuario', 'Tengo dudas sobre un contrato laboral.')
RETURNING id_mensaje;

-- ============================
-- DOCUMENTOS
-- ============================
INSERT INTO documentos (id_mensaje, tipo, s3_key)
VALUES
(1, 'medico', 's3://bucket/documentos/informe1.pdf'),
(2, 'legal', 's3://bucket/documentos/contrato1.pdf');
