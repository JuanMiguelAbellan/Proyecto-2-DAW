import executeQuery from "../../../context/db/postgres.connector";
import Usuario from "../../domain/Usuario";
import UsuarioRepository from "../../domain/usuario.repository";

export default class UsuarioRepositoryPostgres implements UsuarioRepository{
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