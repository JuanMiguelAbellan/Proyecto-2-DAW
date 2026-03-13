import BarraInferior from "./BarraInferior";
import ChatPrincipal from "./ChatPrincipal";
import '../servicios/script'
import AsideChats from "./AsideChats";

export default function Conversacion({chat, chats, setChat}){
    return(
        <> <main>
            <AsideChats chats={chats} setChat={setChat}></AsideChats>
            <section className="conversacion">
                
                <ChatPrincipal chat={chat}></ChatPrincipal>
                <BarraInferior></BarraInferior>
             </section>
           
            </main>
        </>
    )
}