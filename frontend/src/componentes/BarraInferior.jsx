import MenuHamburguesa from "./MenuHamburguesa"
import { post } from "../servicios/peticiones"
import { useState, useRef } from "react"

export default function BarraInferior({ chatActivo, mensajes, setMensajes, onTituloGenerado, setEsperando }) {
  const [texto, setTexto] = useState("")
  const inputFileRef = useRef(null)

  function enviar() {
    if (!texto.trim() || !chatActivo) return

    const mensajeUsuario = { rol: "usuario", contenido: texto }
    setMensajes([...mensajes, mensajeUsuario])
    setTexto("")
    setEsperando(true)

    post("api/ia/generate",
      { prompt: texto, tipo: "free", idChat: chatActivo.id_chat },
      (data) => {
        setEsperando(false)
        setMensajes((prev) => [...prev, { rol: "ia", contenido: data.contenido }])
        if (data.titulo) {
          onTituloGenerado(chatActivo.id_chat, data.titulo)
        }
      },
      (error) => {
        setEsperando(false)
        console.error("Error al generar respuesta:", error)
      }
    )
  }

  return (
    <>
      <div className="barra_inferior">
        <input
          type="file"
          accept=".pdf,.odt"
          ref={inputFileRef}
          style={{ display: "none" }}
          onChange={(e) => console.log("Archivo seleccionado:", e.target.files[0])}
        />
        <MenuHamburguesa className={"adjuntar"} img={"./public/images/adjuntar.svg"} opciones={[
          { texto: "Subir PDF", funcion: () => { inputFileRef.current.accept = ".pdf"; inputFileRef.current.click() } },
          { texto: "Subir ODT", funcion: () => { inputFileRef.current.accept = ".odt"; inputFileRef.current.click() } }
        ]} />
        <input
          type="text"
          className="input_text"
          id="campo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <button className="enviar" onClick={enviar}>
          <img className="enviar_imagen" src="./public/images/enviar.svg" />
        </button>
        <img className="microfono" src="./public/images/microfono-circular-apagado.svg" />
      </div>
    </>
  )
}
