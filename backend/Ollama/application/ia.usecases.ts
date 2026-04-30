import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaController from "../infrastructure/rest/ia.controller"

export default class IaUseCases {

    constructor(private iaRepository: IaReposiroty, private iaController: IaController) {}

    private readonly SYSTEM_PROMPT = `Eres IADocuments, un asistente de IA especializado en análisis y procesamiento de documentos.
Ayudas a los usuarios a comprender, resumir y extraer información de documentos PDF y ODT.
Responde siempre en el mismo idioma que el usuario.
Cuando el usuario adjunte documentos (indicados con [Documento: nombre]), analízalos en detalle y proporciona respuestas precisas basadas en su contenido.`

    async getRespuesta(prompt: string, tipoSub: string, idUsuario: Number, idChat?: Number): Promise<Mensaje> {
        const json = {
            model: "gemma3:latest",
            system: this.SYSTEM_PROMPT,
            prompt: prompt,
            stream: false
        }

        let esPrimerMensaje = false
        if (idChat != null) {
            const total = await this.iaRepository.contarMensajes(idChat)
            esPrimerMensaje = total === 0
            await this.iaRepository.guardarMensajeUsuario(prompt, idChat)
        }

        const respuesta = await this.iaController.generate(json)

        if (!respuesta) {
            return { contenido: "Error al contactar con Ollama" }
        }

        let mensaje: Mensaje = {
            idChat: idChat,
            tipo: "normal",
            rol: "ia",
            contenido: respuesta.response,
            fechaCreacion: respuesta.created_at
        }

        if (respuesta.response.includes("[{")) {
            const preferencia = respuesta.response.substring(respuesta.response.indexOf("[{"), respuesta.response.indexOf("}]"))
            this.addPreferencia(preferencia, idUsuario)
            mensaje = { contenido: respuesta.response.substring(respuesta.response.indexOf("}]") + 2) }
        } else if (respuesta.response.includes("[[{{")) {
            const preferencias = respuesta.response.substring(respuesta.response.indexOf("[[{{"), respuesta.response.indexOf("}}]]"))
            this.editPreferencia(preferencias, idUsuario)
            mensaje = { contenido: respuesta.response.substring(respuesta.response.indexOf("}}]]") + 4) }
        } else if (respuesta.response.includes("//*")) {
            const docInsert = respuesta.response.substring(respuesta.response.indexOf("//*"), respuesta.response.indexOf("*//"))
            const key = this.insertDocumento({ tipo: "documento", contenidoDoc: docInsert })
            mensaje = { tipo: "documento", contenido: respuesta.response.substring(respuesta.response.indexOf("*//") + 3), contenidoDoc: docInsert }
            this.iaRepository.guardarDocumentoRespuesta(mensaje, (await key))
        }

        this.iaRepository.guardarRespuesta(mensaje, idChat, idUsuario)

        if (esPrimerMensaje && idChat != null) {
            const titulo = await this.generarTitulo(prompt)
            if (titulo) {
                await this.iaRepository.actualizarTituloChat(idChat, titulo)
                mensaje.titulo = titulo
            }
        }

        return mensaje
    }

    private async generarTitulo(prompt: string): Promise<string | null> {
        const json = {
            model: "gemma3:latest",
            prompt: `Genera un título muy corto (máximo 4 palabras) para una conversación que empieza con: "${prompt}". Responde ÚNICAMENTE el título, sin comillas ni puntos.`,
            stream: false
        }
        const respuesta = await this.iaController.generate(json)
        if (!respuesta) return null
        return respuesta.response.trim().substring(0, 50)
    }

    async getMensajes(idChat: Number): Promise<Mensaje[]> {
        return this.iaRepository.getMensajes(idChat)
    }

    async nuevoChat(idUsuario: Number): Promise<Number> {
        return this.iaRepository.crearChat(idUsuario)
    }

    addPreferencia(preferencia: String, id: Number): Promise<String> {
        return this.iaRepository.addPreferencia(preferencia, id)
    }

    editPreferencia(preferencias: String, id: Number): Promise<String> {
        return this.iaRepository.editPreferencia(preferencias, id)
    }

    async eliminarChat(idChat: Number): Promise<void> {
        return this.iaRepository.eliminarChat(idChat)
    }

    async insertDocumento(documento: Mensaje): Promise<String> {
        const key = this.iaController.guardarDocS3(documento, documento.titulo).then((e) => e)
        this.iaRepository.guardarDocumentoRespuesta(documento, (await key))
        return key
    }
}
