import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaRepositoryPostgres from "../infrastructure/db/ia.repository.Postgres";
import IaController from "../infrastructure/rest/ia.controller"



export default class IaUseCases{

    constructor(private iaRepository: IaReposiroty, private iaController: IaController){}

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
        const respuesta = (await this.iaController.generate(json));
        //console.log(respuesta);
        
        let mensaje:Mensaje={
            idChat:idChat,
            tipo:"normal",
            rol:"ia",
            contenido:respuesta.response,
            fechaCreacion:respuesta.created_at
        };
        if(respuesta.response.includes("[{")){
            const preferencia = respuesta.response.substring(respuesta.response.indexOf("[{"), respuesta.response.indexOf("}]"))
            this.addPreferencia(preferencia, idUsuario)
            const respuestaDevolver = respuesta.response.substring(respuesta.response.indexOf("}]")+2)
            mensaje={
                contenido:respuestaDevolver
            }
        }
        else if(respuesta.response.includes("[[{{")){
            const preferencias = respuesta.response.substring(respuesta.response.indexOf("[[{{"), respuesta.response.indexOf("}}]]"))
            this.editPreferencia(preferencias, idUsuario)
            const respuestaDevolver = respuesta.response.substring(respuesta.response.indexOf("}}]]")+4)
            mensaje={
                contenido:respuestaDevolver
            }
        }
        else if(respuesta.response.includes("//*")){
            const docInsert = respuesta.response.substring(respuesta.response.indexOf("//*"), respuesta.response.indexOf("*//"))
            const respuestaDevolver = respuesta.response.substring(respuesta.response.indexOf("*//")+3)
            let key = this.insertDocumento({tipo:"documento", contenidoDoc:docInsert})
            mensaje={
                tipo:"documento",
                contenido:respuestaDevolver,
                contenidoDoc:docInsert
            }
            this.iaRepository.guardarDocumentoRespuesta(mensaje, (await key))
        }
        this.iaRepository.guardarRespuesta(mensaje, idChat, idUsuario)
        return mensaje;
    }
    addPreferencia(preferencia: String, id:Number): Promise<String> {
        return this.iaRepository.addPreferencia(preferencia, id)
    }
    editPreferencia(preferencais: String, id:Number): Promise<String> {
        return this.iaRepository.editPreferencia(preferencais, id)
    }

    async insertDocumento(documento:Mensaje):Promise<String>{
        //Esto creo que deberia ir en el usuario Comprobar cuantos documento lleva este mes y si se ha pasado del limite
        
        let key = this.iaController.guardarDocS3(documento, documento.titulo).then((e)=>{return e})
        this.iaRepository.guardarDocumentoRespuesta(documento, (await key) )
        return key
    }
}