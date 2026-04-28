import { post } from "./peticiones"

function validar(form) {
  const errores = {}

  if (!form.nombre.trim())
    errores.nombre = "El nombre es obligatorio"

  if (!form.email.includes("@") || !form.email.includes("."))
    errores.email = "Introduce un email válido"

  if (form.password.length < 8)
    errores.password = "Mínimo 8 caracteres"
  else if (!/[A-Z]/.test(form.password))
    errores.password = "Debe tener al menos una mayúscula"
  else if (!/[0-9]/.test(form.password))
    errores.password = "Debe tener al menos un número"

  if (form.password !== form.repetir)
    errores.repetir = "Las contraseñas no coinciden"

  return errores
}

export function handleChange(e, form, setForm, errores, setErrores) {
  setForm({ ...form, [e.target.name]: e.target.value })
  setErrores({ ...errores, [e.target.name]: "" })
}

export function handleSubmit(e, form, setErrores, setErrorServidor, onVolver) {
  e.preventDefault()
  const errores = validar(form)
  if (Object.keys(errores).length > 0) {
    setErrores(errores)
    return
  }
  const { repetir, ...datos } = form
  post("api/usuarios/registro",
    { ...datos, rol: "usuario", preferencias: {} },
    () => onVolver(),
    () => setErrorServidor("Error al registrarse, prueba con otro email")
  )
}
