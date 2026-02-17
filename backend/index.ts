import express from "express";
import routerUsuario from "./Usuarios/infrastructure/rest/usuario.rest"
import routerIA from "./Ollama/infrastructure/rest/ia.rest"
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 8080;
const api = "/api/";

app.use(express.json())
app.use(`${api}usuarios`, routerUsuario);
app.use(`${api}tareas`, routerIA)

app.listen(port, () => {
  console.log(`Application started on port ${port}`);
});
