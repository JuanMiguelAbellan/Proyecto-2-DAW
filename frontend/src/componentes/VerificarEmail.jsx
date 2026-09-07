import { useEffect, useState } from "react"
import { get } from "../servicios/peticiones"
import './Login.css'

export default function VerificarEmail({ token, onIrALogin }) {
  const [estado, setEstado] = useState("comprobando") // comprobando | ok | error

  useEffect(() => {
    get(`api/usuarios/verificar-email/${token}`,
      () => setEstado("ok"),
      () => setEstado("error")
    )
  }, [token])

  return (
    <div className="login">
      <img src="/images/logo.svg" alt="IADocs" className="logo_login" />
      <h1>Verificación de email</h1>
      {estado === "comprobando" && <p className="login_mensaje">Comprobando tu enlace...</p>}
      {estado === "ok" && <p className="login_mensaje">Tu email ha sido verificado correctamente.</p>}
      {estado === "error" && <p className="error">El enlace no es válido o ya ha sido utilizado.</p>}
      <button onClick={onIrALogin}>Ir a iniciar sesión</button>
    </div>
  )
}
