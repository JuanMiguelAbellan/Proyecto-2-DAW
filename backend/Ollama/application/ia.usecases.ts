import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaRepositoryPostgres from "../infrastructure/db/ia.repository.Postgres";
import IaController from "../infrastructure/rest/ia.controller"



export default class IaUseCases{

    constructor(private iaRepository: IaRepositoryPostgres, private iaController: IaController){}

    async getRespuesta(prompt:string, tipoSub:string, idUsuario:Number, idChat?:Number):Promise<Mensaje>{
        let json = {
            model: "gemma3:latest",
            prompt: prompt,
            stream: false
        };
        let cantidad = 5

        if(tipoSub == "free"){
            json.model="gemma3:latest"
            cantidad=5
        }
        else if(tipoSub == "pro"){
            cantidad=50
            json.model="gemma3:latest" //Poner un modelo mejor
        }
        const texto = await this.iaController.generate(json);
        let mensaje:Mensaje={};
        if(texto.includes("[{")){
            const preferencia = texto.substring(texto.indexOf("[{"), texto.indexOf("}]"))
            this.addPreferencia(preferencia, idUsuario)
            const textoDevolver = texto.substring(texto.indexOf("}]"))
            mensaje={
                idChat:idChat,
                tipo:"texto",
                rol:"ia",
                contenido:textoDevolver
            }
            this.iaRepository.guardarRespuesta(mensaje, idChat, idUsuario)
        }
        else if(texto.includes("[[{{")){
            const preferencias = texto.substring(texto.indexOf("[[{{"), texto.indexOf("}}]]"))
            this.editPreferencia(preferencias, idUsuario)
            const textoDevolver = texto.substring(texto.indexOf("}}]]"))
            mensaje={
                idChat:idChat,
                tipo:"texto",
                rol:"ia",
                contenido:textoDevolver
            }
            this.iaRepository.guardarRespuesta(mensaje, idChat, idUsuario)
        }
        else if(texto.includes("//*")){
            const docInsert = texto.substring(texto.indexOf("//*"), texto.indexOf("*//"))
            const textoDevolver = texto.substring(texto.indexOf("*//"))
            let key = this.insertDocumento({tipo:"documento", contenidoDoc:docInsert}, cantidad, idUsuario)
            mensaje={
                idChat:idChat,
                tipo:"documento",
                rol:"ia",
                contenido:textoDevolver,
                contenidoDoc:docInsert
            }
            this.iaRepository.guardarDocumentoRespuesta(mensaje, (await key) ,idChat, idUsuario)
        }
        return mensaje;
    }
    addPreferencia(preferencia: String, id:Number): Promise<String> {
        return this.iaRepository.addPreferencia(preferencia, id)
    }
    editPreferencia(preferencais: String, id:Number): Promise<String> {
        return this.iaRepository.editPreferencia(preferencais, id)
    }

    async insertDocumento(documento:Mensaje, cantidad:Number, idUsuario:Number):Promise<String>{
        //Esto creo que deberia ir en el usuario Comprobar cuantos documento lleva este mes y si se ha pasado del limite
        const count = await this.iaRepository.contarDocumentosMesActual(idUsuario)
        if(count >= cantidad){
            throw new Error("Se ha superado el límite de documentos por mes")
        }
        let key = this.iaController.guardarDocS3(documento).then((e)=>{return e})
        this.iaRepository.guardarDocumentoRespuesta(documento, (await key) )
        return key
    }
}