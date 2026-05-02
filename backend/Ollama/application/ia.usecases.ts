import IaReposiroty from "../domain/ia.repository";
import Mensaje from "../domain/Mensaje";
import IaController from "../infrastructure/rest/ia.controller"

export default class IaUseCases {

    constructor(private iaRepository: IaReposiroty, private iaController: IaController) {}

    private readonly SYSTEM_PROMPT = `Eres IADocuments, un asistente de IA especializado en análisis y procesamiento de documentos.
Ayudas a los usuarios a comprender, resumir y extraer información de documentos PDF y ODT.
Responde siempre en el mismo idioma que el usuario.
Cuando el usuario adjunte documentos (indicados con [Documento: nombre]), analízalos en detalle y proporciona respuestas precisas basadas en su contenido.`

    private detectarTipoDoc(texto: string): string {
        const t = texto.toLowerCase()
        const contar = (terms: string[]) => terms.filter(w => t.includes(w)).length
        const scores: Record<string, number> = {
            médico:    contar(['diagnóstico','paciente','clínico','médico','hospital','enfermedad','síntoma','dosis','cirugía','fármaco','receta','anamnesis','patología','historia clínica']),
            legal:     contar(['contrato','cláusula','tribunal','demanda','sentencia','juzgado','jurídico','firmante','notario','legislación','decreto','parte contratante']),
            educativo: contar(['alumno','profesor','asignatura','examen','universidad','escuela','tesis','aprendizaje','currículo','matrícula','académico','docente','calificación','expediente']),
        }
        const max = Math.max(...Object.values(scores))
        if (max < 2) return 'general'
        return Object.keys(scores).find(k => scores[k] === max) || 'general'
    }

    async getRespuesta(prompt: string, mensajeVisible: string, tipoSub: string, idUsuario: Number, idChat?: Number): Promise<Mensaje> {
        const json = {
            model: "llama3.2:1b",
            system: this.SYSTEM_PROMPT,
            prompt: prompt,
            stream: false
        }

        let esPrimerMensaje = false
        if (idChat != null) {
            const total = await this.iaRepository.contarMensajes(idChat)
            esPrimerMensaje = total === 0
            await this.iaRepository.guardarMensajeUsuario(mensajeVisible || prompt, idChat)
        }

        const esGeneracionDoc = /\bhaz(me)?\b|hacer\s+un|genera(r|me)?|crea(r|me|do)?|escrib(e|ir|eme)|redact(a|ar)|expand|ampl[íi]|reescrib|nuevo\s+doc|doc\s+nuevo|\bdoc(umento)?\b.*\b(sobre|acerca|de)\b/i.test(mensajeVisible || prompt)
        const tipoDoc = prompt.includes('[Documento:') ? this.detectarTipoDoc(prompt) : undefined

        const respuesta = await this.iaController.generate(json)

        if (!respuesta) {
            return { contenido: "Error al contactar con Ollama" }
        }

        let mensaje: Mensaje = {
            idChat: idChat,
            tipo: "normal",
            rol: "ia",
            contenido: respuesta.response,
            fechaCreacion: respuesta.created_at,
            tipoDoc
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
            const docInsert = respuesta.response.substring(respuesta.response.indexOf("//*") + 3, respuesta.response.indexOf("*//"))
            mensaje = { tipo: "documento", contenido: respuesta.response.substring(respuesta.response.indexOf("*//") + 3).trim() || "Documento generado.", contenidoDoc: docInsert, tipoDoc }
        } else if (esGeneracionDoc) {
            mensaje = { tipo: "documento", contenido: "Documento generado.", contenidoDoc: respuesta.response, tipoDoc }
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
            model: "llama3.2:1b",
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

    async getDocumentos(idUsuario: Number): Promise<any[]> {
        return this.iaRepository.getDocumentos(idUsuario)
    }
}
