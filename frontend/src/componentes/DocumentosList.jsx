import { useState, useEffect } from 'react'
import { get } from '../servicios/peticiones'
import './Ajustes.css'
import './DocumentosList.css'

const TIPO_LABELS = {
  médico:    { icono: '🏥', clase: 'doc_badge--medico' },
  legal:     { icono: '⚖️', clase: 'doc_badge--legal' },
  educativo: { icono: '📚', clase: 'doc_badge--educativo' },
  otro:      { icono: '📄', clase: 'doc_badge--otro' },
  general:   { icono: '📄', clase: 'doc_badge--otro' },
}

export default function DocumentosList({ onVolver }) {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    get('api/ia/documentos',
      (data) => { setDocumentos(data.documentos); setCargando(false) },
      () => setCargando(false)
    )
  }, [])

  function descargarTexto(preview, tipo, id) {
    const blob = new Blob([preview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documento_${tipo}_${id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="ajustes_pagina">
      <div className="ajustes_header">
        <button className="ajustes_volver" onClick={onVolver}>← Volver</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)' }}>Mis documentos</h2>
      </div>

      {cargando && <p className="docs_vacio">Cargando...</p>}
      {!cargando && documentos.length === 0 && (
        <p className="docs_vacio">No tienes documentos generados aún.</p>
      )}

      <div className="docs_grid">
        {documentos.map(doc => {
          const info = TIPO_LABELS[doc.tipo] || TIPO_LABELS.otro
          const fecha = new Date(doc.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
          return (
            <div key={doc.id} className="doc_card">
              <div className="doc_card_top">
                <span className={`doc_badge ${info.clase}`}>{info.icono} {doc.tipo}</span>
                <span className="doc_fecha">{fecha}</span>
              </div>
              <p className="doc_chat">📂 {doc.chat}</p>
              <p className="doc_preview">{doc.preview}{doc.preview?.length >= 200 ? '…' : ''}</p>
              <button className="doc_descargar" onClick={() => descargarTexto(doc.preview, doc.tipo, doc.id)}>
                ↓ Descargar
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
