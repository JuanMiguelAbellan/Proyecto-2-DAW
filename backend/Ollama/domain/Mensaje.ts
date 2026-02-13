
export default interface Mensaje{
    id?:Number
    idChat?:Number
    tipo?:string //Mensaje normal o documento y en el front mostralo distinto
    titulo?:string
    rol?:string
    contenido?:string
    contenidoDoc?:string
    fechaCreacion?:Date
}