import Usuario from "../domain/Usuario";
import UsuarioRepository from "../domain/usuario.repository";
import { hash } from "../../context/security/encrypter";
import { compare } from "bcrypt";
import Mensaje from "../../Ollama/domain/Mensaje";
import UsuarioController from "../infrastructure/rest/usuario.controller";


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

    registro(usuario: Usuario): Promise<Usuario>{
         if (!usuario.password){
            throw new Error("Falta password");
        }
        const cifrada = hash(usuario.password);
        usuario.password = cifrada;
        return this.usuarioRepository.registro(usuario);
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
            this.usuarioRepository.insertarDoc(documento, key)
        }
    }

    editarPreferencias(preferencias, idUser:Number){
        this.usuarioRepository.editarPrefencias(preferencias, idUser)
    }

    getChats(idUser:Number):Promise<any>{
        return this.usuarioRepository.getChats(idUser)
    }
}