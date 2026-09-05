import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFViewer, EventBus, PDFLinkService, GenericL10n } from 'pdfjs-dist/web/pdf_viewer.mjs'
import 'pdfjs-dist/web/pdf_viewer.css'
import { buildUrl } from '../servicios/peticiones'
import './VisorPDF.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const MODOS = [
  { id: 'ninguno', label: '🖱️ Navegar', valor: pdfjsLib.AnnotationEditorType.NONE },
  { id: 'resaltar', label: '🖍️ Resaltar', valor: pdfjsLib.AnnotationEditorType.HIGHLIGHT },
  { id: 'texto', label: '📝 Texto', valor: pdfjsLib.AnnotationEditorType.FREETEXT },
  { id: 'dibujo', label: '✏️ Dibujar', valor: pdfjsLib.AnnotationEditorType.INK },
  { id: 'comentario', label: '💬 Comentario', valor: pdfjsLib.AnnotationEditorType.COMMENT },
]

export default function VisorPDF({ fuente, nombre, idMensaje, onCerrar, onGuardado }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const pdfViewerRef = useRef(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [modoActivo, setModoActivo] = useState('ninguno')
  const [guardando, setGuardando] = useState(false)
  const [mensajeEstado, setMensajeEstado] = useState('')

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setCargando(true)
      setError(null)

      const eventBus = new EventBus()
      const linkService = new PDFLinkService({ eventBus })
      const pdfViewer = new PDFViewer({
        container: containerRef.current,
        viewer: viewerRef.current,
        eventBus,
        linkService,
        l10n: new GenericL10n('es'),
        annotationMode: pdfjsLib.AnnotationMode.ENABLE_STORAGE,
        annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
        imageResourcesPath: '/pdfjs-images/',
      })
      linkService.setViewer(pdfViewer)
      pdfViewerRef.current = pdfViewer

      eventBus.on('pagesinit', () => {
        if (!cancelado) pdfViewer.currentScaleValue = 'page-width'
      })

      try {
        let src
        if (fuente instanceof File) {
          const buf = await fuente.arrayBuffer()
          src = { data: buf }
        } else {
          src = { url: fuente }
        }
        const doc = await pdfjsLib.getDocument(src).promise
        if (cancelado) return
        linkService.setDocument(doc)
        pdfViewer.setDocument(doc)
        setCargando(false)
      } catch (e) {
        console.error('Error cargando PDF:', e)
        if (!cancelado) {
          setError('No se ha podido abrir este documento.')
          setCargando(false)
        }
      }
    }

    cargar()
    return () => {
      cancelado = true
      pdfViewerRef.current?.cleanup?.()
      pdfViewerRef.current = null
    }
  }, [fuente])

  function cambiarModo(modo) {
    setModoActivo(modo.id)
    if (pdfViewerRef.current) {
      pdfViewerRef.current.annotationEditorMode = { mode: modo.valor }
    }
  }

  async function obtenerPdfAnotado() {
    const pdfDoc = pdfViewerRef.current?.pdfDocument
    if (!pdfDoc) return null
    const bytes = await pdfDoc.saveDocument()
    return new Blob([bytes], { type: 'application/pdf' })
  }

  async function descargarAnotado() {
    const blob = await obtenerPdfAnotado()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre || 'documento.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function guardarEnServidor() {
    if (!idMensaje) return
    setGuardando(true)
    setMensajeEstado('')
    try {
      const blob = await obtenerPdfAnotado()
      if (!blob) throw new Error('Sin documento')
      const formData = new FormData()
      formData.append('file', blob, nombre || 'documento.pdf')
      const res = await fetch(buildUrl(`api/ia/guardarPDFAnotado/${idMensaje}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setMensajeEstado('Guardado ✓')
        if (onGuardado) onGuardado(data.url)
      } else {
        setMensajeEstado('Error al guardar')
      }
    } catch (e) {
      console.error('Error guardando PDF anotado:', e)
      setMensajeEstado('Error al guardar')
    } finally {
      setGuardando(false)
      setTimeout(() => setMensajeEstado(''), 3000)
    }
  }

  return (
    <div className="visor_overlay" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="visor_modal">
        <div className="visor_header">
          <span className="visor_nombre">{nombre}</span>
          <button className="visor_cerrar" onClick={onCerrar}>&#x2715;</button>
        </div>

        <div className="visor_toolbar">
          {MODOS.map(m => (
            <button
              key={m.id}
              className={`visor_modo ${modoActivo === m.id ? 'visor_modo_activo' : ''}`}
              onClick={() => cambiarModo(m)}
              disabled={cargando || !!error}
            >
              {m.label}
            </button>
          ))}
          <span className="visor_toolbar_sep" />
          <button onClick={descargarAnotado} disabled={cargando || !!error}>&#x2B07; Descargar</button>
          {idMensaje && (
            <button onClick={guardarEnServidor} disabled={guardando || cargando || !!error}>
              {guardando ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          )}
          {mensajeEstado && <span className="visor_estado">{mensajeEstado}</span>}
        </div>

        <div className="visor_contenido" ref={containerRef}>
          {cargando && !error && <p className="visor_cargando">Cargando PDF...</p>}
          {error && <p className="visor_cargando visor_error">{error}</p>}
          <div ref={viewerRef} className="pdfViewer" />
        </div>
      </div>
    </div>
  )
}
