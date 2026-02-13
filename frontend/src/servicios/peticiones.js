const URL_SERVER="http://34.224.104.164:3000/"
export function get(url, callback, callbackError){
    
    fetch(URL_SERVER+url)
    .then((response)=>{
        if(response.ok){
            return response.json()
        }else{
            throw new Error
        }
    })
    .then((data)=>{callback(data)})
    .catch((error)=>{callbackError(error)})
}

export function post(url, datos, callback, callbackError){
    const options={
        method:"POST",
        headers:{
            "Content_Type": "application/json"
        },
        body: JSON.stringify(datos)
    }
    console.log(options.body);
    
    fetch(URL_SERVER+url, options)
    .then((response)=>{
        if(response.ok){
            return response.json()
        }else{
            throw new Error
        }
    })
    .then((data)=>{callback(data)})
    .catch((error)=>{callbackError(error)})
}

export function delet(url, callback, callbackError){
    const options={
        method:"DELETE"
    }
    
    fetch(URL_SERVER+url, options)
    .then((response)=>{
        if(response.ok){
            return response.json()
        }else{
            throw new Error
        }
    })
    .then((data)=>{callback(data)})
    .catch((error)=>{callbackError(error)})
}

export function pacth(url, datos, callback, callbackError){
    const options={
        method:"PATCH",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos),
        
    }
    console.log(options.body);
    
    
    fetch(URL_SERVER+url, options)
    .then((response)=>{
        if(response.ok){
            return response.json()
        }else{
            throw new Error
        }
    })
    .then((data)=>{callback(data)})
    .catch((error)=>{callbackError(error)})
}