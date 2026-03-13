
export default function Chat({chat, setChat}){
    return(
        <>
            <button onClick={(e)=>{
                //console.log(chat)
                setChat(chat)
            }}>{chat.titulo}</button>
        </>
    )
}