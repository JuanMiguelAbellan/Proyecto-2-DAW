import express, { Request, Response } from "express";
import IaUseCases from "../../application/ia.usecases"
import { isAuth } from "../../../context/security/auth";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";
import IaController from "./ia.controller";

const iaUsecases = new IaUseCases(new IaRepositoryPostgres, new IaController)

const routerIA = express.Router();

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

routerIA.post("/nuevo", isAuth, async (req: Request, res: Response) => {
    const idUsuario = req.body.id;
    const idChat = await iaUsecases.nuevoChat(idUsuario)
    res.json({ chat: { id_chat: idChat, titulo: "Nuevo chat" } })
});

routerIA.get("/mensajes/:idChat", isAuth, async (req: Request, res: Response) => {
    const idChat = Number(req.params.idChat)
    const mensajes = await iaUsecases.getMensajes(idChat)
    res.json({ mensajes })
});

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
