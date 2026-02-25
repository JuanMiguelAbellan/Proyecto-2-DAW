import { useState, useEffect } from 'react'
import AsideChats from './componentes/AsideChats'
import {get} from "./servicios/peticiones"
import Conversacion from './componentes/Conversacion';
import './root.css'
import './styles.css'

function App() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    get("api/usuarios/getChats", (data) => {
      setChats(data.chats);
    }, (error) => {
      console.error("Error fetching chats:", error);
    });
  }, []);

  return (
    <>
      <AsideChats chats={chats} />
      <Conversacion></Conversacion>
    </>
  )
}

export default App
