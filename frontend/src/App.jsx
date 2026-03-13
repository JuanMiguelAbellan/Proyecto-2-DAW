import { useState, useEffect } from 'react'
import AsideChats from './componentes/AsideChats'
import {get} from "./servicios/peticiones"
import Conversacion from './componentes/Conversacion';
import './root.css'
import './styles.css'
import NavBar from './componentes/NavBar';

function App() {
  const [chats, setChats] = useState([
    {titulo: "Chat de prueba", id_chat: 1, mensajesUsuario:["Hola que tal?", "Adios"], mensajesIa:["Bien y tu?", "Hasta Luego"]}
      , 
      {titulo: "Chat de prueba 2 ", id_chat: 2, mensajesUsuario:["Hola buenas tardes", "Gracias"], mensajesIa:["Hola buenas tardes", "A ti guapo"]}
  ]);
  const [chat, setChat] = useState(chats[0])
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
      
      <Conversacion chats={chats} chat={chat} setChat={setChat}>
      
      </Conversacion>
      
    </>
  )
}

export default App
