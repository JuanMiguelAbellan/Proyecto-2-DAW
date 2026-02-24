import Chat from "./Chat"

export default function AsideChats({chats}){
    return(
        <>
            {chats.map(chat => (
                <Chat key={chat.id} chat={chat} />
            ))}
        </>
    )
}