import Chat from "./Chat"

export default function AsideChats({chats}){
    chats = chats || [];
    return(
        <>
            <aside className="chats">
                <h2>Chats</h2>
                {chats.map((chat) => <Chat key={chat.id_chat} chat={chat} />)}
            </aside>
        </>
    )
}