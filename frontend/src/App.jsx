import { useState, useEffect } from 'react'
import AsideChats from './componentes/AsideChats'
import {get} from "./servicios/peticiones"
import Conversacion from './componentes/Conversacion';
import './root.css'
import './styles.css'
import NavBar from './componentes/NavBar';

function App() {
  const [chats, setChats] = useState([{titulo: "Chat de prueba", id_chat: 1}]);
  const [usuario, setUsuario] = useState(JSON.parse(sessionStorage.getItem("usuario")) || null);

  // useEffect(() => {
  //   get("api/usuarios/getChats", (data) => {
  //     setChats(data.chats);
  //   }, (error) => {
  //     console.error("Error fetching chats:", error);
  //   });
  // }, []);

  return (
    <>
    <NavBar></NavBar>
      
      <Conversacion chats={chats}>
      
      </Conversacion>
      
    </>
  )
}

export default App
