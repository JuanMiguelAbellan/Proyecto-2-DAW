import { useState, useEffect } from 'react'
import { get } from './servicios/peticiones'
import Conversacion from './componentes/Conversacion'
import Login from './componentes/Login'
import Registro from './componentes/Registro'
import Subscripcion from './componentes/Subscripcion'
import AjustesCuenta from './componentes/AjustesCuenta'
import AjustesSubscripcion from './componentes/AjustesSubscripcion'
import AjustesAccesibilidad from './componentes/AjustesAccesibilidad'
import DocumentosList from './componentes/DocumentosList'
import NavBar from './componentes/NavBar'
import './root.css'
import './styles/base.css'
import './styles/media.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [pantalla, setPantalla] = useState('login')
  const [vistaApp, setVistaApp] = useState('chat')
  const [temaOscuro, setTemaOscuro] = useState(false)
  const [chats, setChats] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [planActual, setPlanActual] = useState('gratis')

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', temaOscuro ? 'oscuro' : 'claro')
  }, [temaOscuro])

  useEffect(() => {
    const handler = () => handleLogout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  useEffect(() => {
    if (token) {
      get('api/usuarios/getChats',
        (data) => setChats(data.chats),
        (error) => console.error('Error cargando chats:', error)
      )
      get('api/usuarios/me',
        (data) => setPlanActual(data.planSubscripcion || 'gratis'),
        () => {}
      )
    }
  }, [token])

  useEffect(() => {
    if (chatActivo) {
      get(`api/ia/mensajes/${chatActivo.id_chat}`,
        (data) => setMensajes(data.mensajes),
        (error) => console.error('Error cargando mensajes:', error)
      )
    }
  }, [chatActivo])

  function handleLogin(nuevoToken) { setToken(nuevoToken) }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setChats([])
    setChatActivo(null)
    setMensajes([])
    setPlanActual('gratis')
    setPantalla('login')
  }

  function handleNuevoChat(chat) {
    setChats((prev) => [chat, ...prev])
    setChatActivo(chat)
    setMensajes([])
  }

  function handleEliminarChat(idChat) {
    setChats(prev => prev.filter(c => c.id_chat !== idChat))
    if (chatActivo?.id_chat === idChat) {
      setChatActivo(null)
      setMensajes([])
    }
  }

  function handleTituloGenerado(idChat, titulo) {
    setChats(prev => prev.map(c => c.id_chat === idChat ? { ...c, titulo } : c))
  }

  if (!token) {
    if (pantalla === 'registro') {
      return <Registro onVolver={() => setPantalla('login')} />
    }
    return <Login onLogin={handleLogin} onRegistro={() => setPantalla('registro')} />
  }

  const vistas = {
    chat: (
      <Conversacion
        chats={chats}
        chatActivo={chatActivo}
        setChatActivo={setChatActivo}
        mensajes={mensajes}
        setMensajes={setMensajes}
        onNuevoChat={handleNuevoChat}
        onTituloGenerado={handleTituloGenerado}
        onEliminarChat={handleEliminarChat}
      />
    ),
    subscripcion: <Subscripcion onVolver={() => setVistaApp('chat')} onPlanCambiado={setPlanActual} />,
    cuenta: <AjustesCuenta onVolver={() => setVistaApp('chat')} />,
    ajustesSubscripcion: (
      <AjustesSubscripcion
        onVolver={() => setVistaApp('chat')}
        onPlanCambiado={setPlanActual}
      />
    ),
    accesibilidad: <AjustesAccesibilidad onVolver={() => setVistaApp('chat')} />,
    documentos: <DocumentosList onVolver={() => setVistaApp('chat')} />,
  }

  return (
    <>
      <NavBar
        onNavegar={setVistaApp}
        onLogout={handleLogout}
        temaOscuro={temaOscuro}
        setTemaOscuro={setTemaOscuro}
        planActual={planActual}
      />
      {vistas[vistaApp] || vistas.chat}
    </>
  )
}

export default App
