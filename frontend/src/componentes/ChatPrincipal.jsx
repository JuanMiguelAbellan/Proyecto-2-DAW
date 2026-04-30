import './ChatPrincipal.css'

export default function ChatPrincipal({ mensajes, esperando, onVerPDF }) {
  mensajes = mensajes || []

  function descargar(contenido, index) {
    const blob = new Blob([contenido], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documento_${index + 1}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mensajes">
      {mensajes.map((mensaje, index) => (
        <div key={index} className={mensaje.rol === 'usuario' ? 'mensaje_usuario' : 'mensaje_ia'}>
          <p className="mensaje_texto">{mensaje.contenido}</p>
          {mensaje.tipo === 'documento' && mensaje.contenidoDoc && (
            <button
              className="mensaje_descargar"
              onClick={() => descargar(mensaje.contenidoDoc, index)}
            >
              &#x2B07; Descargar documento
            </button>
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
