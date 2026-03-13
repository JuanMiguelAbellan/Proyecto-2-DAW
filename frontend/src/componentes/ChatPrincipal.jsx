import React, {Fragment, useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import styles from './dragndrop.module.css'

export default function ChatPrincipal({chat}){
    const historial=[chat.mensajesUsuario, chat.mensajesIa]
    const onDrop = useCallback(async(acceptedFiles) => {
        console.log(await acceptedFiles[0].text())
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
    let mensajes=useState(<div  className="mensajes" {...getRootProps()} onClick={()=>{}}/>)
    return (
        <>
            <h1 className="titulo">{chat.titulo}</h1>
            {mensajes}
                <input {...getInputProps()} className={styles.input} onClick={()=>{}}/>
                    {
                        isDragActive ?
                        mensajes=<div  className={styles.mensajes_cambio} {...getRootProps()} onClick={()=>{}}/>
                        :
                        mensajes=<div  className={styles.mensajes} {...getRootProps()} onClick={()=>{}}/>
                    }
            {
                historial.map((mensaje)=>{
                    return (
                        <>
                        <p className='mensaje_usuario'>{mensaje[0]}</p>
                        <p className='mensaje_ia'>{mensaje[1]}</p>
                        </>
                    )
                })
            }
        </>
    )
}