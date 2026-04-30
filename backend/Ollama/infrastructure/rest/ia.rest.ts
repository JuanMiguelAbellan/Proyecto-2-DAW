import express, { Request, Response } from "express";
import IaUseCases from "../../application/ia.usecases"
import { isAuth } from "../../../context/security/auth";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";
import IaController from "./ia.controller";

const iaUsecases = new IaUseCases(new IaRepositoryPostgres, new IaController)

const routerIA = express.Router();

/**
 * @swagger
 * /api/ia/generate:
 *   post:
 *     summary: Generar respuesta de la IA para un chat
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt: { type: string, description: 'Texto del prompt (puede incluir contenido de documentos)' }
 *               tipo: { type: string, enum: [free, documento], description: 'Tipo de respuesta esperada' }
 *               idChat: { type: integer, description: 'ID del chat activo' }
 *     responses:
 *       200:
 *         description: Respuesta generada por Ollama
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contenido: { type: string }
 *                 titulo: { type: string }
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al contactar con Ollama
 */
routerIA.post("/generate", isAuth, async (req: Request, res: Response) => {
    const { prompt, tipo, idChat } = req.body;
    const idUsuario = req.body.id;
    const respuesta = await iaUsecases.getRespuesta(prompt, tipo, idUsuario, idChat)
    console.log(respuesta);

    if (respuesta.contenido == null || respuesta.contenido == "") {
        res.status(500).send("Error al contactar con Ollama")
        return;
    }
    res.status(200).send(respuesta)
});

/**
 * @swagger
 * /api/ia/nuevo:
 *   post:
 *     summary: Crear un nuevo chat para el usuario autenticado
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   type: object
 *                   properties:
 *                     id_chat: { type: integer }
 *                     titulo: { type: string }
 *       401:
 *         description: No autorizado
 */
routerIA.post("/nuevo", isAuth, async (req: Request, res: Response) => {
    const idUsuario = req.body.id;
    const idChat = await iaUsecases.nuevoChat(idUsuario)
    res.json({ chat: { id_chat: idChat, titulo: "Nuevo chat" } })
});

/**
 * @swagger
 * /api/ia/mensajes/{idChat}:
 *   get:
 *     summary: Obtener el historial de mensajes de un chat
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idChat
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del chat
 *     responses:
 *       200:
 *         description: Lista de mensajes del chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensajes: { type: array, items: { type: object } }
 *       401:
 *         description: No autorizado
 */
routerIA.get("/mensajes/:idChat", isAuth, async (req: Request, res: Response) => {
    const idChat = Number(req.params.idChat)
    const mensajes = await iaUsecases.getMensajes(idChat)
    res.json({ mensajes })
});

/**
 * @swagger
 * /api/ia/chat/{idChat}:
 *   delete:
 *     summary: Eliminar un chat por ID
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idChat
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del chat a eliminar
 *     responses:
 *       200:
 *         description: Chat eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       401:
 *         description: No autorizado
 */
routerIA.delete("/chat/:idChat", isAuth, async (req: Request, res: Response) => {
    const idChat = Number(req.params.idChat)
    await iaUsecases.eliminarChat(idChat)
    res.json({ ok: true })
});

routerIA.post("/testDoc", async (req: Request, res: Response) => {
    const { documento } = req.body
    const urLRespuesta = await iaUsecases.insertDocumento(documento)
    res.send(urLRespuesta)
});

export default routerIA;
