import Mensaje from "../../Ollama/domain/Mensaje"
import Usuario from "./Usuario"

export default interface UsuarioRepository{
    login(usuario: Usuario): Promise<Usuario | null>
    registro(usuario: Usuario): Promise<Usuario>
    existeEmail(email: string): Promise<boolean>
    insertarDoc(documento:Mensaje, key:string)
    editarPrefencias(preferencias, idUser:Number):Promise<void>
    contarDocsMes(idUsuario: Number): Promise<Number>
    getUsuario(idUsuario:Number):Promise<Usuario>
    getChats(idUsuario:Number):Promise<any>
    getHistorial(idUsuario:Number, idChat:Number):Promise<[{}]>
    editarInfo(nombre: string, apellidos: string, email: string, id: Number): Promise<void>
    cambiarPassword(newPasswordHash: string, id: Number): Promise<void>
    cambiarPlan(plan: string, id: Number): Promise<void>
    guardarTokenVerificacion(id: Number, token: string): Promise<void>
    verificarEmail(token: string): Promise<boolean>
    guardarTokenReset(email: string, token: string, expira: Date): Promise<boolean>
    resetearPasswordConToken(token: string, newPasswordHash: string): Promise<boolean>
}
