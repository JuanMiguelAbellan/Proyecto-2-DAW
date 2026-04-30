import { useState } from "react"
import { handleChange, handleSubmit } from "../servicios/login"
import './Login.css'

export default function Login({ onLogin, onRegistro }) {
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  return (
    <div className="login">
      <img src="./public/images/logo.svg" alt="IADocs" className="logo_login" />
      <h1>IA Docs</h1>
      <form onSubmit={(e) => handleSubmit(e, form, setError, onLogin)}>
        <input type="text" name="email" placeholder="Email" value={form.email}
          onChange={(e) => handleChange(e, form, setForm)} />
        <input type="password" name="password" placeholder="Contraseña" value={form.password}
          onChange={(e) => handleChange(e, form, setForm)} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Iniciar sesión</button>
      </form>
      <button onClick={onRegistro}>¿No tienes cuenta? Regístrate</button>
    </div>
  )
}
