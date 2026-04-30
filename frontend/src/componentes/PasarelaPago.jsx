import { useState } from 'react'
import './PasarelaPago.css'

export default function PasarelaPago({ plan, onExito, onCancelar }) {
  const [form, setForm] = useState({ nombre: '', numero: '', expiry: '', cvv: '' })
  const [estado, setEstado] = useState('idle')

  function formatNumero(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  function formatExpiry(val) {
    const nums = val.replace(/\D/g, '').slice(0, 4)
    return nums.length > 2 ? `${nums.slice(0, 2)}/${nums.slice(2)}` : nums
  }

  function pagar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || form.numero.replace(/\s/g, '').length < 16 || form.expiry.length < 5 || form.cvv.length < 3) return
    setEstado('procesando')
    setTimeout(() => {
      setEstado('exito')
      setTimeout(() => onExito(), 1800)
    }, 2000)
  }

  return (
    <div className="pasarela_overlay" onClick={(e) => e.target === e.currentTarget && estado === 'idle' && onCancelar()}>
      <div className="pasarela_modal">
        {estado === 'exito' ? (
          <div className="pasarela_exito">
            <div className="pasarela_exito_icono">✓</div>
            <h2>¡Pago completado!</h2>
            <p>Plan <strong>{plan.nombre}</strong> activado correctamente.</p>
          </div>
        ) : (
          <>
            <div className="pasarela_header">
              <div>
                <h2>Completar pago</h2>
                <p className="pasarela_subtitulo">Pago simulado — no se realizará ningún cargo</p>
              </div>
              {estado === 'idle' && (
                <button className="pasarela_cerrar" onClick={onCancelar}>✕</button>
              )}
            </div>

            <div className="pasarela_resumen">
              <span className="pasarela_plan_nombre">{plan.nombre}</span>
              <span className="pasarela_plan_precio">{plan.precio}</span>
            </div>

            <form className="pasarela_form" onSubmit={pagar}>
              <div className="pasarela_campo">
                <label>Titular de la tarjeta</label>
                <input
                  type="text"
                  placeholder="Nombre Apellidos"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  disabled={estado === 'procesando'}
                />
              </div>
              <div className="pasarela_campo">
                <label>Número de tarjeta</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: formatNumero(e.target.value) })}
                  disabled={estado === 'procesando'}
                />
              </div>
              <div className="pasarela_fila">
                <div className="pasarela_campo">
                  <label>Caducidad</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={form.expiry}
                    onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                    disabled={estado === 'procesando'}
                  />
                </div>
                <div className="pasarela_campo">
                  <label>CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={form.cvv}
                    onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    disabled={estado === 'procesando'}
                  />
                </div>
              </div>
              <button type="submit" className="pasarela_boton" disabled={estado === 'procesando'}>
                {estado === 'procesando'
                  ? <span className="pasarela_spinner">Procesando<span>.</span><span>.</span><span>.</span></span>
                  : `🔒 Pagar ${plan.precio}`
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
