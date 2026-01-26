CREATE TYPE rol_usuario AS ENUM ('admin', 'usuario');
CREATE TYPE plan_subscripcion AS ENUM ('free', 'pro');
CREATE TYPE estado_subscripcion AS ENUM ('activa', 'pendiente', 'cancelada', 'expirada');
CREATE TYPE tipo_documento AS ENUM ('medico', 'legal', 'educativo', 'otro');

CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(150),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol             rol_usuario NOT NULL DEFAULT 'usuario',
    preferencias    JSONB
);

CREATE TABLE subscripcion (
    id_subscripcion     SERIAL,
    id_usuario          INTEGER NOT NULL,
    num_tarjeta         VARCHAR(255),
    plan                plan_subscripcion NOT NULL,
    estado              estado_subscripcion NOT NULL,
    inicio_periodo      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    final_periodo       TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY (id_subscripcion, id_usuario),
    CONSTRAINT fk_subscripcion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE chats (
    id_chat     SERIAL,
    id_usuario  INTEGER NOT NULL,
    historial   TEXT[] DEFAULT '{}',
    PRIMARY KEY (id_chat, id_usuario),
    CONSTRAINT fk_chat_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE documentos (
    id_documento    SERIAL,
    id_chat         INTEGER NOT NULL,
    tipo            tipo_documento NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    PRIMARY KEY (id_documento, id_chat),
    CONSTRAINT fk_documento_chat
        FOREIGN KEY (id_chat) REFERENCES chats (id_chat)
        ON DELETE CASCADE
);
