import {createToken, isAuth} from "../../../context/security/auth"
import express, { Request, Response } from "express";
import UsuarioUseCases from "../../application/usuario.usecases";
import UsuarioRepositoryPostgres from "../db/usuario.repository.Postgres"
import Usuario from "../../domain/Usuario";
import UsuarioController from "./usuario.controller";

const usuarioUseCases = new UsuarioUseCases(new UsuarioRepositoryPostgres, new UsuarioController)

const routerUsuario = express.Router();

/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               nombre: { type: string }
 *               apellidos: { type: string }
 *               rol: { type: string }
 *               preferencias: { type: object }
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Error al registrar el usuario
 */
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

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       404:
 *         description: Usuario no encontrado
 */
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

routerUsuario.post("/editarPreferencias", isAuth, async (req:Request, res:Response)=>{
    try {
        const idUser = req.body.id
        const { nuevasPreferencias } = req.body
        await usuarioUseCases.editarPreferencias(nuevasPreferencias, idUser)
        res.json({ ok: true })
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
})

/**
 * @swagger
 * /api/usuarios/getChats:
 *   get:
 *     summary: Obtener todos los chats del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats: { type: array, items: { type: object } }
 *       401:
 *         description: No autorizado
 */
routerUsuario.get("/getChats", isAuth, async(req:Request, res:Response)=>{
    const idUser = req.body.id

    const chats = await usuarioUseCases.getChats(idUser)

    res.json({chats})
})

routerUsuario.post("/getHistorial", isAuth, async(req:Request, res:Response)=>{
    const idUser = req.body.id
    const {idChat} = req.body.idChat

    const historial = await usuarioUseCases.getChats(idUser)

    res.json({historial})
})

/**
 * @swagger
 * /api/usuarios/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario (sin password)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email: { type: string }
 *                 nombre: { type: string }
 *                 apellidos: { type: string }
 *                 preferencias: { type: object }
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
routerUsuario.get("/me", isAuth, async(req: Request, res: Response) => {
    try {
        const idUser = req.body.id
        const usuario = await usuarioUseCases.getUsuario(idUser)
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" })
        const { password, ...datos } = usuario
        res.json(datos)
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
})

/**
 * @swagger
 * /api/usuarios/me:
 *   patch:
 *     summary: Editar datos del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               apellidos: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Datos actualizados
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno
 */
routerUsuario.patch("/me", isAuth, async(req: Request, res: Response) => {
    try {
        const idUser = req.body.id
        const { nombre, apellidos, email } = req.body
        await usuarioUseCases.editarInfo(nombre, apellidos, email, idUser)
        res.json({ ok: true })
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
})

/**
 * @swagger
 * /api/usuarios/cambiarPassword:
 *   post:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passwordActual: { type: string }
 *               passwordNueva: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña cambiada correctamente
 *       400:
 *         description: Error (contraseña incorrecta, etc.)
 *       401:
 *         description: No autorizado
 */
routerUsuario.post("/cambiarPassword", isAuth, async(req: Request, res: Response) => {
    try {
        const idUser = req.body.id
        const { passwordActual, passwordNueva } = req.body
        await usuarioUseCases.cambiarPassword(passwordActual, passwordNueva, idUser)
        res.json({ ok: true })
    } catch(e) {
        res.status(400).json({ error: e.message })
    }
})

/**
 * @swagger
 * /api/usuarios/subscripcion:
 *   patch:
 *     summary: Cambiar el plan de suscripción del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string, enum: [free, pro, enterprise] }
 *     responses:
 *       200:
 *         description: Plan actualizado correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno
 */
routerUsuario.patch("/subscripcion", isAuth, async(req: Request, res: Response) => {
    try {
        const idUser = req.body.id
        const { plan } = req.body
        await usuarioUseCases.cambiarPlan(plan, idUser)
        res.json({ ok: true })
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
})

routerUsuario.get("", (req:Request, res:Response)=>{
    res.send("API de usuarios")
})

export default routerUsuario
