import { useState } from "react"
import { post } from "../servicios/peticiones"
import './Login.css'

export default function ResetearPassword({ token, onIrALogin }) {
  const [password, setPassword] = useState("")
  const [repetir, setRepetir] = useState("")
  const [error, setError] = useState("")
  const [ok, setOk] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError("Mínimo 8 caracteres"); return }
    if (password !== repetir) { setError("Las contraseñas no coinciden"); return }
    setError("")
    post("api/usuarios/resetear-password", { token, passwordNueva: password },
      () => setOk(true),
      () => setError("El enlace no es válido o ha caducado")
    )
  }

  return (
    <div className="login">
      <img src="/images/logo.svg" alt="IADocs" className="logo_login" />
      <h1>Nueva contraseña</h1>
      {ok ? (
        <p className="login_mensaje">Contraseña actualizada. Ya puedes iniciar sesión.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="Nueva contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="Repetir contraseña" value={repetir}
            onChange={(e) => setRepetir(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button type="submit">Cambiar contraseña</button>
        </form>
      )}
      <button onClick={onIrALogin}>Ir a iniciar sesión</button>
    </div>
  )
}
