import executeQuery from "../../../context/db/postgres.connector";
import Usuario from "../../domain/Usuario";
import UsuarioRepository from "../../domain/usuario.repository";
import Mensaje from "../../../Ollama/domain/Mensaje"

export default class UsuarioRepositoryPostgres implements UsuarioRepository{
    async getUsuario(idUsuario: Number): Promise<Usuario> {
        const query = `SELECT * FROM usuarios u 
        JOIN  subscripcion s ON u.id = s.id_usuario
        WHERE id = '${idUsuario}'
        AND s.estado = 'activa'`
        const result: any[] = await executeQuery(query);
        if (result.length === 0) {
            return null;
        }
        const user = result[0];
        
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            nombre:user.nombre,
            rol:user.rol,
            preferencias:user.preferencias,
            planSubscripcion: user.s
        };

    }
    async contarDocsMes(idUsuario : Number):Promise<Number> {
        const query = ` SELECT COUNT(*) AS total FROM documentos d
        JOIN chats c ON d.id_chat = c.id_chat
        WHERE c.id_usuario = '${idUsuario}'
        AND date_trunc('month', d.creado_en) = date_trunc('month', NOW()); `;

        const result = await executeQuery(query); 
        return Number(result.rows[0].total);
    }
    async insertarDoc( documento:Mensaje, key:string) {
        const query=`INSERT INTO documentos (id_mensaje, s3_key, tipo) VALUES ('${documento.id}', '${key}', '${documento.tipoDoc}')`
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando el documento de respuesta");
        }
    }
    async editarPrefencias(preferencias, id:Number):Promise<void> {
        const query = `UPDATE usuarios SET preferencias = '${preferencias}' WHERE id_usuario = '${id}'`
        return await executeQuery(query)
    }
    async login(usuario: Usuario): Promise<Usuario | null> {
        const query = `SELECT * FROM usuarios WHERE email = '${usuario.email}'`;

        const result: any[] = await executeQuery(query);
        if (result.length === 0) {
            return null;
        }
        const user = result[0];
        
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            nombre:user.nombre,
            rol:user.rol,
            preferencias:user.preferencias
        };
    }
    async registro(usuario: Usuario): Promise<Usuario> {
        const query = `INSERT INTO usuarios (email, password, nombre, apellidos, rol, preferencais) 
        VALUES ('${usuario.email}', '${usuario.password}', '${usuario.nombre}', '${usuario.apellidos}', '${usuario.rol}', '${usuario.preferencias}')`;
        const rows: any[] = await executeQuery(query);
        if (!rows) {
            throw new Error("Error guardando usuario");
        }
        const usuarioDB: Usuario = {
            email: rows[0].alias,
            password: rows[0].password,
            id: rows[0].id,
            nombre: rows[0].nombre,
            rol: rows[0].rol,
            preferencias: rows[0].preferencias
        };
        return usuarioDB;
    }

}