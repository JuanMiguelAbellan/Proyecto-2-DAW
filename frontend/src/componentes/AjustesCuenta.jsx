import { useState, useEffect } from 'react'
import { get, post, pacth } from '../servicios/peticiones'
import './Ajustes.css'

export default function AjustesCuenta({ onVolver }) {
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '' })
  const [pass, setPass] = useState({ actual: '', nueva: '', repetir: '' })
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    get('api/usuarios/me',
      (data) => {
        setForm({ nombre: data.nombre || '', apellidos: data.apellidos || '', email: data.email || '' })
        setCargando(false)
      },
      () => setCargando(false)
    )
  }, [])

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function guardarInfo(e) {
    e.preventDefault()
    pacth('api/usuarios/me',
      { nombre: form.nombre, apellidos: form.apellidos, email: form.email },
      () => mostrarToast('Información actualizada correctamente'),
      () => mostrarToast('Error al guardar los cambios')
    )
  }

  function cambiarPassword(e) {
    e.preventDefault()
    if (!pass.actual) { mostrarToast('Introduce tu contraseña actual'); return }
    if (pass.nueva !== pass.repetir) { mostrarToast('Las contraseñas no coinciden'); return }
    if (pass.nueva.length < 6) { mostrarToast('La nueva contraseña debe tener al menos 6 caracteres'); return }
    post('api/usuarios/cambiarPassword',
      { passwordActual: pass.actual, passwordNueva: pass.nueva },
      () => {
        mostrarToast('Contraseña actualizada correctamente')
        setPass({ actual: '', nueva: '', repetir: '' })
      },
      (err) => mostrarToast(err?.message || 'Contraseña actual incorrecta')
    )
  }

  function eliminarCuenta() {
    if (window.confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
      mostrarToast('Función no disponible en esta versión')
    }
  }

  if (cargando) return <div className="ajustes_pagina"><p style={{ padding: '2rem', fontFamily: 'var(--family-font-conversacion)', color: 'var(--color-text)' }}>Cargando...</p></div>

  return (
    <div className="ajustes_pagina">
      {toast && <div className="ajustes_toast">{toast}</div>}
      <div className="ajustes_header">
        <button className="ajustes_volver" onClick={onVolver}>← Volver</button>
        <h1>Mi cuenta</h1>
      </div>

      <div className="ajustes_contenido">

        <section className="ajustes_seccion">
          <h2>Información personal</h2>
          <form onSubmit={guardarInfo}>
            <div className="ajustes_campo">
              <label>Nombre</label>
              <input type="text" placeholder="Tu nombre" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="ajustes_campo">
              <label>Apellidos</label>
              <input type="text" placeholder="Tus apellidos" value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            </div>
            <div className="ajustes_campo">
              <label>Correo electrónico</label>
              <input type="email" placeholder="tu@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <button type="submit" className="ajustes_boton_guardar">Guardar cambios</button>
          </form>
        </section>

        <section className="ajustes_seccion">
          <h2>Seguridad</h2>
          <form onSubmit={cambiarPassword}>
            <div className="ajustes_campo">
              <label>Contraseña actual</label>
              <input type="password" placeholder="••••••••" value={pass.actual}
                onChange={(e) => setPass({ ...pass, actual: e.target.value })} />
            </div>
            <div className="ajustes_campo">
              <label>Nueva contraseña</label>
              <input type="password" placeholder="••••••••" value={pass.nueva}
                onChange={(e) => setPass({ ...pass, nueva: e.target.value })} />
            </div>
            <div className="ajustes_campo">
              <label>Repetir nueva contraseña</label>
              <input type="password" placeholder="••••••••" value={pass.repetir}
                onChange={(e) => setPass({ ...pass, repetir: e.target.value })} />
            </div>
            <button type="submit" className="ajustes_boton_guardar">Cambiar contraseña</button>
          </form>
        </section>

        <section className="ajustes_seccion ajustes_peligro">
          <h2>Zona de peligro</h2>
          <p>Esta acción eliminará tu cuenta y todos tus datos de forma permanente.</p>
          <button className="ajustes_boton_peligro" onClick={eliminarCuenta}>Eliminar cuenta</button>
        </section>

      </div>
    </div>
  )
}
