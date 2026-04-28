import { useState } from 'react'
import BarraInferior from './BarraInferior'
import ChatPrincipal from './ChatPrincipal'
import AsideChats from './AsideChats'
import './Conversacion.css'

export default function Conversacion({ chats, chatActivo, setChatActivo, mensajes, setMensajes, onNuevoChat, onTituloGenerado, onEliminarChat }) {
  const [esperando, setEsperando] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [dragging, setDragging] = useState(false)

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
      {archivos.map((f, i) => (
        <span key={i} className="archivo_chip">
          📄 {f.name}
          <button onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))}>✕</button>
        </span>
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
              <ChatPrincipal mensajes={mensajes} esperando={esperando} />
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
      </section>
    </main>
  )
}
