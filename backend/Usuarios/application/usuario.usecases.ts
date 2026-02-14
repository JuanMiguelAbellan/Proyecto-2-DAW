import Usuario from "../domain/Usuario";
import UsuarioRepository from "../domain/usuario.repository";
import { hash } from "../../context/security/encrypter";
import { compare } from "bcrypt";


export default class UsuarioUseCases{
    constructor(private usuarioRepository: UsuarioRepository){}

    async login(usuario: Usuario): Promise<Usuario | null>{
        if (!usuario.password) throw new Error("Falta password");
        const usuarioBD = await this.usuarioRepository.login(usuario);
        if (!usuarioBD) throw new Error("Usuario no encontrado");
        const iguales = await compare(usuario.password, String(usuarioBD.password));
        if (iguales) {
            return usuarioBD;
        } else {
            throw new Error("Usuario/contraseña no es correcto");
        }
    }

    registro(usuario: Usuario): Promise<Usuario>{
         if (!usuario.password) throw new Error("Falta password");
        const cifrada = hash(usuario.password);
        usuario.password = cifrada;
        return this.usuarioRepository.registro(usuario);
    }

    insertarDoc(){}

    editarPreferencias(){}
}