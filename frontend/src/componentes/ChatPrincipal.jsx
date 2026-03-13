import React, {Fragment, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import styles from './dragndrop.module.css'

export default function ChatPrincipal({chat}){
    
    chat={
        titulo:"Chat 1"
    }
    const onDrop = useCallback(async(acceptedFiles) => {
        console.log(await acceptedFiles[0].text())
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
    let mensajes=<div  className="mensajes" {...getRootProps()}/>;
    return (
        <>
            <h1 className="titulo">{chat.titulo}</h1>
            {mensajes}
                <input {...getInputProps()} className={styles.input}/>
                    {
                        isDragActive ?
                        <p className={styles.cambio}></p> 
                        :
                        <p className={styles.normal}></p>
                    }
        </>
    )
}