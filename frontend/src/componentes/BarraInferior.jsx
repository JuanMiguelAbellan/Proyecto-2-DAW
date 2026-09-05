import { useState, useRef, useEffect } from 'react'
import { post, buildUrl } from '../servicios/peticiones'
import './BarraInferior.css'
import './ChatPrincipal.css'

const MAX_FILE_MB = 20

export default function BarraInferior({ chatActivo, setMensajes, onTituloGenerado, setEsperando, onNuevoChat, archivos, setArchivos }) {
  const [texto, setTexto] = useState('')
  const [errorArchivo, setErrorArchivo] = useState(null)
  const [previstaDoc, setPrevistaDoc] = useState(null)
  const [comentarioPopup, setComentarioPopup] = useState(null)
  const [textoComentario, setTextoComentario] = useState('')
  const inputFileRef = useRef(null)
  const previewEditorRef = useRef(null)
  const prevAbierto = useRef(false)
  const rangoGuardado = useRef(null)

  useEffect(() => {
    if (previstaDoc && !prevAbierto.current && previewEditorRef.current) {
      previewEditorRef.current.innerHTML = (previstaDoc.contenidoArchivos || '').replace(/\n/g, '<br>')
      prevAbierto.current = true
    }
    if (!previstaDoc) prevAbierto.current = false
  }, [previstaDoc])

  function formatear(cmd) {
    previewEditorRef.current?.focus()
    document.execCommand(cmd, false)
  }

  function abrirComentario(e) {
    e.preventDefault()
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !previewEditorRef.current?.contains(sel.anchorNode)) return
    rangoGuardado.current = sel.getRangeAt(0).cloneRange()
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    setComentarioPopup({ x: Math.min(rect.left, window.innerWidth - 280), y: rect.bottom + 8 })
    setTextoComentario('')
  }

  function confirmarComentario() {
    if (!rangoGuardado.current || !textoComentario.trim()) { setComentarioPopup(null); return }
    const span = document.createElement('span')
    span.className = 'comentario_marca'
    span.setAttribute('data-comment', textoComentario)
    try {
      rangoGuardado.current.surroundContents(span)
    } catch {
      const frag = rangoGuardado.current.extractContents()
      span.appendChild(frag)
      rangoGuardado.current.insertNode(span)
    }
    rangoGuardado.current = null
    setComentarioPopup(null)
    setTextoComentario('')
  }

  function mostrarErrorArchivo(msg) {
    setErrorArchivo(msg)
    setTimeout(() => setErrorArchivo(null), 4000)
  }

  function handleArchivoSeleccionado(e) {
    const validos = []
    const rechazados = []
    Array.from(e.target.files).forEach(f => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) rechazados.push(f.name)
      else validos.push(f)
    })
    if (rechazados.length > 0) mostrarErrorArchivo(`"${rechazados.join('", "')}" supera el límite de ${MAX_FILE_MB}MB`)
    if (validos.length > 0) setArchivos(prev => [...prev, ...validos])
    e.target.value = ''
  }

  async function leerArchivo(f) {
    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      try {
        const formData = new FormData()
        formData.append('file', f)
        const res = await fetch(buildUrl('api/ia/extractText'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          const texto = (data.texto || '').trim()
          if (texto) return `[Documento: ${f.name}]\n${texto}`
        }
      } catch (e) {
        console.error('Error extrayendo PDF:', e)
      }
      return `[Documento: ${f.name} - no se pudo extraer el texto]`
    } else {
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const texto = ev.target.result.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          resolve(`[Documento: ${f.name}]\n${texto}`)
        }
        reader.onerror = () => resolve(`[Documento: ${f.name} - error al leer]`)
        reader.readAsText(f)
      })
    }
  }

  async function leerArchivos(files) {
    const contenidos = await Promise.all(files.map(f => leerArchivo(f)))
    return contenidos.join('\n\n')
  }

  async function subirPDFAlServidor(f) {
    try {
      const formData = new FormData()
      formData.append('file', f)
      const res = await fetch(buildUrl('api/ia/subirPDF'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        return data.url || null
      }
    } catch (e) {
      console.error('Error subiendo PDF:', e)
    }
    return null
  }

  function detectarTipoDoc(texto) {
    const t = texto.toLowerCase()
    const contar = (terms) => terms.filter(w => t.includes(w)).length
    const scores = {
      médico:    contar(['diagnóstico','paciente','clínico','médico','hospital','enfermedad','síntoma','dosis','cirugía','fármaco','receta','anamnesis','patología','consulta médica','historia clínica']),
      legal:     contar(['contrato','cláusula','tribunal','demanda','sentencia','juzgado','jurídico','firmante','notario','legislación','decreto','artículo de ley','parte contratante']),
      educativo: contar(['alumno','profesor','asignatura','examen','universidad','escuela','tesis','aprendizaje','currículo','matrícula','académico','docente','calificación','expediente']),
    }
    const max = Math.max(...Object.values(scores))
    if (max < 2) return 'general'
    return Object.keys(scores).find(k => scores[k] === max)
  }

  function wsUrl() {
    const base = buildUrl('ws/chat')
    return base.replace(/^http/, 'ws') + `${base.includes('?') ? '&' : '?'}token=${localStorage.getItem('token')}`
  }

  function enviarStreaming(idChat, prompt, mensajeVisible, urlPDF, onTitulo) {
    let recibioAlgo = false
    const ws = new WebSocket(wsUrl())

    ws.onopen = () => {
      ws.send(JSON.stringify({ prompt, mensajeVisible, tipo: 'free', idChat, urlPDF }))
    }

    ws.onmessage = (event) => {
      const datos = JSON.parse(event.data)
      if (datos.type === 'chunk') {
        if (!recibioAlgo) {
          recibioAlgo = true
          setEsperando(false)
          setMensajes((prev) => [...prev, { rol: 'ia', contenido: datos.content, tipo: 'normal' }])
          return
        }
        setMensajes((prev) => {
          const copia = [...prev]
          const ultimo = copia[copia.length - 1]
          copia[copia.length - 1] = { ...ultimo, contenido: (ultimo.contenido || '') + datos.content }
          return copia
        })
      } else if (datos.type === 'done') {
        setEsperando(false)
        const mensajeFinal = { rol: 'ia', contenido: datos.mensaje.contenido, tipo: datos.mensaje.tipo, contenidoDoc: datos.mensaje.contenidoDoc, tipoDoc: datos.mensaje.tipoDoc }
        setMensajes((prev) => {
          if (!recibioAlgo) return [...prev, mensajeFinal]
          const copia = [...prev]
          copia[copia.length - 1] = mensajeFinal
          return copia
        })
        if (datos.mensaje.titulo) onTitulo(datos.mensaje.titulo)
        ws.close()
      } else if (datos.type === 'error') {
        setEsperando(false)
        console.error('Error del chat:', datos.message)
        ws.close()
      }
    }

    ws.onerror = (e) => {
      setEsperando(false)
      console.error('Error de WebSocket:', e)
    }
  }

  function enviarConContenido(textoActual, contenidoArchivos, mensajeVisible, urlPDF = null, nombrePDF = null) {
    const promptCompleto = contenidoArchivos
      ? `${textoActual || 'Analiza el siguiente documento y haz un resumen:'}\n\n${contenidoArchivos}`
      : textoActual
    const tipoDoc = contenidoArchivos ? detectarTipoDoc(contenidoArchivos) : null
    const mensajeUsuario = { rol: 'usuario', contenido: mensajeVisible, contenidoDoc: contenidoArchivos || null, tipoDoc, urlPDF, nombrePDF }

    if (!chatActivo) {
      post('api/ia/nuevo', {},
        (data) => {
          const nuevoChat = data.chat
          onNuevoChat(nuevoChat)
          setMensajes([mensajeUsuario])
          setEsperando(true)
          enviarStreaming(nuevoChat.id_chat, promptCompleto, mensajeVisible, urlPDF, (titulo) => onTituloGenerado(nuevoChat.id_chat, titulo))
        },
        (error) => console.error('Error creando chat:', error)
      )
    } else {
      setMensajes((prev) => [...prev, mensajeUsuario])
      setEsperando(true)
      enviarStreaming(chatActivo.id_chat, promptCompleto, mensajeVisible, urlPDF, (titulo) => onTituloGenerado(chatActivo.id_chat, titulo))
    }
  }

  function extraerTextoConComentarios(el) {
    const comentarios = []

    el.querySelectorAll('.comentario_marca').forEach((span, i) => {
      comentarios.push({
        n: i + 1,
        texto: (span.textContent || '').trim(),
        nota: span.getAttribute('data-comment') || ''
      })
    })

    let textoBase = el.innerHTML
      .replace(/<span[^>]*class="comentario_marca"[^>]*data-comment="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi,
        (_, _nota, texto) => texto + ' [COMMENT_' + (comentarios.findIndex(c => c.texto === (texto || '').trim()) + 1) + ']')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')

    return { textoBase, comentarios }
  }

  function confirmarEnvio() {
    const { textoBase, comentarios } = previewEditorRef.current
      ? extraerTextoConComentarios(previewEditorRef.current)
      : { textoBase: previstaDoc.contenidoArchivos, comentarios: [] }

    let contenidoFinal = textoBase
    if (comentarios.length > 0) {
      const notasSeccion = '--- User comments ---\n' +
        comentarios.map(c => `COMMENT_${c.n} (on "${c.texto}"): ${c.nota}`).join('\n')
      contenidoFinal = notasSeccion + '\n\n' + textoBase
    }

    enviarConContenido(previstaDoc.textoActual, contenidoFinal, previstaDoc.mensajeVisible, previstaDoc.urlPDF, previstaDoc.nombrePDF)
    setPrevistaDoc(null)
  }

  async function enviar() {
    if (!texto.trim() && archivos.length === 0) return

    const textoActual = texto
    const archivosCopy = [...archivos]

    setTexto('')
    setArchivos([])

    if (archivosCopy.length > 0) {
      const contenidoArchivos = await leerArchivos(archivosCopy)
      const mensajeVisible = textoActual || '📄 Documento adjunto'
      const pdfFile = archivosCopy.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
      const urlPDF = pdfFile ? await subirPDFAlServidor(pdfFile) : null
      setPrevistaDoc({ contenidoArchivos, textoActual, mensajeVisible, urlPDF, nombrePDF: pdfFile?.name })
    } else {
      enviarConContenido(textoActual, '', textoActual)
    }
  }

  return (
    <>
      {previstaDoc && (
        <div className="preview_overlay" onClick={(e) => e.target === e.currentTarget && setPrevistaDoc(null)}>
          <div className="preview_modal">
            <div className="preview_header">
              <span>Revisar documento antes de enviar</span>
              <button className="preview_cerrar" onClick={() => setPrevistaDoc(null)}>✕</button>
            </div>
            <div className="preview_toolbar">
              <button onMouseDown={(e) => { e.preventDefault(); formatear('bold') }}><b>N</b></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('italic') }}><i>C</i></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('underline') }}><u>S</u></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('strikeThrough') }}><s>T</s></button>
              <span className="preview_toolbar_sep" />
              <button onMouseDown={(e) => { e.preventDefault(); formatear('insertOrderedList') }}>1.</button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('insertUnorderedList') }}>•</button>
              <span className="preview_toolbar_sep" />
              <button onMouseDown={abrirComentario} title="Añadir comentario al texto seleccionado">💬</button>
            </div>
            {comentarioPopup && (
              <div className="comentario_popup" style={{ left: comentarioPopup.x, top: comentarioPopup.y }}>
                <input
                  autoFocus
                  placeholder="Escribe un comentario..."
                  value={textoComentario}
                  onChange={(e) => setTextoComentario(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmarComentario()
                    if (e.key === 'Escape') setComentarioPopup(null)
                  }}
                />
                <button onClick={confirmarComentario}>✓</button>
                <button onClick={() => setComentarioPopup(null)}>✕</button>
              </div>
            )}
            <div
              ref={previewEditorRef}
              contentEditable
              suppressContentEditableWarning
              className="preview_editor"
            />
            <div className="preview_acciones">
              <button className="preview_btn_cancelar" onClick={() => setPrevistaDoc(null)}>Cancelar</button>
              <button className="preview_btn_enviar" onClick={confirmarEnvio}>
                Enviar &#x27A4;
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="barra_inferior_wrapper">
        {errorArchivo && <p className="barra_error_archivo">{errorArchivo}</p>}
        <div className="barra_inferior">
          <input
            type="file"
            accept=".pdf,.odt,.txt"
            ref={inputFileRef}
            style={{ display: 'none' }}
            multiple
            onChange={handleArchivoSeleccionado}
          />
          <button className="btn_adjuntar" onClick={() => inputFileRef.current.click()}>
            <img src="/images/adjuntar.svg" alt="Adjuntar" />
          </button>
          <input
            type="text"
            className="input_text"
            placeholder="Escribe un mensaje..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !previstaDoc && enviar()}
          />
          <button className="enviar" onClick={enviar}>
            <img src="/images/enviar.svg" alt="Enviar" />
          </button>
          <img className="microfono" src="/images/microfono-circular-apagado.svg" alt="Micrófono" />
        </div>
      </div>
    </>
  )
}
