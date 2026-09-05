import express, { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require("multer");
import IaUseCases from "../../application/ia.usecases"
import { isAuth } from "../../../context/security/auth";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";
import IaController from "./ia.controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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
    const { prompt, mensajeVisible, tipo, idChat, urlPDF } = req.body;
    const idUsuario = req.body.id;
    const respuesta = await iaUsecases.getRespuesta(prompt, mensajeVisible, tipo, idUsuario, idChat, urlPDF)
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

/**
 * @swagger
 * /api/ia/subirPDF:
 *   post:
 *     summary: Sube un PDF adjuntado por el usuario a almacenamiento permanente (R2)
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: URL pública del PDF subido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 *       400:
 *         description: No se envió ningún archivo
 *       401:
 *         description: No autorizado
 */
routerIA.post("/subirPDF", isAuth, upload.single("file"), async (req: Request, res: Response) => {
    const file = (req as any).file
    if (!file) { res.status(400).json({ error: "No file" }); return }
    try {
        const url = await iaUsecases.subirPDF(file.buffer, file.originalname)
        res.json({ url })
    } catch (error) {
        console.error("Error subiendo PDF:", error)
        res.status(500).json({ error: "Error al subir el PDF" })
    }
});

/**
 * @swagger
 * /api/ia/guardarPDFAnotado/{idMensaje}:
 *   post:
 *     summary: Sustituye el PDF de un mensaje por una versión anotada (resaltados, comentarios...)
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idMensaje
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: URL pública del PDF anotado
 *       403:
 *         description: El mensaje no pertenece al usuario autenticado
 *       401:
 *         description: No autorizado
 */
routerIA.post("/guardarPDFAnotado/:idMensaje", upload.single("file"), isAuth, async (req: Request, res: Response) => {
    const file = (req as any).file
    if (!file) { res.status(400).json({ error: "No file" }); return }
    const idMensaje = Number(req.params.idMensaje)
    const idUsuario = req.body.id
    const url = await iaUsecases.guardarPDFAnotado(idMensaje, idUsuario, file.buffer, file.originalname)
    if (!url) { res.status(403).json({ error: "No autorizado sobre este documento" }); return }
    res.json({ url })
});

routerIA.get("/documentos", isAuth, async (req: Request, res: Response) => {
    const idUsuario = req.body.id
    const documentos = await iaUsecases.getDocumentos(idUsuario)
    res.json({ documentos })
});

routerIA.post("/extractText", isAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
        const file = (req as any).file
        if (!file) { res.status(400).json({ error: "No file" }); return }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require("pdf-parse")
        const data = await pdfParse(file.buffer)
        res.json({ texto: data.text })
    } catch (e) {
        console.error("Error extrayendo texto PDF:", e)
        res.status(500).json({ texto: "" })
    }
});


export default routerIA;
