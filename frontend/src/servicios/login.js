import { post } from "./peticiones"

export function handleChange(e, form, setForm) {
  setForm({ ...form, [e.target.name]: e.target.value })
}

export function handleSubmit(e, form, setError, onLogin) {
  e.preventDefault()
  post("api/usuarios/login", form,
    (data) => {
      localStorage.setItem("token", data.token)
      onLogin(data.token)
    },
    () => setError("Email o contraseña incorrectos")
  )
}
