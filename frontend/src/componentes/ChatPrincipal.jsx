export default function ChatPrincipal({ mensajes, esperando }) {
  mensajes = mensajes || []

  return (
    <div className="mensajes">
      {mensajes.map((mensaje, index) => (
        <p key={index} className={mensaje.rol === "usuario" ? "mensaje_usuario" : "mensaje_ia"}>
          {mensaje.contenido}
        </p>
      ))}
      {esperando && (
        <div className="mensaje_ia_wait">
          <span></span><span></span><span></span>
        </div>
      )}
    </div>
  )
}
