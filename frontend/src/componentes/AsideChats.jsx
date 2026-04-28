import Chat from "./Chat"
import { post, delet } from "../servicios/peticiones"

export default function AsideChats({ chats, chatActivo, setChatActivo, onNuevoChat, onEliminarChat }) {
  chats = chats || []

  function handleNuevoChat() {
    post("api/ia/nuevo", {},
      (data) => onNuevoChat(data.chat),
      (error) => console.error("Error creando chat:", error)
    )
  }

  function handleEliminar(idChat) {
    delet(`api/ia/chat/${idChat}`,
      () => onEliminarChat(idChat),
      (error) => console.error("Error eliminando chat:", error)
    )
  }

  return (
    <aside className="chats">
      <h2>Chats</h2>
      <button onClick={handleNuevoChat}>+ Nuevo chat</button>
      {chats.map((chat) => (
        <Chat
          key={chat.id_chat}
          chat={chat}
          activo={chatActivo?.id_chat === chat.id_chat}
          setChatActivo={setChatActivo}
          onEliminar={handleEliminar}
        />
      ))}
    </aside>
  )
}
