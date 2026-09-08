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
Para preguntas sobre documentos ya adjuntados antes en esta conversación, recibirás los fragmentos más relevantes bajo "Fragmentos relevantes de documentos adjuntados anteriormente" en vez del documento completo. Básate solo en esos fragmentos para responder, y si no contienen la respuesta dilo honestamente en vez de inventar información.
Da formato a tus respuestas en Markdown siempre que aporte claridad: usa ## y ### para encabezados, **negrita** para lo importante, listas con - o 1. cuando enumeres cosas, y > para citar fragmentos del documento. No abuses del formato en respuestas de una frase.`

    private readonly HISTORIAL_MAX_MENSAJES = 12
    private readonly HISTORIAL_MAX_CHARS_POR_MENSAJE = 2000
    private readonly RAG_CHUNK_SIZE = 1000
    private readonly RAG_CHUNK_SOLAPE = 150
    private readonly RAG_TOP_K = 5
    // Extracto directo del documento cuando se acaba de adjuntar, para que la
    // primera respuesta (p.ej. un resumen) tenga cobertura completa. En
    // turnos posteriores usamos solo los fragmentos recuperados por RAG.
    private readonly RAG_EXTRACTO_MAX_CHARS = 6000

    private dividirEnFragmentos(texto: string): string[] {
        const fragmentos: string[] = []
        let inicio = 0
        while (inicio < texto.length) {
            const fin = Math.min(inicio + this.RAG_CHUNK_SIZE, texto.length)
            fragmentos.push(texto.slice(inicio, fin))
            if (fin === texto.length) break
            inicio = fin - this.RAG_CHUNK_SOLAPE
        }
        return fragmentos
    }

    private async ingestarDocumento(idChat: Number, idMensaje: Number | undefined, nombreDoc: string | undefined, texto: string): Promise<void> {
        const fragmentosTexto = this.dividirEnFragmentos(texto)
        if (fragmentosTexto.length === 0) return
        const embeddings = await this.iaController.embed(fragmentosTexto)
        if (embeddings.length !== fragmentosTexto.length) return
        const fragmentos = fragmentosTexto.map((contenido, i) => ({ contenido, embedding: embeddings[i] }))
        await this.iaRepository.guardarFragmentos(idChat, idMensaje, nombreDoc, fragmentos)
    }

    private async recuperarContexto(idChat: Number, consulta: string): Promise<string> {
        try {
            const [embeddingConsulta] = await this.iaController.embed([consulta])
            if (!embeddingConsulta) return ''
            const fragmentos = await this.iaRepository.buscarFragmentosRelevantes(idChat, embeddingConsulta, this.RAG_TOP_K)
            if (fragmentos.length === 0) return ''
            const bloques = fragmentos.map((f, i) => `[Fragmento ${i + 1}${f.nombreDoc ? ` - ${f.nombreDoc}` : ''}]\n${f.contenido}`)
            return `Fragmentos relevantes de documentos adjuntados anteriormente en esta conversación:\n\n${bloques.join('\n\n')}`
        } catch {
            return ''
        }
    }

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

    async getRespuesta(prompt: string, mensajeVisible: string, tipoSub: string, idUsuario: Number, idChat?: Number, urlPDF?: string, documentoTexto?: string, nombreDoc?: string, onChunk?: (texto: string) => void): Promise<Mensaje> {
        const historial = idChat != null ? await this.construirHistorial(idChat) : []
        const tipoDoc = documentoTexto ? await this.clasificarDocumento(documentoTexto) : undefined

        let esPrimerMensaje = false
        let idMensajeUsuario: Number | undefined
        if (idChat != null) {
            const total = await this.iaRepository.contarMensajes(idChat)
            esPrimerMensaje = total === 0
            idMensajeUsuario = await this.iaRepository.guardarMensajeUsuario(mensajeVisible || prompt, idChat)
            if (urlPDF) {
                await this.iaRepository.guardarDocumentoRespuesta(idMensajeUsuario, urlPDF, tipoDoc)
            }
        }

        // RAG: un documento recién adjuntado se indexa (fragmentos + embeddings)
        // para poder recuperarlo en preguntas futuras de este chat, y además se
        // incluye un extracto directo para que esta primera respuesta tenga
        // cobertura completa. Sin documento nuevo, se recuperan solo los
        // fragmentos relevantes para la pregunta actual.
        let contextoDocumento = ''
        if (documentoTexto && idChat != null) {
            this.ingestarDocumento(idChat, idMensajeUsuario, nombreDoc, documentoTexto).catch(err =>
                console.error("Error indexando documento para RAG:", err)
            )
            contextoDocumento = documentoTexto.slice(0, this.RAG_EXTRACTO_MAX_CHARS)
        } else if (idChat != null) {
            contextoDocumento = await this.recuperarContexto(idChat, mensajeVisible || prompt)
        }
        const promptFinal = contextoDocumento ? `${contextoDocumento}\n\n---\n\nPregunta del usuario: ${prompt}` : prompt

        const esGeneracionDoc = /\bhaz(me)?\b|hacer\s+un|genera(r|me)?|crea(r|me|do)?|escrib(e|ir|eme)|redact(a|ar)|expand|ampl[íi]|reescrib|nuevo\s+doc|doc\s+nuevo|\bdoc(umento)?\b.*\b(sobre|acerca|de)\b/i.test(mensajeVisible || prompt)

        const mensajesChat = [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...historial,
            { role: 'user', content: promptFinal }
        ]
        const respuesta = await this.iaController.chat(mensajesChat, { num_thread: 8, num_ctx: 8192 }, onChunk)

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
            const titulo = await this.generarTitulo(prompt).catch(() => null)
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
