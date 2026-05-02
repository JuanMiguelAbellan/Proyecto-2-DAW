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
        const query = `
            SELECT m.id_mensaje AS id, m.rol, m.contenido, m.creado_en AS "fechaCreacion",
                   d.tipo AS "tipoDoc"
            FROM mensajes m
            LEFT JOIN documentos d ON d.id_mensaje = m.id_mensaje
            WHERE m.id_chat = $1
            ORDER BY m.creado_en ASC`
        const rows = await executeQuery(query, [idChat]);
        return (rows || []).map(r => ({
            ...r,
            tipo: r.tipoDoc ? 'documento' : 'normal',
            contenidoDoc: r.tipoDoc ? r.contenido : undefined
        }))
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
    async guardarRespuesta(respuesta: Mensaje, idChat?: Number, idUsuario?: Number): Promise<Number> {
        let idChatNuevo = idChat
        if (idChat == null && idUsuario != null) {
            idChatNuevo = await this.crearChat(idUsuario)
        }
        const contenido = respuesta.tipo === 'documento' ? (respuesta.contenidoDoc || respuesta.contenido) : respuesta.contenido
        const query = `INSERT INTO mensajes (id_chat, rol, contenido) VALUES ($1, 'ia', $2) RETURNING id_mensaje`
        const rows: any[] = await executeQuery(query, [idChatNuevo, contenido]);
        if (!rows) throw new Error("Error guardando la respuesta")
        return rows[0].id_mensaje
    }
    async guardarDocumentoRespuesta(idMensaje: Number, key: String, tipoDoc?: string): Promise<void> {
        const TIPO_MAP: Record<string, string> = { 'médico': 'medico', 'legal': 'legal', 'educativo': 'educativo', 'general': 'otro' }
        const tipo = TIPO_MAP[tipoDoc || ''] || 'otro'
        const query = `INSERT INTO documentos (id_mensaje, s3_key, tipo) VALUES ($1, $2, $3)`
        const rows: any[] = await executeQuery(query, [idMensaje, key || '', tipo]);
        if (!rows) throw new Error("Error guardando el documento de respuesta")
    }
    async getDocumentos(idUsuario: Number): Promise<any[]> {
        const query = `
            SELECT d.id_documento AS id, d.tipo, d.creado_en AS "fechaCreacion",
                   LEFT(m.contenido, 200) AS preview, c.titulo AS chat
            FROM documentos d
            JOIN mensajes m ON m.id_mensaje = d.id_mensaje
            JOIN chats c ON c.id_chat = m.id_chat
            WHERE c.id_usuario = $1
            ORDER BY d.creado_en DESC`
        const TIPO_REVERSE: Record<string, string> = { 'medico': 'médico', 'legal': 'legal', 'educativo': 'educativo', 'otro': 'general' }
        const rows = (await executeQuery(query, [idUsuario])) || []
        return rows.map((r: any) => ({ ...r, tipo: TIPO_REVERSE[r.tipo] || r.tipo }))
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
