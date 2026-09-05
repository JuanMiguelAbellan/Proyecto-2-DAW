import app from "./server";
import setupChatWebSocket from "./Ollama/infrastructure/ws/chat.ws";

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Application started on port ${port}`);
});

setupChatWebSocket(server);
