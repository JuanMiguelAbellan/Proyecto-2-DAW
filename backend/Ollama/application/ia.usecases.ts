import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaController from "../infrastructure/rest/ia.controller"

export default class IaUseCases {

    constructor(private iaRepository: IaReposiroty, private iaController: IaController) {}

    private readonly SYSTEM_PROMPT = `Eres IADocuments, un asistente de IA especializado en análisis y procesamiento de documentos, con un estilo cercano y profesional a la vez.
Ayudas a los usuarios a comprender, resumir y extraer información de documentos PDF y ODT.
Responde siempre en el mismo idioma que el usuario.
Cuando el usuario adjunte documentos (indicados con [Documento: nombre]), analízalos en detalle y proporciona respuestas precisas basadas en su contenido.
Tienes memoria de toda la conversación: si el usuario se refiere a un documento o mensaje anterior, revisa el historial antes de decir que no tienes esa información.
Da formato a tus respuestas en Markdown siempre que aporte claridad: usa ## y ### para encabezados, **negrita** para lo importante, listas con - o 1. cuando enumeres cosas, y > para citar fragmentos del documento. No abuses del formato en respuestas de una frase.`

    private readonly HISTORIAL_MAX_MENSAJES = 12
    private readonly HISTORIAL_MAX_CHARS_POR_MENSAJE = 2000

    private async clasificarDocumento(textoDocumento: string): Promise<string> {
        const CATEGORIAS = ['médico', 'legal', 'educativo', 'general']
        const extracto = textoDocumento.slice(0, 1500)
        const json = {
            model: "qwen2.5:3b",
            prompt: `Clasifica el siguiente documento en UNA sola palabra de esta lista: médico, legal, educativo, general.\n\nDocumento:\n${extracto}\n\nResponde ÚNICAMENTE con la palabra de la categoría, sin nada más.`,
            stream: false,
            options: { num_thread: 8 }
        }
        try {
            const respuesta = await this.iaController.generate(json)
            const texto = (respuesta?.response || '').toLowerCase()
            return CATEGORIAS.find(c => texto.includes(c)) || 'general'
        } catch {
            return 'general'
        }
    }

    private async construirHistorial(idChat: Number): Promise<{ role: string, content: string }[]> {
        const mensajesPrevios = await this.iaRepository.getMensajes(idChat)
        const recientes = mensajesPrevios.slice(-this.HISTORIAL_MAX_MENSAJES)
        return recientes.map(m => {
            const contenido = (m.contenidoDoc || m.contenido || '').slice(0, this.HISTORIAL_MAX_CHARS_POR_MENSAJE)
            return { role: m.rol === 'usuario' ? 'user' : 'assistant', content: contenido }
        })
    }

    async getRespuesta(prompt: string, mensajeVisible: string, tipoSub: string, idUsuario: Number, idChat?: Number, urlPDF?: string): Promise<Mensaje> {
        const historial = idChat != null ? await this.construirHistorial(idChat) : []
        const tipoDoc = prompt.includes('[Documento:') ? await this.clasificarDocumento(prompt) : undefined

        let esPrimerMensaje = false
        if (idChat != null) {
            const total = await this.iaRepository.contarMensajes(idChat)
            esPrimerMensaje = total === 0
            const idMensajeUsuario = await this.iaRepository.guardarMensajeUsuario(mensajeVisible || prompt, idChat)
            if (urlPDF) {
                await this.iaRepository.guardarDocumentoRespuesta(idMensajeUsuario, urlPDF, tipoDoc)
            }
        }

        const esGeneracionDoc = /\bhaz(me)?\b|hacer\s+un|genera(r|me)?|crea(r|me|do)?|escrib(e|ir|eme)|redact(a|ar)|expand|ampl[íi]|reescrib|nuevo\s+doc|doc\s+nuevo|\bdoc(umento)?\b.*\b(sobre|acerca|de)\b/i.test(mensajeVisible || prompt)

        const mensajesChat = [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...historial,
            { role: 'user', content: prompt }
        ]
        const respuesta = await this.iaController.chat(mensajesChat)

        if (!respuesta || !respuesta.message) {
            return { contenido: "Error al contactar con Ollama" }
        }
        const textoRespuesta: string = respuesta.message.content

        let mensaje: Mensaje = {
            idChat: idChat,
            tipo: "normal",
            rol: "ia",
            contenido: textoRespuesta,
            fechaCreacion: respuesta.created_at,
            tipoDoc
        }

        if (textoRespuesta.includes("[{")) {
            const preferencia = textoRespuesta.substring(textoRespuesta.indexOf("[{"), textoRespuesta.indexOf("}]"))
            this.addPreferencia(preferencia, idUsuario)
            mensaje = { contenido: textoRespuesta.substring(textoRespuesta.indexOf("}]") + 2) }
        } else if (textoRespuesta.includes("[[{{")) {
            const preferencias = textoRespuesta.substring(textoRespuesta.indexOf("[[{{"), textoRespuesta.indexOf("}}]]"))
            this.editPreferencia(preferencias, idUsuario)
            mensaje = { contenido: textoRespuesta.substring(textoRespuesta.indexOf("}}]]") + 4) }
        } else if (textoRespuesta.includes("//*")) {
            const docInsert = textoRespuesta.substring(textoRespuesta.indexOf("//*") + 3, textoRespuesta.indexOf("*//"))
            mensaje = { tipo: "documento", contenido: textoRespuesta.substring(textoRespuesta.indexOf("*//") + 3).trim() || "Documento generado.", contenidoDoc: docInsert, tipoDoc }
        } else if (esGeneracionDoc) {
            mensaje = { tipo: "documento", contenido: "Documento generado.", contenidoDoc: textoRespuesta, tipoDoc }
        }

        const idMensaje = await this.iaRepository.guardarRespuesta(mensaje, idChat, idUsuario)

        if (mensaje.tipo === 'documento') {
            const key = await this.iaController.guardarDocS3(mensaje, mensaje.titulo || String(idMensaje)).catch(() => '')
            await this.iaRepository.guardarDocumentoRespuesta(idMensaje, key || '', mensaje.tipoDoc)
        }

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
            model: "qwen2.5:3b",
            prompt: `Genera un título muy corto (máximo 4 palabras) para una conversación que empieza con: "${prompt}". Responde ÚNICAMENTE el título, sin comillas ni puntos.`,
            stream: false,
            options: { num_thread: 8 }
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

    async getDocumentos(idUsuario: Number): Promise<any[]> {
        return this.iaRepository.getDocumentos(idUsuario)
    }

    async subirPDF(buffer: Buffer, nombreOriginal: string): Promise<string> {
        return this.iaController.subirPDF(buffer, nombreOriginal)
    }

    async guardarPDFAnotado(idMensaje: Number, idUsuario: Number, buffer: Buffer, nombreOriginal: string): Promise<string | null> {
        const esPropietario = await this.iaRepository.esPropietarioMensaje(idMensaje, idUsuario)
        if (!esPropietario) return null
        const url = await this.iaController.subirPDF(buffer, nombreOriginal)
        await this.iaRepository.actualizarDocumento(idMensaje, url)
        return url
    }
}
