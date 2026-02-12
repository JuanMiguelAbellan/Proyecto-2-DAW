document.addEventListener("DOMContentLoaded", listeners)

function listeners(){
    let button = document.querySelector(".enviar")
    let input = document.querySelector("#campo")
    
    button.addEventListener("click", function(e){
        let text = input.value
        crearMensaje("mensaje_usuario", text)
        crearMensaje("mensaje_ia_wait")
        getRespuesta(text)
    })

    input.addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            let text = input.value
            crearMensaje("mensaje_usuario", text)
            crearMensaje("mensaje_ia_wait")
            getRespuesta(text)
        }
    })
}

function crearMensaje(clase, contenido){
    let input = document.querySelector("#campo")
    
    if(clase === "mensaje_ia_wait"){
        let mensaje = document.createElement("p")
        mensaje.setAttribute("class", clase)
        mensaje.append(document.createElement("span"))
        document.querySelector(".mensajes").appendChild(mensaje)
        input.value = ""
    }else if(clase === "mensaje_ia"){
        let mensaje = document.createElement("p")
        document.querySelector(".mensaje_ia_wait").remove()
        mensaje.textContent = contenido
        mensaje.setAttribute("class", clase)
        document.querySelector(".mensajes").appendChild(mensaje)
        input.value = ""
    }else{
        let mensaje = document.createElement("p")
        mensaje.textContent = contenido
        mensaje.setAttribute("class", clase)
        document.querySelector(".mensajes").appendChild(mensaje)
        input.value = ""
    }
}

function getRespuesta(pregunta){
    const URL = "http://localhost:4000/api/ai/generate"
    const myHeaders = new Headers();
    const json = {
        "prompt": pregunta
    };
    myHeaders.append(
        "Content-Type", "application/json"
    )
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        redirect: 'follow',
        body: JSON.stringify(json)
    };
    fetch(URL, requestOptions)
    .then(response => {
        if(response.ok){
            return response.json()
        }else{
            throw new Error(response.statusText)
        }
    })
    .then(data => crearMensaje("mensaje_ia", data.response))
    .catch(error => console.log(error))
}