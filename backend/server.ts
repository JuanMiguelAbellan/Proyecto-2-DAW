import express from "express";
import routerUsuario from "./Usuarios/infrastructure/rest/usuario.rest"
import routerIA from "./Ollama/infrastructure/rest/ia.rest"
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const allowedOrigins = ["http://localhost:5173"];
const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
const app = express();
app.use(express.json());
app.use(cors(options));

const api = "/api/";

app.use(express.json())
app.use(`${api}usuarios`, routerUsuario);
app.use(`${api}ia`, routerIA)

export default app