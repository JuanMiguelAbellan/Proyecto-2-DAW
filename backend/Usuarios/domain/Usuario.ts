import Rol from "./Rol.enum"

export default interface Usuario{
    email?: string
    password?: string
    id?: Number
    nombre?: string
    apellidos?: string
    rol?:Rol | string
    preferencias?:JSON | string
    planSubscripcion?:string
}