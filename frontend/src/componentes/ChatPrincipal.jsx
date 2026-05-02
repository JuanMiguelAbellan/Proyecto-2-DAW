import { useState, useRef, useEffect } from 'react'
import './ChatPrincipal.css'

function useEditorComentarios(editorRef) {
  const [comentarioPopup, setComentarioPopup] = useState(null)
  const [textoComentario, setTextoComentario] = useState('')
  const rangoGuardado = useRef(null)

  function formatear(cmd) {
    editorRef.current?.focus()
    document.execCommand(cmd, false)
  }

  function abrirComentario(e) {
    e.preventDefault()
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) return
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

  return { formatear, abrirComentario, confirmarComentario, comentarioPopup, setComentarioPopup, textoComentario, setTextoComentario }
}

function descargarPDF(html, nombre) {
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${nombre}</title>
<style>
  body{font-family:Georgia,serif;padding:3rem;max-width:780px;margin:auto;line-height:1.7;color:#1a1a1a}
  .comentario_marca{background:rgba(255,213,0,.35);border-bottom:2px solid #e6b800}
  @media print{body{padding:1rem}}
</style>
</head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

export default function ChatPrincipal({ mensajes, esperando, onVerPDF }) {
  mensajes = mensajes || []
  const [editorDoc, setEditorDoc] = useState(null)
  const editorRef = useRef(null)
  const { formatear, abrirComentario, confirmarComentario, comentarioPopup, setComentarioPopup, textoComentario, setTextoComentario } = useEditorComentarios(editorRef)

  useEffect(() => {
    if (editorDoc && editorRef.current) {
      editorRef.current.innerHTML = (editorDoc.contenido || '').replace(/\n/g, '<br>')
    }
  }, [editorDoc?.index])

  function descargarEditado() {
    if (!editorRef.current) return
    descargarPDF(editorRef.current.innerHTML, `documento_${editorDoc.index + 1}`)
    setEditorDoc(null)
  }

  return (
    <div className="mensajes">
      {editorDoc && (
        <div className="editor_overlay" onClick={(e) => e.target === e.currentTarget && setEditorDoc(null)}>
          <div className="editor_modal">
            <div className="editor_header">
              <span>Editar documento</span>
              <button className="editor_cerrar" onClick={() => setEditorDoc(null)}>✕</button>
            </div>
            <div className="editor_toolbar">
              <button onMouseDown={(e) => { e.preventDefault(); formatear('bold') }}><b>N</b></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('italic') }}><i>C</i></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('underline') }}><u>S</u></button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('strikeThrough') }}><s>T</s></button>
              <span className="editor_toolbar_sep" />
              <button onMouseDown={(e) => { e.preventDefault(); formatear('insertOrderedList') }}>1.</button>
              <button onMouseDown={(e) => { e.preventDefault(); formatear('insertUnorderedList') }}>•</button>
              <span className="editor_toolbar_sep" />
              <button onMouseDown={abrirComentario} title="Añadir comentario al texto seleccionado">💬</button>
            </div>
            <div ref={editorRef} contentEditable suppressContentEditableWarning className="editor_textarea" />
            <button className="editor_descargar" onClick={descargarEditado}>&#x2B07; Descargar PDF</button>
          </div>
        </div>
      )}

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

      {mensajes.map((mensaje, index) => (
        <div key={index}>
          {mensaje.rol === 'usuario' ? (
            <div className="mensaje_usuario">
              <p className="mensaje_texto">{mensaje.contenido}</p>
              {mensaje.contenidoDoc && (
                <div className="mensaje_doc_acciones">
                  {mensaje.tipoDoc && (
                    <span className={`badge_tipo_doc badge_tipo_doc--${mensaje.tipoDoc}`}>
                      { { médico: '🏥 Médico', legal: '⚖️ Legal', educativo: '📚 Educativo', general: '📄 General' }[mensaje.tipoDoc] }
                    </span>
                  )}
                  {mensaje.urlPDF && (
                    <button className="mensaje_descargar" onClick={() => onVerPDF({ fuente: mensaje.urlPDF, nombre: mensaje.nombrePDF || 'documento.pdf' })}>
                      &#x1F4C4; Ver PDF
                    </button>
                  )}
                  <button className="mensaje_descargar" onClick={() => setEditorDoc({ contenido: mensaje.contenidoDoc, index })}>
                    &#x270E; Editar
                  </button>
                  <button className="mensaje_descargar" onClick={() => descargarPDF(mensaje.contenidoDoc.replace(/\n/g, '<br>'), `documento_${index + 1}`)}>
                    &#x2B07; Descargar PDF
                  </button>
                </div>
              )}
            </div>
          ) : mensaje.tipo === 'documento' ? (
            <div className="mensaje_ia_doc">
              <span className="mensaje_ia_doc_icono">📄</span>
              <div className="mensaje_ia_doc_info">
                <span className="mensaje_ia_doc_titulo">Documento generado</span>
                <span className="mensaje_ia_doc_preview">
                  {mensaje.contenido.slice(0, 90)}{mensaje.contenido.length > 90 ? '…' : ''}
                </span>
              </div>
              <div className="mensaje_ia_doc_botones">
                <button className="mensaje_descargar" onClick={() => setEditorDoc({ contenido: mensaje.contenidoDoc || mensaje.contenido, index })}>
                  &#x270E; Editar
                </button>
                <button className="mensaje_descargar" onClick={() => descargarPDF((mensaje.contenidoDoc || mensaje.contenido).replace(/\n/g, '<br>'), `documento_${index + 1}`)}>
                  &#x2B07; Descargar PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="mensaje_ia">
              <p className="mensaje_texto">{mensaje.contenido}</p>
            </div>
          )}
        </div>
      ))}

      {esperando && (
        <div className="mensaje_ia_wait">
          <span></span><span></span><span></span>
        </div>
      )}
    </div>
  )
}
