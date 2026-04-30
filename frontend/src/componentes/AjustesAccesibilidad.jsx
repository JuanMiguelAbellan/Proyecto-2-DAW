import { useState, useEffect } from 'react'
import { get, post } from '../servicios/peticiones'
import './Ajustes.css'

const TAMANOS = {
  'pequeño':   { chat: '13px', menu: '11px' },
  'normal':    { chat: '16px', menu: '14px' },
  'grande':    { chat: '19px', menu: '17px' },
  'muy grande':{ chat: '22px', menu: '20px' },
}

export default function AjustesAccesibilidad({ onVolver }) {
  const [tamano, setTamano] = useState('normal')
  const [altoContraste, setAltoContraste] = useState(false)
  const [reducirMovimiento, setReducirMovimiento] = useState(false)
  const [idioma, setIdioma] = useState('es')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    get('api/usuarios/me',
      (data) => {
        const prefs = data.preferencias || {}
        if (prefs.tamano && TAMANOS[prefs.tamano]) setTamano(prefs.tamano)
        if (prefs.altoContraste !== undefined) setAltoContraste(prefs.altoContraste)
        if (prefs.reducirMovimiento !== undefined) setReducirMovimiento(prefs.reducirMovimiento)
        if (prefs.idioma) setIdioma(prefs.idioma)
      },
      () => {}
    )
  }, [])

  useEffect(() => {
    const t = TAMANOS[tamano]
    document.documentElement.style.setProperty('--font-size-chat', t.chat)
    document.documentElement.style.setProperty('--font-size-menu', t.menu)
  }, [tamano])

  useEffect(() => {
    document.documentElement.setAttribute('data-contraste', altoContraste ? 'alto' : 'normal')
  }, [altoContraste])

  useEffect(() => {
    document.documentElement.setAttribute('data-movimiento', reducirMovimiento ? 'reducido' : 'normal')
  }, [reducirMovimiento])

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function guardar() {
    const prefs = { tamano, altoContraste, reducirMovimiento, idioma }
    post('api/usuarios/editarPreferencias',
      { nuevasPreferencias: prefs },
      () => mostrarToast('Preferencias guardadas'),
      () => mostrarToast('Error al guardar las preferencias')
    )
  }

  return (
    <div className="ajustes_pagina">
      {toast && <div className="ajustes_toast">{toast}</div>}
      <div className="ajustes_header">
        <button className="ajustes_volver" onClick={onVolver}>← Volver</button>
        <h1>Accesibilidad</h1>
      </div>

      <div className="ajustes_contenido">

        <section className="ajustes_seccion">
          <h2>Texto</h2>
          <div className="ajustes_opcion">
            <span>Tamaño de fuente</span>
            <div className="ajustes_radio_grupo">
              {Object.keys(TAMANOS).map((t) => (
                <button
                  key={t}
                  className={`ajustes_radio${tamano === t ? ' activo' : ''}`}
                  onClick={() => setTamano(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ajustes_seccion">
          <h2>Visualización</h2>
          <div className="ajustes_opcion">
            <label>Alto contraste</label>
            <input
              type="checkbox"
              checked={altoContraste}
              onChange={(e) => setAltoContraste(e.target.checked)}
            />
          </div>
          <div className="ajustes_opcion">
            <label>Reducir movimiento</label>
            <input
              type="checkbox"
              checked={reducirMovimiento}
              onChange={(e) => setReducirMovimiento(e.target.checked)}
            />
          </div>
        </section>

        <section className="ajustes_seccion">
          <h2>Idioma</h2>
          <div className="ajustes_campo">
            <label>Idioma de la interfaz</label>
            <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ca">Català</option>
            </select>
          </div>
          <button className="ajustes_boton_guardar" onClick={guardar}>Guardar preferencias</button>
        </section>

      </div>
    </div>
  )
}
