import { useState } from 'react'
import BarraInferior from './BarraInferior'
import ChatPrincipal from './ChatPrincipal'
import AsideChats from './AsideChats'
import VisorPDF from './VisorPDF'
import './Conversacion.css'

export default function Conversacion({ chats, chatActivo, setChatActivo, mensajes, setMensajes, onNuevoChat, onTituloGenerado, onEliminarChat }) {
  const [esperando, setEsperando] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [dragging, setDragging] = useState(false)
  const [visorPDF, setVisorPDF] = useState(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const nuevos = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.name.endsWith('.odt') || f.type === 'text/plain'
    )
    setArchivos(prev => [...prev, ...nuevos])
  }

  const archivosChips = archivos.length > 0 && (
    <div className="archivos_adjuntos">
      <span className="archivos_contador">
        {archivos.length} archivo{archivos.length > 1 ? 's' : ''} adjunto{archivos.length > 1 ? 's' : ''}
      </span>
      {archivos.map((f, i) => (
        <div key={i} className="archivo_chip">
          <span
            style={{ cursor: f.type === 'application/pdf' || f.name.endsWith('.pdf') ? 'pointer' : 'default' }}
            onClick={() => (f.type === 'application/pdf' || f.name.endsWith('.pdf')) && setVisorPDF({ fuente: f, nombre: f.name })}
          >📄 {f.name}</span>
          <button className="archivo_chip_remove" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
    </div>
  )

  return (
    <main>
      <AsideChats
        chats={chats}
        chatActivo={chatActivo}
        setChatActivo={setChatActivo}
        onNuevoChat={onNuevoChat}
        onEliminarChat={onEliminarChat}
      />
      <section
        className={`conversacion${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
        onDrop={handleDrop}
      >
        {mensajes.length > 0
          ? <>
              <ChatPrincipal mensajes={mensajes} esperando={esperando} onVerPDF={setVisorPDF} />
              {archivosChips}
              <BarraInferior
                chatActivo={chatActivo}
                setMensajes={setMensajes}
                onTituloGenerado={onTituloGenerado}
                setEsperando={setEsperando}
                onNuevoChat={onNuevoChat}
                archivos={archivos}
                setArchivos={setArchivos}
              />
            </>
          : <div className="bienvenida">
              <h2 className="bienvenida_texto">¿En qué puedo ayudarte?</h2>
              {archivosChips}
              <BarraInferior
                chatActivo={chatActivo}
                setMensajes={setMensajes}
                onTituloGenerado={onTituloGenerado}
                setEsperando={setEsperando}
                onNuevoChat={onNuevoChat}
                archivos={archivos}
                setArchivos={setArchivos}
              />
            </div>
        }
      {visorPDF && <VisorPDF fuente={visorPDF.fuente} nombre={visorPDF.nombre} onCerrar={() => setVisorPDF(null)} />}
      </section>
    </main>
  )
}
