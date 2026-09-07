import { useState } from "react"
import { post } from "../servicios/peticiones"
import './Login.css'

export default function SolicitarReset({ onVolver }) {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Respondemos igual haya éxito o error para no filtrar qué emails
    // están registrados (coincide con el comportamiento del backend).
    post("api/usuarios/solicitar-reset", { email }, () => setEnviado(true), () => setEnviado(true))
  }

  return (
    <div className="login">
      <img src="/images/logo.svg" alt="IADocs" className="logo_login" />
      <h1>Recuperar contraseña</h1>
      {enviado ? (
        <p className="login_mensaje">Si ese email está registrado, te hemos enviado un enlace para restablecer tu contraseña.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Enviar enlace</button>
        </form>
      )}
      <button onClick={onVolver}>Volver a iniciar sesión</button>
    </div>
  )
}
