import {createToken, isAuth} from "../../../context/security/auth"
import express, { Request, Response } from "express";
import UsuarioUseCases from "../../application/usuario.usecases";
import UsuarioRepositoryPostgres from "../db/usuario.repository.Postgres"
import Usuario from "../../domain/Usuario";
import UsuarioController from "./usuario.controller";

const usuarioUseCases = new UsuarioUseCases(new UsuarioRepositoryPostgres, new UsuarioController)

const routerUsuario = express.Router();

routerUsuario.post("/registro", async (req : Request, res: Response)=>{
    const {email, password, nombre, apellidos, rol, preferencias} = req.body
    const usuario:Usuario ={
        email: email,
        password: password,
        nombre: nombre,
        preferencias: preferencias,
        rol:rol,
        apellidos: apellidos
    }
    const usuarioRegistrado = await usuarioUseCases.registro(usuario)
    if(usuarioRegistrado != null){
        res.status(200).send(usuarioRegistrado)
    } else{
        res.status(400).send("Error al registrar el usuario")
    }
})

routerUsuario.post("/login", async(req : Request, res: Response)=>{
    const {email, password} = req.body
    const usuarioAPI:Usuario ={
        email: email,
        password: password
    }
    const usuario = await usuarioUseCases.login(usuarioAPI)
    if(usuario == null){
        res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    let token=""
    if(usuario != null){
        token = createToken(usuario);
    }
    res.json({ token });
})

routerUsuario.post("/guardarDoc", isAuth, async(req: Request, res: Response)=>{
    const {documento}=req.body
    const idUser = req.body.id
    
    const usuario=await usuarioUseCases.getUsuario(idUser)

    usuarioUseCases.insertarDoc(usuario, documento)
    res.send("Documento guardado correctamente")
})

routerUsuario.post("/editarPreferencias", isAuth, (req:Request, res:Response)=>{
    const idUser = req.body.id
    const {nuevasPreferencias}= req.body

    console.log(nuevasPreferencias);

    usuarioUseCases.editarPreferencias(nuevasPreferencias, idUser)
    res.send("Cambios realizados con exito")
})
export default routerUsuario