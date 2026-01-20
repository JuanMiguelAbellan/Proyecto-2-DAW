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
    console.log(contenido);
    let input = document.querySelector("#campo")
    
    if(clase === "mensaje_ia_wait"){
        let mensaje = document.createElement("p")
        let span = document.createElement("span")
        mensaje.setAttribute("class", clase)
        mensaje.append(document.createElement("span"))
        document.querySelector(".emoji").before(mensaje)
        input.value = ""
    }else{
        let mensaje = document.createElement("p")
        mensaje.textContent = contenido
        mensaje.setAttribute("class", clase)
        document.querySelector(".emoji").before(mensaje)
        input.value = ""
    }
}

function getRespuesta(pregunta){
    const URL = "http://localhost:8080/api"
    const myHeaders = new Headers();
    myHeaders.append("Authorization", 
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwZXBpdG81LnBlcGUuQGdtYWlsLmNvbSIsImlhdCI6MTc2ODkxMDEzMywiZXhwIjoxNzY4OTEzNzMzfQ.4K2qSyQSqxseI5mCzX29euEx_dZMY1FAEiwZmCxxhHc");

    const requestOptions = {
        method: "GET",
        headers: myHeaders
    };
    fetch(URL+"/tareas/6", requestOptions)
    .then(response => {
        if(response.ok){
            return response.json()
        }else{
            console.log(response);
            throw new Error(response.statusText)
        }
    })
    .then(data => crearMensaje("mensaje_ia" , data.texto))
    .catch(error => console.log(error))
}