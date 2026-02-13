import Chat from "../domain/Chat"
import Mensaje from "../domain/Mensaje"
export default interface IaReposiroty{
    //Hay que mirar que hacer con las preferencias y como tratarlas
    crearChat(idUsuario: Number):Promise<Number>
    addPreferencia(preferencia: String, idUsuario: Number): Promise<String>
    editPreferencia(preferencias: String, idUsuario: Number): Promise<String>
    guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?:Number): Promise<void>
    guardarDocumentoRespuesta(documento: Mensaje, key:String, idChat?: Number, idUsuario?:Number): Promise<void>
}