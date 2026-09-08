import app from "./server";
import setupChatWebSocket from "./Ollama/infrastructure/ws/chat.ws";
import executeQuery from "./context/db/postgres.connector";

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Application started on port ${port}`);
});

setupChatWebSocket(server);

// Migraciones ligeras e idempotentes que no necesitan un sistema de
// migraciones aparte para un cambio tan pequeño (añadir un valor a un enum).
(async () => {
  await executeQuery(`ALTER TYPE plan_subscripcion ADD VALUE IF NOT EXISTS 'empresa'`);
  console.log("Migración comprobada: plan_subscripcion incluye 'empresa'");
})();

(async () => {
  await executeQuery(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT FALSE`);
  await executeQuery(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255)`);
  await executeQuery(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_password VARCHAR(255)`);
  await executeQuery(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_expira TIMESTAMP`);
  console.log("Migración comprobada: columnas de verificación de email y reset de password");
})();

(async () => {
  await executeQuery(`CREATE EXTENSION IF NOT EXISTS vector`);
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS documento_chunks (
        id_chunk    SERIAL PRIMARY KEY,
        id_chat     INTEGER NOT NULL REFERENCES chats (id_chat) ON DELETE CASCADE,
        id_mensaje  INTEGER REFERENCES mensajes (id_mensaje) ON DELETE CASCADE,
        nombre_doc  VARCHAR(255),
        orden       INTEGER NOT NULL,
        contenido   TEXT NOT NULL,
        embedding   vector(768) NOT NULL,
        creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await executeQuery(`CREATE INDEX IF NOT EXISTS documento_chunks_id_chat_idx ON documento_chunks (id_chat)`);
  await executeQuery(`CREATE INDEX IF NOT EXISTS documento_chunks_embedding_idx ON documento_chunks USING hnsw (embedding vector_cosine_ops)`);
  console.log("Migración comprobada: pgvector y tabla documento_chunks");
})();
