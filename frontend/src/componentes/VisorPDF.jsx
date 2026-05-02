import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import './VisorPDF.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export default function VisorPDF({ fuente, nombre, onCerrar }) {
  const [pdf, setPdf] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const canvasRef = useRef(null)
  const renderTaskRef = useRef(null)

  useEffect(() => {
    async function cargarPDF() {
      let src
      if (fuente instanceof File) {
        const buf = await fuente.arrayBuffer()
        src = { data: buf }
      } else {
        src = fuente
      }
      const doc = await pdfjsLib.getDocument(src).promise
      setPdf(doc)
      setTotalPaginas(doc.numPages)
      setPaginaActual(1)
    }
    cargarPDF()
  }, [fuente])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    async function renderPagina() {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
      const pagina = await pdf.getPage(paginaActual)
      const viewport = pagina.getViewport({ scale: 1.4 })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      renderTaskRef.current = pagina.render({ canvasContext: ctx, viewport })
      await renderTaskRef.current.promise.catch(() => {})
    }
    renderPagina()
  }, [pdf, paginaActual])

  return (
    <div className="visor_overlay" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="visor_modal">
        <div className="visor_header">
          <span className="visor_nombre">{nombre}</span>
          <div className="visor_nav">
            <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual <= 1}>&#8249;</button>
            <span>{paginaActual} / {totalPaginas}</span>
            <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual >= totalPaginas}>&#8250;</button>
          </div>
          <button className="visor_cerrar" onClick={onCerrar}>&#x2715;</button>
        </div>
        <div className="visor_contenido">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
