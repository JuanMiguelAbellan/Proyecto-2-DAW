import { useState } from "react"
import BarraInferior from "./BarraInferior"
import ChatPrincipal from "./ChatPrincipal"
import AsideChats from "./AsideChats"

export default function Conversacion({ chats, chatActivo, setChatActivo, mensajes, setMensajes, onNuevoChat, onTituloGenerado, onEliminarChat }) {
  const [esperando, setEsperando] = useState(false)

  return (
    <main>
      <AsideChats
        chats={chats}
        chatActivo={chatActivo}
        setChatActivo={setChatActivo}
        onNuevoChat={onNuevoChat}
        onEliminarChat={onEliminarChat}
      />
      <section className="conversacion">
        {mensajes.length > 0
          ? <>
              <ChatPrincipal mensajes={mensajes} esperando={esperando} />
              <BarraInferior
                chatActivo={chatActivo}
                mensajes={mensajes}
                setMensajes={setMensajes}
                onTituloGenerado={onTituloGenerado}
                setEsperando={setEsperando}
              />
            </>
          : <div className="bienvenida">
              <h2 className="bienvenida_texto">¿En qué puedo ayudarte?</h2>
              <BarraInferior
                chatActivo={chatActivo}
                mensajes={mensajes}
                setMensajes={setMensajes}
                onTituloGenerado={onTituloGenerado}
                setEsperando={setEsperando}
              />
            </div>
        }
      </section>
    </main>
  )
}
