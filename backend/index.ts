import express from "express";
import aiRoutes from "./src/routes/ai.routes";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const api = "/api/";
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/api/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
