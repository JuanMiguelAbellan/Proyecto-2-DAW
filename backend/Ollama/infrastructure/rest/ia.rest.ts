import express, { Request, Response } from "express";
import IaUseCases from "../../application/ia.usecases"
import { isAuth } from "../../../context/security/auth";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";
import IaController from "./ia.controller";
import Mensaje from "../../domain/Mensaje";

const iaUsecases = new IaUseCases(new IaRepositoryPostgres, new IaController)

const routerIA = express.Router();

routerIA.post("/generate", isAuth, async (req: Request, res: Response)=>{
    const { prompt, tipo, idChat} = req.body;
    const idUsuario = req.body.idUser
    const respuesta=await iaUsecases.getRespuesta(prompt, tipo, idUsuario, idChat)
    if(respuesta.contenido == null || respuesta.contenido == ""){
        res.status(500).send("Error al contactar con Ollama")
    }
    res.status(200).send(respuesta)
});

routerIA.post("/nuevo", async (req: Request, res: Response)=>{
    const {usuario} = req.body;
    let prompt = "Comportamiento + info usuario"
    const respuesta=await iaUsecases.getRespuesta(prompt, usuario.tipo, usuario.id)
    if(respuesta.contenido == null || respuesta.contenido == ""){
        res.status(500).send("Error al contactar con Ollama")
    }
    res.status(200).send(respuesta)
})

export default routerIA;