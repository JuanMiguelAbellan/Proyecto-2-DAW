import { useState, useEffect } from 'react'
import AsideChats from './componentes/AsideChats'
import {get} from "./servicios/peticiones"

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
    </>
  )
}

export default App
