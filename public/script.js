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
        document.querySelector(".emoji").before(mensaje)
        input.value = ""
    }else if(clase === "mensaje_ia"){
        let mensaje = document.createElement("p")
        document.querySelector(".mensaje_ia_wait").remove()
        mensaje.textContent = contenido
        mensaje.setAttribute("class", clase)
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
    const URL = "http://localhost:11434/api/generate"
    const myHeaders = new Headers();
    const json = {
        "model": "gemma3:latest",
        "prompt": pregunta,
        "stream": false, //--> Para recibir una respuesta unica
        //"format": "json" 
        //"context": [105, 2364, 107, ...] //--> Para continuar una conversacion sin tener que enviar todo el historial (que lo devuelve al final de la respuesta)
        //"system": "Eres un asistente especializado en..." //--> Instrucciones del sistema
        //"image": ["<base64>"] //--> Para modelos que soporten entrada de imagen
        //"max_new_tokens": 150 //--> Longitud máxima de la respuesta
        //"temperature": 0.7 //--> Creatividad

        //"top_p": 0.9 //--> Probabilidad acumulada cuanto mayor, más creatividad
        //"top_k": 50 //--> nº de tokens candidatos a considerar por el top_p cuanto mayor, más variado por defecto 0 sin limite
        //"repetition_penalty": 1.2 //--> Penalización por repetición
        //"presence_penalty": 0.2 //--> Penalización si ya se habló del tema cuanto mayor, mas evita repetir temas
        //"frequency_penalty": 0.2 //--> Penalización por frecuencia de palabras
        //"stop": ["\n", ###] //--> Secuencias de parada para cortar respuestas largas
        
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