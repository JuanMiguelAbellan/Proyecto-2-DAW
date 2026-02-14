import executeQuery from "../../../context/db/postgres.connector";
import IaReposiroty from "../../domain/ia.repository";
import Mensaje from "../../domain/Mensaje"

export default class IaRepositoryPostgres implements IaReposiroty{
    async crearChat(idUsuario: Number ): Promise<Number> {
        const query = `INSERT INTO chats (id_usuario) VALUES ('${idUsuario}') RETURNING id_chat`
        const rows = await executeQuery(query);
        return rows[0].id_chat;
    }
    async guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?:Number): Promise<void> {
        let idChatNuevo
        if(idChat == null && idUsuario != null){
            idChatNuevo=this.crearChat(idUsuario)
        }else{
            idChatNuevo=idChat
        }
        const query=`INSERT INTO respuestas (id_chat, mensaje) VALUES ('${idChatNuevo}', '${respuesta.contenido}')`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando las respuestas");
        }
    }
    async guardarDocumentoRespuesta(documento: Mensaje, key:String, idChat?: Number, idUsuario?:Number): Promise<void> {
        let idChatNuevo
        if(idChat == null && idUsuario != null){
            idChatNuevo=this.crearChat(idUsuario)
        }else{
            idChatNuevo=idChat
        }
        const query=`INSERT INTO documentos_respuesta (id_chat, key, contenido) VALUES ('${idChatNuevo}', '${key}', '${documento.contenidoDoc}')`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando el documento de respuesta");
        }
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
    async contarDocumentosMesActual(idUsuario:Number): Promise<Number> { 
        const query = ` SELECT COUNT(*) AS total FROM documentos d
        JOIN chats c ON d.id_chat = c.id_chat
        WHERE c.id_usuario = '${idUsuario}'
        AND date_trunc('month', d.creado_en) = date_trunc('month', NOW()); `;

        const result = await executeQuery(query); 
        return Number(result.rows[0].total);

    }
}