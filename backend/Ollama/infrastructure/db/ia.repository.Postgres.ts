import executeQuery from "../../../context/db/postgres.connector";
import IaReposiroty from "../../domain/ia.repository";
import Mensaje from "../../domain/Mensaje"

export default class IaRepositoryPostgres implements IaReposiroty {
    async crearChat(idUsuario: Number): Promise<Number> {
        const query = `INSERT INTO chats (id_usuario, titulo) VALUES ($1, 'Nuevo chat') RETURNING id_chat`
        const rows = await executeQuery(query, [idUsuario]);
        return rows[0].id_chat;
    }
    async getMensajes(idChat: Number): Promise<Mensaje[]> {
        const query = `SELECT id_mensaje AS id, rol, contenido, creado_en AS "fechaCreacion" FROM mensajes WHERE id_chat = $1 ORDER BY creado_en ASC`
        const rows = await executeQuery(query, [idChat]);
        return rows || [];
    }
    async contarMensajes(idChat: Number): Promise<Number> {
        const query = `SELECT COUNT(*) AS total FROM mensajes WHERE id_chat = $1`
        const rows = await executeQuery(query, [idChat])
        return Number(rows[0].total)
    }
    async actualizarTituloChat(idChat: Number, titulo: string): Promise<void> {
        const query = `UPDATE chats SET titulo = $1 WHERE id_chat = $2`
        await executeQuery(query, [titulo, idChat])
    }
    async guardarMensajeUsuario(prompt: string, idChat: Number): Promise<void> {
        const query = `INSERT INTO mensajes (id_chat, rol, contenido) VALUES ($1, 'usuario', $2)`
        await executeQuery(query, [idChat, prompt]);
    }
    async guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?: Number): Promise<void> {
        let idChatNuevo = idChat
        if (idChat == null && idUsuario != null) {
            idChatNuevo = await this.crearChat(idUsuario)
        }
        const query = `INSERT INTO mensajes (id_chat, rol, contenido) VALUES ($1, 'ia', $2)`
        const rows: any[] = await executeQuery(query, [idChatNuevo, respuesta.contenido]);
        if (!rows) {
            throw new Error("Error guardando la respuesta");
        }
    }
    async guardarDocumentoRespuesta(documento: Mensaje, key: String): Promise<void> {
        const query = `INSERT INTO documentos (id_mensaje, s3_key, tipo) VALUES ($1, $2, $3)`
        const rows: any[] = await executeQuery(query, [documento.id, key, documento.tipoDoc || 'otro']);
        if (!rows) {
            throw new Error("Error guardando el documento de respuesta");
        }
    }
    async addPreferencia(preferencia: String, id: Number): Promise<String> {
        const query = `UPDATE usuarios SET preferencias = preferencias || $1::jsonb WHERE id_usuario = $2`
        const rows: any[] = await executeQuery(query, [preferencia, id]);
        if (!rows) {
            throw new Error("Error guardando las preferencias");
        }
        return rows[0]
    }
    async editPreferencia(preferencias: String, id: Number): Promise<String> {
        const query = `UPDATE usuarios SET preferencias = $1::jsonb WHERE id_usuario = $2`
        const rows: any[] = await executeQuery(query, [preferencias, id]);
        if (!rows) {
            throw new Error("Error guardando las preferencias");
        }
        return rows[0]
    }
    async eliminarChat(idChat: Number): Promise<void> {
        await executeQuery(`DELETE FROM mensajes WHERE id_chat = $1`, [idChat])
        await executeQuery(`DELETE FROM chats WHERE id_chat = $1`, [idChat])
    }
}
