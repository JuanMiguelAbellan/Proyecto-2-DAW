import React from "react"

document.addEventListener("DOMContentLoaded", listeners)

function listeners(){
    let button = new Element
    button = document.querySelector(".enviar")
    let input = document.querySelector("#campo")

    button.addEventListener("click", function(e){
        let text = input.value
        crearMensaje("mensaje_usuario", text)
        crearMensaje("mensaje_ia_wait")
    })

    input.addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            let text = input.value
            crearMensaje("mensaje_usuario", text)
            crearMensaje("mensaje_ia_wait")
        }
    })
}

function crearMensaje(clase, contenido){
    if(clase === "mensaje_ia_wait"){
        mensaje = document.createElement("p")
        span = document.createElement("span")
        mensaje.setAttribute("class", clase)
        mensaje.append(document.createElement("span"))
        document.querySelector(".emoji").before(mensaje)
        input.value = ""
    }else{
        mensaje = document.createElement("p")
        mensaje.textContent = contenido
        mensaje.setAttribute("class", clase)
        document.querySelector(".emoji").before(mensaje)
        input.value = ""
    }
}