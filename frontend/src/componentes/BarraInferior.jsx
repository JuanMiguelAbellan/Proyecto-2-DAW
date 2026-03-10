import MenuHamburguesa from "./MenuHamburguesa";
import {crearMensaje, getRespuesta, getRespuestaStream} from '../servicios/script.js'
import { get } from "../servicios/peticiones.js";
import { useEffect, useState } from "react";

export default function BarraInferior(){

    return(
        <>
            <div className="barra_inferior">
                <MenuHamburguesa className={"emoji"} img={"./public/images/emojis.svg"} opciones={
                    [{texto: "Hogar", funcion: () => {}}, {texto: "Llamada telefónica", funcion: () => {

                    }}]}/>
                <MenuHamburguesa className={"teclado"} img={"./public/images/teclado.svg"} opciones={
                    [{texto: "Hogar", funcion: () => {}}, {texto: "Llamada telefónica", funcion: () => {

                    }}]}/>
                <MenuHamburguesa className={"adjuntar"} img={"./public/images/adjuntar.svg"} opciones={
                    [{texto: "Hogar", funcion: () => {}}, {texto: "Llamada telefónica", funcion: () => {
                        
                    }}]}/>
                <input type="text" className="input_text" id="campo"/>
                <button className="enviar" onClick={(e)=>{
                    const texto=e.target.parentElement.parentElement.querySelector("#campo").value
                    crearMensaje("mensaje_usuario", texto)
                    crearMensaje("mensaje_ia_wait")
                    
                    getRespuestaStream(texto)
                }}>
                    <img className="enviar_imagen" src="./public/images/enviar.svg"/>
                </button>
                <img className="microfono" src="./public/images/microfono-circular-apagado.svg"></img>
            </div>
        </>
    )
}