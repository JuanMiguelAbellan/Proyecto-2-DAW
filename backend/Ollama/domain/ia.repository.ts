
export default interface IaReposiroty{
    //Hay que mirar que hacer con las preferencias y como tratarlas
    crearChat(idUsuario: Number /*, chat: Chat*/):Promise<void>
    addPreferencia(preferencia: String, id: Number): Promise<String>
    editPreferencia(preferencias: String, id: Number): Promise<String>
    guardarRespuesta(/*respuesta: Mensaje,*/ idChat: Number): Promise<void>
    guardarDocumentoRes(/*documento: Documento,*/ idChat: number): Promise<void>
}