import React, {Fragment, useCallback, useState} from 'react'

export default function ChatPrincipal({chat}){
    const historial=[chat.mensajesUsuario, chat.mensajesIa]

    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = () => setIsDragging(true);
    const handleDragLeave = () => setIsDragging(false);

    const [files, setFiles] = useState([]);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(droppedFiles);
        //Enviar los documentos, alomejor deberian ser un usestate para que al enviar el mensaje se envien
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };
    return (
        <>
            <h1 className="titulo">{chat.titulo}</h1>
                <div className="mensajes"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    style={{
                        backgroundColor: isDragging ? "#92c1eb" : "#d1cbcb",
                    }}
                    >
                    <ul>
                        {files.map((file, index) => (
                        <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                    
                    {
                        historial.map((mensaje)=>{
                            return (
                                <>
                                <p className='mensaje_usuario' key={mensaje[0]}>{mensaje[0]}</p>
                                <p className='mensaje_ia' key={mensaje[1]}>{mensaje[1]}</p>
                                </>
                            )
                        })
                    }
                </div>
            
        </>
    )
}