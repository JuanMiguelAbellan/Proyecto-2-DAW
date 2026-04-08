import MenuHamburguesa from "./MenuHamburguesa";
import {crearMensaje, getRespuesta, getRespuestaStream} from '../servicios/script.js'
import { get, post, postToken } from "../servicios/peticiones.js";
import { useEffect, useState } from "react";

export default function BarraInferior(){

    return(
        <>
            <div className="barra_inferior">
                {/* <MenuHamburguesa className={"emoji"} img={"./public/images/emojis.svg"} opciones={
                    [{texto: "Hogar", funcion: () => {}}, {texto: "Llamada telefónica", funcion: () => {

                    }}]}/>
                <MenuHamburguesa className={"teclado"} img={"./public/images/teclado.svg"} opciones={
                    [{texto: "Hogar", funcion: () => {}}, {texto: "Llamada telefónica", funcion: () => {

                    }}]}/> */}
                <MenuHamburguesa className={"adjuntar"} img={"./public/images/adjuntar.svg"} opciones={
                    [<input key="adjuntar" type="file" onChange={async(e)=>{
                        //Comprobar que files no este vacio, y que sea de tipo correcto y si todo ok enviarlo
                        //Deberia ser useState
                        const files = e.target.files
                        if(files == null || files.length == 0){
                            console.log("No has elegido ningún archivo")
                        }else if(files[0].type != ".txt"){
                            console.log("El archivo no es del tipo correcto")
                            e.target.value=""
                        }else{
                            console.log(files[0].name)
                            const contenido=await files[0].text()
                            console.log(contenido)

                            //Enviar doc al s3
                            postToken("usuarios/guardaDoc", {titulo:files[0].name, contenido:contenido}, /*usuario*/null, (data)=>{
                                console.log(data)
                            }, (error)=>{
                                console.log(error)
                            })
                        }

                        }} accept=".txt" ></input>]}/>
                <input type="text" className="input_text" id="campo"/>
                <button className="enviar" onClick={(e)=>{
                    const texto=e.target.parentElement.parentElement.querySelector("#campo").value
                    crearMensaje("mensaje_usuario", texto)
                    crearMensaje("mensaje_ia_wait")
                    
                    getRespuestaStream(texto)
                    //enviar texto con contenido del doc
                }}>
                    <img className="enviar_imagen" src="./public/images/enviar.svg"/>
                </button>
                <img className="microfono" src="./public/images/microfono-circular-apagado.svg"></img>
            </div>
        </>
    )
}