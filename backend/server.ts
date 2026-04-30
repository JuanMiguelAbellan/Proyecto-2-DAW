import express from "express";
import routerUsuario from "./Usuarios/infrastructure/rest/usuario.rest"
import routerIA from "./Ollama/infrastructure/rest/ia.rest"
import dotenv from "dotenv";
import cors from "cors";
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

dotenv.config();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost",
  process.env.FRONTEND_URL
].filter(Boolean);
const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors(options));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'IADocuments API', version: '1.0.0', description: 'API para IADocuments - Asistente IA de documentos' },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./Usuarios/infrastructure/rest/*.ts', './Ollama/infrastructure/rest/*.ts']
}
const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const api = "/api/";
app.use(`${api}usuarios`, routerUsuario);
app.use(`${api}ia`, routerIA)

export default app