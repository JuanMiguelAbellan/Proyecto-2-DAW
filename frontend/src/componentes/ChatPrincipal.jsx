
export default function ChatPrincipal({chat}){
    chat={
        titulo:"Chat 1"
    }
    return (
        <>
            <h1 className="titulo">{chat.titulo}</h1>
            <div className="mensajes"></div>
        </>
    )
}