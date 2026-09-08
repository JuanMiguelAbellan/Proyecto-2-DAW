import Usuario from "../domain/Usuario";
import UsuarioRepository from "../domain/usuario.repository";
import { hash } from "../../context/security/encrypter";
import { compare } from "bcrypt";
import { randomBytes } from "crypto";
import Mensaje from "../../Ollama/domain/Mensaje";
import UsuarioController from "../infrastructure/rest/usuario.controller";
import { enviarEmail } from "../../context/mail/mailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


export default class UsuarioUseCases{
    constructor(private usuarioRepository: UsuarioRepository, private usuarioController : UsuarioController){}

    async login(usuario: Usuario): Promise<Usuario | null>{
        if (!usuario.password) {
            throw new Error("Falta password");
        }
        const usuarioBD = await this.usuarioRepository.login(usuario);
        if (usuarioBD == null) {
            throw new Error("Usuario no encontrado");
        }

        const iguales = await compare(usuario.password, String(usuarioBD.password));
        if (iguales) {
            return usuarioBD;
        } else {
            throw new Error("Usuario/contraseña no es correcto");
        }
    }

    async registro(usuario: Usuario): Promise<Usuario>{
         if (!usuario.password){
            throw new Error("Falta password");
        }
        if (await this.usuarioRepository.existeEmail(usuario.email)) {
            throw new Error("Ya existe una cuenta con ese email");
        }
        const cifrada = hash(usuario.password);
        usuario.password = cifrada;
        const usuarioCreado = await this.usuarioRepository.registro(usuario);

        const token = randomBytes(32).toString("hex");
        await this.usuarioRepository.guardarTokenVerificacion(usuarioCreado.id, token);
        // No esperamos a que el email salga: si el SMTP tarda o falla no debe
        // tirar abajo un registro que ya se ha guardado correctamente en BD.
        enviarEmail(
            usuarioCreado.email,
            "Verifica tu cuenta de IADocuments",
            `<p>Hola ${usuarioCreado.nombre || ""},</p>
             <p>Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
             <p><a href="${FRONTEND_URL}/verificar-email/${token}">${FRONTEND_URL}/verificar-email/${token}</a></p>`
        ).catch(err => console.error("Error enviando email de verificación:", err));

        return usuarioCreado;
    }

    async verificarEmail(token: string): Promise<boolean> {
        return this.usuarioRepository.verificarEmail(token);
    }

    async solicitarResetPassword(email: string): Promise<void> {
        const token = randomBytes(32).toString("hex");
        const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        const existe = await this.usuarioRepository.guardarTokenReset(email, token, expira);
        // Si el email no existe no avisamos del motivo, para no filtrar qué
        // correos están registrados.
        if (!existe) return;
        enviarEmail(
            email,
            "Recupera tu contraseña de IADocuments",
            `<p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
             <p>Si has sido tú, haz clic en el siguiente enlace (caduca en 1 hora):</p>
             <p><a href="${FRONTEND_URL}/resetear-password/${token}">${FRONTEND_URL}/resetear-password/${token}</a></p>
             <p>Si no has sido tú, puedes ignorar este correo.</p>`
        ).catch(err => console.error("Error enviando email de recuperación:", err));
    }

    async resetearPassword(token: string, nuevaPassword: string): Promise<boolean> {
        const nuevoHash = hash(nuevaPassword);
        return this.usuarioRepository.resetearPasswordConToken(token, nuevoHash);
    }

    getUsuario(idUser: Number):Promise<Usuario>{
        return this.usuarioRepository.getUsuario(idUser)
    }

    async insertarDoc(usuario: Usuario, documento:Mensaje){
        let cantidad:Number = 5
        if(usuario.planSubscripcion != null && usuario.planSubscripcion == "free"){
            cantidad=5
        }else if(usuario.planSubscripcion != null && usuario.planSubscripcion == "pro"){
            cantidad=50
        }
        let count:Number=0;
        count = await this.usuarioRepository.contarDocsMes(usuario.id)
        if(count >= cantidad){
            throw new Error("Se ha superado el límite de documentos por mes")
        }else{
            let key:string = await this.usuarioController.guardarDocsS3(documento, documento.titulo)
            await this.usuarioRepository.insertarDoc(documento, key)
        }
    }

    async editarPreferencias(preferencias, idUser:Number): Promise<void> {
        await this.usuarioRepository.editarPrefencias(preferencias, idUser)
    }

    getChats(idUser:Number):Promise<any>{
        return this.usuarioRepository.getChats(idUser)
    }

    getHistorial(idUser:Number, idChat:Number):Promise<[{}]>{
        return this.usuarioRepository.getHistorial(idUser, idChat)
    }

    async editarInfo(nombre: string, apellidos: string, email: string, id: Number): Promise<void> {
        return this.usuarioRepository.editarInfo(nombre, apellidos, email, id)
    }

    async cambiarPassword(oldPassword: string, newPassword: string, id: Number): Promise<void> {
        const usuario = await this.usuarioRepository.getUsuario(id)
        if (!usuario) throw new Error("Usuario no encontrado")
        const correcto = await compare(oldPassword, String(usuario.password))
        if (!correcto) throw new Error("Contraseña actual incorrecta")
        const newHash = await hash(newPassword)
        return this.usuarioRepository.cambiarPassword(newHash, id)
    }

    async cambiarPlan(plan: string, id: Number): Promise<void> {
        return this.usuarioRepository.cambiarPlan(plan, id)
    }
}
