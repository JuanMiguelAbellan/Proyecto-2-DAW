import executeQuery from "../../../context/db/postgres.connector";
import Usuario from "../../domain/Usuario";
import UsuarioRepository from "../../domain/usuario.repository";
import Mensaje from "../../../Ollama/domain/Mensaje"

export default class UsuarioRepositoryPostgres implements UsuarioRepository{
    async getUsuario(idUsuario: Number): Promise<Usuario> {
        const query = `SELECT * FROM usuarios u 
        JOIN  subscripcion s ON u.id_usuario = s.id_usuario
        WHERE u.id_usuario = ${idUsuario}
        `
        //AND s.estado = 'activa'
        const result: any[] = await executeQuery(query);
        if (result.length === 0) {
            return null;
        }
        const user = result[0]; 
        
        return {
            id: user.id_usuario,
            email: user.email,
            password: user.password,
            nombre:user.nombre,
            rol:user.rol,
            preferencias:user.preferencias,
            planSubscripcion: user.plan
        };

    }
    async contarDocsMes(idUsuario : Number):Promise<Number> {
        const query = ` SELECT COUNT(*) AS total FROM documentos d
        JOIN chats c ON d.id_mensaje= (SELECT id_chat FROM mensajes WHERE id_mensaje= d.id_mensaje)
        WHERE c.id_usuario = ${idUsuario}
        AND date_trunc('month', d.creado_en) = date_trunc('month', NOW()); `;

        const result = await executeQuery(query);
        
        return Number(result[0].total);
    }
    async insertarMensaje(mensaje:Mensaje){
        const query=`INSERT INTO mensajes (id_chat, rol, contenido) VALUES ('${mensaje.idChat}', '${mensaje.rol}', '${mensaje.contenido}')`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando el mensaje");
        }
    }
    async insertarDoc( documento:Mensaje, key:string) {
        await this.insertarMensaje(documento)
        const query=`INSERT INTO documentos (id_mensaje, s3_key, tipo) VALUES ('${documento.id}', '${key}', '${documento.tipoDoc}')`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando el documento");
        }
    }
    async editarPrefencias(preferencias:any, id:Number):Promise<void> {
        const preferenciasJSon = JSON.stringify(preferencias);
        //console.log(preferenciasJSon);
        
        const query = `UPDATE usuarios SET preferencias = '${preferenciasJSon}' WHERE id_usuario = '${id}'`
        return await executeQuery(query)
    }
    async login(usuario: Usuario): Promise<Usuario | null> {
        const query = `SELECT * FROM usuarios WHERE email = '${usuario.email}'`;

        const result: any[] = await executeQuery(query);
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
            preferencias: row.preferencias
        };
        return usuarioDB;
    }
    async registro(usuario: Usuario): Promise<Usuario> {
        const preferenciasJson = JSON.stringify(usuario.preferencias);
        const query = `INSERT INTO usuarios (email, password_hash, nombre, apellidos, rol, preferencias) 
        VALUES ('${usuario.email}', '${usuario.password}', '${usuario.nombre}', '${usuario.apellidos}', '${usuario.rol}', '${preferenciasJson}')
        RETURNING *`;
        
        const result = await executeQuery(query);

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
            preferencias: row.preferencias
        };
        return usuarioDB;
    }

}