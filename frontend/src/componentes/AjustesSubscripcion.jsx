import { useState, useEffect } from 'react'
import { get, pacth } from '../servicios/peticiones'
import PasarelaPago from './PasarelaPago'
import './Ajustes.css'

const PLANES = [
  { id: 'gratis', nombre: 'Gratuito', precio: '0 €/mes', docs: '5 documentos/mes', mensajes: '50 mensajes/mes' },
  { id: 'pro', nombre: 'Pro', precio: '9,99 €/mes', docs: '100 documentos/mes', mensajes: 'Mensajes ilimitados' },
  { id: 'empresa', nombre: 'Empresa', precio: '24,99 €/mes', docs: 'Documentos ilimitados', mensajes: 'Mensajes ilimitados' },
]

export default function AjustesSubscripcion({ onVolver, onPlanCambiado }) {
  const [planActual, setPlanActual] = useState('gratis')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const [planPendiente, setPlanPendiente] = useState(null)

  useEffect(() => {
    get('api/usuarios/me',
      (data) => { setPlanActual(data.planSubscripcion || 'gratis'); setCargando(false) },
      () => setCargando(false)
    )
  }, [])

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function confirmarPago(plan) {
    setGuardando(true)
    pacth('api/usuarios/subscripcion', { plan: plan.id },
      () => {
        setGuardando(false)
        setPlanActual(plan.id)
        setPlanPendiente(null)
        onPlanCambiado?.(plan.id)
        mostrarToast(`Plan ${plan.nombre} activado correctamente`)
      },
      () => {
        setGuardando(false)
        setPlanPendiente(null)
        mostrarToast('Error al activar el plan')
      }
    )
  }

  function cancelarSubscripcion() {
    if (planActual === 'gratis') { mostrarToast('Ya estás en el plan gratuito'); return }
    if (!window.confirm('¿Cancelar tu subscripción? Pasarás al plan gratuito.')) return
    setGuardando(true)
    pacth('api/usuarios/subscripcion', { plan: 'gratis' },
      () => {
        setGuardando(false)
        setPlanActual('gratis')
        onPlanCambiado?.('gratis')
        mostrarToast('Subscripción cancelada. Plan gratuito activado.')
      },
      () => { setGuardando(false); mostrarToast('Error al cancelar') }
    )
  }

  const planInfo = PLANES.find(p => p.id === planActual)

  if (cargando) return <div className="ajustes_pagina"><p style={{ padding: '2rem', fontFamily: 'var(--family-font-conversacion)', color: 'var(--color-text)' }}>Cargando...</p></div>

  return (
    <div className="ajustes_pagina">
      {toast && <div className="ajustes_toast">{toast}</div>}
      {planPendiente && (
        <PasarelaPago
          plan={planPendiente}
          onExito={() => confirmarPago(planPendiente)}
          onCancelar={() => setPlanPendiente(null)}
        />
      )}

      <div className="ajustes_header">
        <button className="ajustes_volver" onClick={onVolver}>← Volver</button>
        <h1>Subscripción</h1>
      </div>

      <div className="ajustes_contenido">

        <section className="ajustes_seccion">
          <h2>Plan actual</h2>
          <div className="ajustes_plan_actual">
            <span style={{ fontFamily: 'var(--family-font-conversacion)', color: 'var(--color-text)' }}>
              {planInfo?.nombre}
            </span>
            <span className="ajustes_plan_badge">{planActual === 'gratis' ? 'GRATIS' : 'ACTIVO'}</span>
          </div>
          <div className="ajustes_info_fila"><span>Documentos</span><span>{planInfo?.docs}</span></div>
          <div className="ajustes_info_fila"><span>Mensajes</span><span>{planInfo?.mensajes}</span></div>
        </section>

        <section className="ajustes_seccion">
          <h2>Cambiar plan</h2>
          {PLANES.map(plan => (
            <div key={plan.id} className={`ajustes_plan_opcion${plan.id === planActual ? ' plan_seleccionado' : ''}`}>
              <div>
                <strong style={{ fontFamily: 'var(--family-font-conversacion)', color: 'var(--color-text)' }}>{plan.nombre}</strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: 'var(--font-size-menu)', fontFamily: 'var(--family-font-conversacion)', color: 'hsla(0,0%,50%,1)' }}>
                  {plan.docs} · {plan.mensajes}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontFamily: 'var(--family-font-conversacion)', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{plan.precio}</span>
                {plan.id === planActual
                  ? <span className="ajustes_plan_badge">Actual</span>
                  : <button className="ajustes_boton_guardar" onClick={() => setPlanPendiente(plan)} disabled={guardando}>
                      {guardando ? '...' : 'Elegir'}
                    </button>
                }
              </div>
            </div>
          ))}
        </section>

        {planActual !== 'gratis' && (
          <section className="ajustes_seccion ajustes_peligro">
            <h2>Cancelar subscripción</h2>
            <p>Pasarás al plan gratuito al final del período de facturación.</p>
            <button className="ajustes_boton_peligro" onClick={cancelarSubscripcion} disabled={guardando}>
              Cancelar subscripción
            </button>
          </section>
        )}

      </div>
    </div>
  )
}
