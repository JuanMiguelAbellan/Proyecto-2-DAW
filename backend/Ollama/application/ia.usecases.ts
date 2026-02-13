import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaRepositoryPostgres from "../infrastructure/db/ia.repository.Postgres";
import IaController from "../infrastructure/rest/ia.controller"



export default class IaUseCases{

    constructor(private iaRepository: IaRepositoryPostgres, private iaController: IaController){}

    addPreferencia(preferencia: String, id:Number): Promise<String> {
        return this.iaRepository.addPreferencia(preferencia, id)
    }
    editPreferencia(preferencais: String, id:Number): Promise<String> {
        return this.iaRepository.editPreferencia(preferencais, id)
    }

    insertDocumento(documento:any){}

    async getRespuesta(prompt:string, tipoSub:string, idUsuario:Number, idChat:Number):Promise<Mensaje>{
        let json = {
            model: "gemma3:latest",
            prompt: prompt,
            stream: false
        };
        if(tipoSub == "free"){
            json.model="gemma3:latest"
        }
        else if(tipoSub == "pro"){
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
            this.insertDocumento(docInsert)
            mensaje={
                idChat:idChat,
                tipo:"documento",
                rol:"ia",
                contenido:textoDevolver,
                contenidoDoc:docInsert
            }
            this.iaRepository.guardarDocumentoRespuesta(mensaje, idChat, idUsuario)
        }
        return mensaje;
    }
}