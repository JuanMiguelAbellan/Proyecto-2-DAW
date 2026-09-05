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
