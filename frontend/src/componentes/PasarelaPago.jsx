import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { buildUrl } from '../servicios/peticiones'
import './PasarelaPago.css'

let stripePromise = null

function FormularioPago({ plan, onExito, onCancelar }) {
  const stripe = useStripe()
  const elements = useElements()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  async function pagar(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcesando(true)
    setError(null)

    const { error: errorPago, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (errorPago) {
      setError(errorPago.message || 'No se ha podido procesar el pago.')
      setProcesando(false)
      return
    }
    if (paymentIntent?.status === 'succeeded') {
      setExito(true)
      setTimeout(() => onExito(), 1800)
    } else {
      setError('El pago no se ha completado.')
      setProcesando(false)
    }
  }

  if (exito) {
    return (
      <div className="pasarela_exito">
        <div className="pasarela_exito_icono">✓</div>
        <h2>¡Pago completado!</h2>
        <p>Plan <strong>{plan.nombre}</strong> activado correctamente.</p>
      </div>
    )
  }

  return (
    <>
      <div className="pasarela_header">
        <div>
          <h2>Completar pago</h2>
          <p className="pasarela_subtitulo">Modo de prueba de Stripe — no se realizará ningún cargo real</p>
        </div>
        {!procesando && <button className="pasarela_cerrar" onClick={onCancelar}>✕</button>}
      </div>

      <div className="pasarela_resumen">
        <span className="pasarela_plan_nombre">{plan.nombre}</span>
        <span className="pasarela_plan_precio">{plan.precio}</span>
      </div>

      <form className="pasarela_form" onSubmit={pagar}>
        <PaymentElement />
        {error && <p className="pasarela_error">{error}</p>}
        <button type="submit" className="pasarela_boton" disabled={!stripe || procesando}>
          {procesando
            ? <span className="pasarela_spinner">Procesando<span>.</span><span>.</span><span>.</span></span>
            : `🔒 Pagar ${plan.precio}`
          }
        </button>
      </form>
    </>
  )
}

export default function PasarelaPago({ plan, onExito, onCancelar }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(buildUrl('api/usuarios/crear-payment-intent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ plan: plan.id })
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (!stripePromise) stripePromise = loadStripe(data.publishableKey)
        setClientSecret(data.clientSecret)
      })
      .catch(() => setError('No se ha podido iniciar el pago. Inténtalo de nuevo.'))
  }, [plan.id])

  return (
    <div className="pasarela_overlay" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className="pasarela_modal">
        {error ? (
          <>
            <div className="pasarela_header">
              <h2>Error</h2>
              <button className="pasarela_cerrar" onClick={onCancelar}>✕</button>
            </div>
            <p className="pasarela_error">{error}</p>
          </>
        ) : !clientSecret ? (
          <p className="pasarela_cargando">Preparando el pago...</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <FormularioPago plan={plan} onExito={onExito} onCancelar={onCancelar} />
          </Elements>
        )}
      </div>
    </div>
  )
}
