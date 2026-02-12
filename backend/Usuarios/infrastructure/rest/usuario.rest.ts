import {createToken} from "../../../context/security/auth"
import express, { Request, Response } from "express";
import UsuarioUseCases from "../../application/usuario.usecases";
import UsuarioRepositoryPostgres from "../db/usuario.repository.Postgres"
import Usuario from "../../domain/Usuario";

const usuarioUseCases = new UsuarioUseCases(new UsuarioRepositoryPostgres)

const routerUsuario = express.Router();

routerUsuario.post("/registro", (req : Request, res: Response)=>{
    const {email, password, nombre, apellidos, rol, preferencias} = req.body
    const usuario:Usuario ={
        email: email,
        password: password,
        nombre: nombre,
        preferencias: preferencias,
        apellidos: apellidos
    }
    usuarioUseCases.registro(usuario)
    res.status(200).send(usuario)
})

routerUsuario.post("/login", async(req : Request, res: Response)=>{
    const {email, password, nombre, apellidos, rol, preferencias} = req.body
    const usuarioAPI:Usuario ={
        email: email,
        password: password,
        nombre: nombre,
        preferencias: preferencias,
        apellidos: apellidos
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

export default routerUsuario