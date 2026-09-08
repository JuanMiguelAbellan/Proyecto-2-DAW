import executeQuery from "../../../context/db/postgres.connector";
import Usuario from "../../domain/Usuario";
import UsuarioRepository from "../../domain/usuario.repository";
import Mensaje from "../../../Ollama/domain/Mensaje"

export default class UsuarioRepositoryPostgres implements UsuarioRepository{
    getHistorial(idUsuario: Number, idChat: Number): Promise<[{}]> {
        throw new Error("Method not implemented.");
    }
    async getChats(idUsuario: Number): Promise<any> {
        const query = `SELECT * FROM chats WHERE id_usuario = $1 ORDER BY creado_en DESC`;
        const result: any[] = await executeQuery(query, [idUsuario]);
        return result || [];

    }
    async getUsuario(idUsuario: Number): Promise<Usuario> {
        const query = `SELECT u.*, s.plan FROM usuarios u
        LEFT JOIN subscripcion s ON u.id_usuario = s.id_usuario
        WHERE u.id_usuario = $1`
        const result: any[] = await executeQuery(query, [idUsuario]);
        if (!result || result.length === 0) return null;
        const user = result[0];
        return {
            id: user.id_usuario,
            email: user.email,
            password: user.password_hash,
            nombre: user.nombre,
            apellidos: user.apellidos,
            rol: user.rol,
            preferencias: user.preferencias,
            planSubscripcion: user.plan || 'gratis',
            emailVerificado: user.email_verificado
        };
    }

    async editarInfo(nombre: string, apellidos: string, email: string, id: Number): Promise<void> {
        const query = `UPDATE usuarios SET nombre = $1, apellidos = $2, email = $3 WHERE id_usuario = $4`
        await executeQuery(query, [nombre, apellidos, email, id])
    }

    async cambiarPassword(newPasswordHash: string, id: Number): Promise<void> {
        const query = `UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2`
        await executeQuery(query, [newPasswordHash, id])
    }

    async cambiarPlan(plan: string, id: Number): Promise<void> {
        const planDB = plan === 'pro_anual' ? 'pro' : plan === 'gratis' ? 'free' : plan
        const existe = await executeQuery(`SELECT id_subscripcion FROM subscripcion WHERE id_usuario = $1`, [id])
        if (existe && existe.length > 0) {
            await executeQuery(`UPDATE subscripcion SET plan = $1, estado = 'activa' WHERE id_usuario = $2`, [planDB, id])
        } else {
            const inicio = new Date()
            const fin = new Date(inicio)
            fin.setMonth(fin.getMonth() + (plan === 'pro_anual' ? 12 : 1))
            await executeQuery(
                `INSERT INTO subscripcion (id_usuario, plan, estado, inicio_periodo, final_periodo) VALUES ($1, $2, 'activa', $3, $4)`,
                [id, planDB, inicio, fin]
            )
        }
    }
    async contarDocsMes(idUsuario : Number):Promise<Number> {
        const query = ` SELECT COUNT(*) AS total FROM documentos d
        JOIN chats c ON d.id_mensaje= (SELECT id_chat FROM mensajes WHERE id_mensaje= d.id_mensaje)
        WHERE c.id_usuario = $1
        AND date_trunc('month', d.creado_en) = date_trunc('month', NOW()); `;

        const result = await executeQuery(query, [idUsuario]);

        return Number(result?.[0]?.total || 0);
    }
    async insertarMensaje(mensaje:Mensaje){
        const query=`INSERT INTO mensajes (id_chat, rol, contenido) VALUES ($1, $2, $3)`
        const rows: any[] = await executeQuery(query, [mensaje.idChat, mensaje.rol, mensaje.contenido]);
        if (!rows) {
            throw new Error("Error guardando el mensaje");
        }
    }
    async insertarDoc( documento:Mensaje, key:string) {
        await this.insertarMensaje(documento)
        const query=`INSERT INTO documentos (id_mensaje, s3_key, tipo) VALUES ($1, $2, $3)`
        const rows: any[] = await executeQuery(query, [documento.id, key, documento.tipoDoc]);
        if (!rows) {
            throw new Error("Error guardando el documento");
        }
    }
    async editarPrefencias(preferencias:any, id:Number):Promise<void> {
        const query = `UPDATE usuarios SET preferencias = $1::jsonb WHERE id_usuario = $2`
        await executeQuery(query, [JSON.stringify(preferencias ?? {}), id])
    }
    async login(usuario: Usuario): Promise<Usuario | null> {
        const query = `SELECT * FROM usuarios WHERE email = $1`;

        const result: any[] = await executeQuery(query, [usuario.email]);
        if (!result || result.length === 0) {
            return null;
        }
        const row = result[0];

        const usuarioDB: Usuario = {
            email: row.email,
            password: row.password_hash,
            id: row.id_usuario,
            nombre: row.nombre,
            rol: row.rol,
            preferencias: row.preferencias,
            emailVerificado: row.email_verificado
        };
        return usuarioDB;
    }
    async existeEmail(email: string): Promise<boolean> {
        const result: any[] = await executeQuery(`SELECT 1 FROM usuarios WHERE email = $1`, [email])
        return !!(result && result.length > 0)
    }

    async registro(usuario: Usuario): Promise<Usuario> {
        const preferenciasJson = JSON.stringify(usuario.preferencias ?? {});
        const query = `INSERT INTO usuarios (email, password_hash, nombre, apellidos, rol, preferencias)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;

        const result = await executeQuery(query, [
            usuario.email,
            usuario.password,
            usuario.nombre,
            usuario.apellidos,
            usuario.rol,
            preferenciasJson
        ]);

        if (!result || result.length === 0) {
            throw new Error("Error guardando usuario");
        }

        const row = result[0];

        const usuarioDB: Usuario = {
            email: row.email,
            password: row.password_hash,
            id: row.id_usuario,
            nombre: row.nombre,
            rol: row.rol,
            preferencias: row.preferencias,
            emailVerificado: row.email_verificado
        };
        return usuarioDB;
    }

    async guardarTokenVerificacion(id: Number, token: string): Promise<void> {
        await executeQuery(`UPDATE usuarios SET token_verificacion = $1 WHERE id_usuario = $2`, [token, id])
    }

    async verificarEmail(token: string): Promise<boolean> {
        const result: any[] = await executeQuery(
            `UPDATE usuarios SET email_verificado = TRUE, token_verificacion = NULL
             WHERE token_verificacion = $1 RETURNING id_usuario`,
            [token]
        )
        return !!(result && result.length > 0)
    }

    async guardarTokenReset(email: string, token: string, expira: Date): Promise<boolean> {
        const result: any[] = await executeQuery(
            `UPDATE usuarios SET token_reset_password = $1, token_reset_expira = $2 WHERE email = $3 RETURNING id_usuario`,
            [token, expira, email]
        )
        return !!(result && result.length > 0)
    }

    async resetearPasswordConToken(token: string, newPasswordHash: string): Promise<boolean> {
        const result: any[] = await executeQuery(
            `UPDATE usuarios SET password_hash = $1, token_reset_password = NULL, token_reset_expira = NULL
             WHERE token_reset_password = $2 AND token_reset_expira > NOW() RETURNING id_usuario`,
            [newPasswordHash, token]
        )
        return !!(result && result.length > 0)
    }

}