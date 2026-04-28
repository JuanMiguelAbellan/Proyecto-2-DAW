export default function Chat({ chat, activo, setChatActivo, onEliminar }) {
  return (
    <div className={`chat_item${activo ? " chat_activo" : ""}`}>
      <button
        className="chat_titulo"
        onClick={() => setChatActivo(chat)}
      >
        {chat.titulo || "Nuevo chat"}
      </button>
      <button
        className="chat_eliminar"
        onClick={(e) => { e.stopPropagation(); onEliminar(chat.id_chat) }}
      >
        ✕
      </button>
    </div>
  )
}
