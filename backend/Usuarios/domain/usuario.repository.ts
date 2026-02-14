import Usuario from "./Usuario"

export default interface UsuarioRepository{
    login(usuario: Usuario): Promise<Usuario | null>
    registro(usuario: Usuario): Promise<Usuario>
    insertarDoc()
    editarPrefencias()
}