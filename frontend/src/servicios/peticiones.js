const URL_SERVER = import.meta.env.VITE_API_URL || "http://localhost:8080/"

function getToken() {
  return localStorage.getItem("token")
}

export function get(url, callback, callbackError) {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    }
  }
  fetch(URL_SERVER + url, options)
    .then((response) => {
      if (response.ok) return response.json()
      else throw new Error()
    })
    .then((data) => callback(data))
    .catch((error) => callbackError(error))
}

export function post(url, datos, callback, callbackError) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(datos)
  }
  fetch(URL_SERVER + url, options)
    .then((response) => {
      if (response.ok) return response.json()
      else throw new Error()
    })
    .then((data) => callback(data))
    .catch((error) => callbackError(error))
}

export function delet(url, callback, callbackError) {
  const options = {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  }
  fetch(URL_SERVER + url, options)
    .then((response) => {
      if (response.ok) return response.json()
      else throw new Error()
    })
    .then((data) => callback(data))
    .catch((error) => callbackError(error))
}

export function pacth(url, datos, callback, callbackError) {
  const options = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(datos)
  }
  fetch(URL_SERVER + url, options)
    .then((response) => {
      if (response.ok) return response.json()
      else throw new Error()
    })
    .then((data) => callback(data))
    .catch((error) => callbackError(error))
}
