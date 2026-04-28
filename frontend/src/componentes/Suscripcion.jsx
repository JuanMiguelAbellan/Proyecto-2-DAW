export default function Suscripcion({ onVolver }) {
  return (
    <div className="suscripcion">
      <div className="suscripcion_header">
        <button className="suscripcion_volver" onClick={onVolver}>← Volver</button>
        <h1>Elige tu plan</h1>
        <p>Procesa tus documentos con inteligencia artificial</p>
      </div>

      <div className="suscripcion_planes">

        <div className="plan">
          <h2>Free</h2>
          <p className="plan_precio">0 €<span>/mes</span></p>
          <ul>
            <li>5 documentos al mes</li>
            <li>Hasta 10 MB por documento</li>
            <li>Simplificación y resumen</li>
            <li className="plan_no">Marca de agua en descargas</li>
            <li className="plan_no">Sin prioridad en cola</li>
          </ul>
          <button className="plan_boton plan_boton_actual">Plan actual</button>
        </div>

        <div className="plan plan_destacado">
          <span className="plan_etiqueta">Más popular</span>
          <h2>Pro</h2>
          <p className="plan_precio">4,99 €<span>/mes</span></p>
          <ul>
            <li>50 documentos al mes</li>
            <li>Hasta 50 MB por documento</li>
            <li>Simplificación y resumen</li>
            <li>Sin marca de agua</li>
            <li>Prioridad en cola</li>
          </ul>
          <button className="plan_boton plan_boton_pro">Suscribirse</button>
        </div>

        <div className="plan">
          <span className="plan_etiqueta plan_etiqueta_ahorro">Ahorra 16%</span>
          <h2>Pro Anual</h2>
          <p className="plan_precio">49,90 €<span>/año</span></p>
          <ul>
            <li>50 documentos al mes</li>
            <li>Hasta 50 MB por documento</li>
            <li>Simplificación y resumen</li>
            <li>Sin marca de agua</li>
            <li>Prioridad en cola</li>
          </ul>
          <button className="plan_boton plan_boton_pro">Suscribirse</button>
        </div>

      </div>
    </div>
  )
}
