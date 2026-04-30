import { useState } from "react"
import { handleChange, handleSubmit } from "../servicios/registro"
import './Login.css'

export default function Registro({ onVolver }) {
  const [form, setForm] = useState({ nombre: "", apellidos: "", email: "", password: "", repetir: "" })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState("")

  return (
    <div className="login">
      <img src="./public/images/logo.svg" alt="IADocs" className="logo_login" />
      <h1>Crear cuenta</h1>
      <form onSubmit={(e) => handleSubmit(e, form, setErrores, setErrorServidor, onVolver)}>
        <input type="text" name="nombre" placeholder="Nombre" value={form.nombre}
          onChange={(e) => handleChange(e, form, setForm, errores, setErrores)} />
        {errores.nombre && <p className="error">{errores.nombre}</p>}

        <input type="text" name="apellidos" placeholder="Apellidos" value={form.apellidos}
          onChange={(e) => handleChange(e, form, setForm, errores, setErrores)} />

        <input type="text" name="email" placeholder="Email" value={form.email}
          onChange={(e) => handleChange(e, form, setForm, errores, setErrores)} />
        {errores.email && <p className="error">{errores.email}</p>}

        <input type="password" name="password" placeholder="Contraseña" value={form.password}
          onChange={(e) => handleChange(e, form, setForm, errores, setErrores)} />
        {errores.password && <p className="error">{errores.password}</p>}

        <input type="password" name="repetir" placeholder="Repetir contraseña" value={form.repetir}
          onChange={(e) => handleChange(e, form, setForm, errores, setErrores)} />
        {errores.repetir && <p className="error">{errores.repetir}</p>}

        {errorServidor && <p className="error">{errorServidor}</p>}
        <button type="submit">Registrarse</button>
      </form>
      <button onClick={onVolver}>¿Ya tienes cuenta? Inicia sesión</button>
    </div>
  )
}
