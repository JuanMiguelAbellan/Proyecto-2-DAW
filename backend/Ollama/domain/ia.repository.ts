import Mensaje from "../domain/Mensaje"

export default interface IaReposiroty {
    crearChat(idUsuario: Number): Promise<Number>
    getMensajes(idChat: Number): Promise<Mensaje[]>
    contarMensajes(idChat: Number): Promise<Number>
    actualizarTituloChat(idChat: Number, titulo: string): Promise<void>
    guardarMensajeUsuario(prompt: string, idChat: Number): Promise<void>
    guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?: Number): Promise<Number>
    guardarDocumentoRespuesta(idMensaje: Number, key: String, tipoDoc?: string): Promise<void>
    getDocumentos(idUsuario: Number): Promise<any[]>
    addPreferencia(preferencia: String, idUsuario: Number): Promise<String>
    editPreferencia(preferencias: String, idUsuario: Number): Promise<String>
    eliminarChat(idChat: Number): Promise<void>
}
