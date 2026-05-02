const URL_SERVER = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem("token")
}

function checkResponse(response) {
  if (response.ok) return response.json()
  if (response.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('auth:logout'))
  }
  throw new Error(`${response.status}`)
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
    .then(checkResponse)
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
    .then(checkResponse)
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
    .then(checkResponse)
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
    .then(checkResponse)
    .then((data) => callback(data))
    .catch((error) => callbackError(error))
}
