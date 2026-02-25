import BarraInferior from "./BarraInferior";
import ChatPrincipal from "./ChatPrincipal";
import '../servicios/script'

export default function Conversacion({chat}){
    return(
        <>
            <ChatPrincipal chat={chat}><div className="mensajes"/></ChatPrincipal>
            <BarraInferior></BarraInferior>
        </>
    )
}