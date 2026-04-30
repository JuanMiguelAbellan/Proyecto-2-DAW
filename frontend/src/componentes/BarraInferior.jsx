import { useState, useRef } from 'react'
import { post } from '../servicios/peticiones'
import './BarraInferior.css'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href

const MAX_FILE_MB = 20

export default function BarraInferior({ chatActivo, setMensajes, onTituloGenerado, setEsperando, onNuevoChat, archivos, setArchivos }) {
  const [texto, setTexto] = useState('')
  const [errorArchivo, setErrorArchivo] = useState(null)
  const inputFileRef = useRef(null)

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

  async function leerArchivos(files) {
    const contenidos = await Promise.all(
      files.map(f => new Promise(async (resolve) => {
        try {
          if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
            const arrayBuffer = await f.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            let texto = ''
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i)
              const content = await page.getTextContent()
              texto += content.items.map(item => item.str).join(' ') + '\n'
            }
            resolve(`[Documento: ${f.name}]\n${texto.trim()}`)
          } else {
            const reader = new FileReader()
            reader.onload = (ev) => {
              const texto = ev.target.result.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
              resolve(`[Documento: ${f.name}]\n${texto}`)
            }
            reader.onerror = () => resolve(`[Documento: ${f.name} - error al leer]`)
            reader.readAsText(f)
          }
        } catch(e) {
          resolve(`[Documento: ${f.name} - error al leer]`)
        }
      }))
    )
    return contenidos.join('\n\n')
  }

  async function enviar() {
    if (!texto.trim() && archivos.length === 0) return

    const textoActual = texto
    const mensajeVisible = textoActual || '📄 Documento adjunto'
    const archivosCopy = [...archivos]

    setTexto('')
    setArchivos([])

    if (!chatActivo) {
      post('api/ia/nuevo', {},
        async (data) => {
          const nuevoChat = data.chat
          onNuevoChat(nuevoChat)
          setMensajes([{ rol: 'usuario', contenido: mensajeVisible }])
          setEsperando(true)
          const contenidoArchivos = archivosCopy.length > 0 ? await leerArchivos(archivosCopy) : ''
          const promptCompleto = contenidoArchivos ? `${textoActual}\n\n${contenidoArchivos}` : textoActual
          post('api/ia/generate', { prompt: promptCompleto, tipo: 'free', idChat: nuevoChat.id_chat },
            (respuesta) => {
              setEsperando(false)
              setMensajes((prev) => [...prev, { rol: 'ia', contenido: respuesta.contenido }])
              if (respuesta.titulo) onTituloGenerado(nuevoChat.id_chat, respuesta.titulo)
            },
            (error) => { setEsperando(false); console.error('Error:', error) }
          )
        },
        (error) => console.error('Error creando chat:', error)
      )
    } else {
      setMensajes((prev) => [...prev, { rol: 'usuario', contenido: mensajeVisible }])
      setEsperando(true)
      const contenidoArchivos = archivosCopy.length > 0 ? await leerArchivos(archivosCopy) : ''
      const promptCompleto = contenidoArchivos ? `${textoActual}\n\n${contenidoArchivos}` : textoActual
      post('api/ia/generate', { prompt: promptCompleto, tipo: 'free', idChat: chatActivo.id_chat },
        (respuesta) => {
          setEsperando(false)
          setMensajes((prev) => [...prev, { rol: 'ia', contenido: respuesta.contenido }])
          if (respuesta.titulo) onTituloGenerado(chatActivo.id_chat, respuesta.titulo)
        },
        (error) => { setEsperando(false); console.error('Error:', error) }
      )
    }
  }

  return (
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
          <img src="./public/images/adjuntar.svg" alt="Adjuntar" />
        </button>
        <input
          type="text"
          className="input_text"
          placeholder="Escribe un mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
        />
        <button className="enviar" onClick={enviar}>
          <img src="./public/images/enviar.svg" alt="Enviar" />
        </button>
        <img className="microfono" src="./public/images/microfono-circular-apagado.svg" alt="Micrófono" />
      </div>
    </div>
  )
}
