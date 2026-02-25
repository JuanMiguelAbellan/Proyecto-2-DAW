const URL_SERVER="http://localhost:8080/"
export function get(url, callback, callbackError){
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJpZCI6MSwibm9tYnJlIjoiSnVhbiIsInByZWZlcmVuY2lhcyI6eyJ0ZW1hIjoiY2xhcm8ifSwiaWF0IjoxNzcyMDIxMDAxLCJleHAiOjE3NzIxMDc0MDF9.Ja9ZK8_uCwWx9JWU5PhvY8PXLEos18f5VAge8RK_ncw");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    fetch(URL_SERVER+url, requestOptions)
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