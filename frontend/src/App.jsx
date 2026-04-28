import { useState, useEffect } from 'react'
import { get } from "./servicios/peticiones"
import Conversacion from './componentes/Conversacion'
import Login from './componentes/Login'
import Registro from './componentes/Registro'
import Suscripcion from './componentes/Suscripcion'
import './root.css'
import './styles.css'
import NavBar from './componentes/NavBar'

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [pantalla, setPantalla] = useState("login")
  const [vistaApp, setVistaApp] = useState("chat")
  const [temaOscuro, setTemaOscuro] = useState(false)
  const [chats, setChats] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", temaOscuro ? "oscuro" : "claro")
  }, [temaOscuro])

  useEffect(() => {
    if (token) {
      get("api/usuarios/getChats", (data) => {
        setChats(data.chats)
      }, (error) => {
        console.error("Error cargando chats:", error)
      })
    }
  }, [token])

  useEffect(() => {
    if (chatActivo) {
      get(`api/ia/mensajes/${chatActivo.id_chat}`, (data) => {
        setMensajes(data.mensajes)
      }, (error) => {
        console.error("Error cargando mensajes:", error)
      })
    }
  }, [chatActivo])

  function handleLogin(nuevoToken) {
    setToken(nuevoToken)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    setToken(null)
    setChats([])
    setChatActivo(null)
    setMensajes([])
  }

  function handleNuevoChat(chat) {
    setChats([chat, ...chats])
    setChatActivo(chat)
    setMensajes([])
  }

  function handleEliminarChat(idChat) {
    setChats((prev) => prev.filter((c) => c.id_chat !== idChat))
    if (chatActivo?.id_chat === idChat) {
      setChatActivo(null)
      setMensajes([])
    }
  }

  function handleTituloGenerado(idChat, titulo) {
    setChats((prev) => prev.map((c) => c.id_chat === idChat ? { ...c, titulo } : c))
  }

  if (!token) {
    if (pantalla === "registro") {
      return <Registro onVolver={() => setPantalla("login")} />
    }
    return <Login onLogin={handleLogin} onRegistro={() => setPantalla("registro")} />
  }

  return (
    <>
      <NavBar
        onSuscripcion={() => setVistaApp("suscripcion")}
        onLogout={handleLogout}
        temaOscuro={temaOscuro}
        setTemaOscuro={setTemaOscuro}
      />
      {vistaApp === "suscripcion"
        ? <Suscripcion onVolver={() => setVistaApp("chat")} />
        : <Conversacion
            chats={chats}
            chatActivo={chatActivo}
            setChatActivo={setChatActivo}
            mensajes={mensajes}
            setMensajes={setMensajes}
            onNuevoChat={handleNuevoChat}
            onTituloGenerado={handleTituloGenerado}
            onEliminarChat={handleEliminarChat}
          />
      }
    </>
  )
}

export default App
