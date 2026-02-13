import executeQuery from "../../../context/db/postgres.connector";
import IaReposiroty from "../../domain/ia.repository";
import Chat from "../../domain/Chat"
import Mensaje from "../../domain/Mensaje"

export default class IaRepositoryPostgres implements IaReposiroty{
    async crearChat(idUsuario: Number ): Promise<Number> {
        throw new Error("Method not implemented.");
    }
    async guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?:Number): Promise<void> {
        let idChatNuevo
        if(idChat == null && idUsuario != null){
            idChatNuevo=this.crearChat(idUsuario)
        }else{
            idChatNuevo=idChat
        }
        const query=`'${idChatNuevo}'`
        throw new Error("Method not implemented.");
    }
    async guardarDocumentoRespuesta(documento: Mensaje, idChat?: Number, idUsuario?:Number): Promise<void> {
        let idChatNuevo
        if(idChat == null && idUsuario != null){
            idChatNuevo=this.crearChat(idUsuario)
        }else{
            idChatNuevo=idChat
        }
        const query=`'${idChatNuevo}'`
        throw new Error("Method not implemented.");
    }
    async addPreferencia(preferencia: String, id:Number): Promise<String> {
        const query = `UPDATE usuarios SET preferencias += '${preferencia}' WHERE id_usuario = '${id}'`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando las preferencias");
        }
        const respuesta = rows[0]
        return respuesta
    }
    async editPreferencia(preferencias: String, id:Number): Promise<String> {
        const query = `UPDATE usuarios SET preferencias = '${preferencias}' WHERE id_usuario = '${id}'`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando las preferencias");
        }
        const respuesta = rows[0]
        return respuesta
    }
    
}