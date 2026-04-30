import { useState, useEffect } from 'react'
import { get, post } from '../servicios/peticiones'
import './Ajustes.css'

const TAMANOS = {
  'pequeño':   { chat: '13px', menu: '11px' },
  'normal':    { chat: '16px', menu: '14px' },
  'grande':    { chat: '19px', menu: '17px' },
  'muy grande':{ chat: '22px', menu: '20px' },
}

const PALETAS = {
  'defecto':   {},
  'océano':    { '--background-color-body': 'hsla(200,60%,85%,1)', '--background-color-menu': 'hsla(200,40%,95%,1)', '--background-color-chats': 'hsla(210,60%,55%,1)', '--background-color-text-user': 'hsla(220,60%,55%,1)', '--background-color-text-ia': 'hsla(190,60%,45%,1)', '--color-text': '#0a1a2a', '--button-color': '#0a3a6a' },
  'bosque':    { '--background-color-body': 'hsla(130,35%,82%,1)', '--background-color-menu': 'hsla(130,20%,93%,1)', '--background-color-chats': 'hsla(140,45%,45%,1)', '--background-color-text-user': 'hsla(150,45%,45%,1)', '--background-color-text-ia': 'hsla(120,40%,38%,1)', '--color-text': '#0a1f0a', '--button-color': '#1a4a1a' },
  'atardecer': { '--background-color-body': 'hsla(30,60%,88%,1)', '--background-color-menu': 'hsla(30,30%,95%,1)', '--background-color-chats': 'hsla(20,60%,55%,1)', '--background-color-text-user': 'hsla(280,40%,55%,1)', '--background-color-text-ia': 'hsla(15,65%,48%,1)', '--color-text': '#2a1000', '--button-color': '#7a2000' },
  'lavanda':   { '--background-color-body': 'hsla(270,40%,88%,1)', '--background-color-menu': 'hsla(270,20%,95%,1)', '--background-color-chats': 'hsla(260,45%,55%,1)', '--background-color-text-user': 'hsla(280,50%,50%,1)', '--background-color-text-ia': 'hsla(250,40%,48%,1)', '--color-text': '#1a0a2a', '--button-color': '#3a0a6a' },
}

const FUENTES = {
  'Verdana':    'Verdana, Geneva, Tahoma, sans-serif',
  'Roboto':     "'Roboto', sans-serif",
  'Georgia':    "Georgia, 'Times New Roman', serif",
  'Open Sans':  "'Open Sans', sans-serif",
  'Courier New':'Courier New, Courier, monospace',
}

export default function AjustesAccesibilidad({ onVolver }) {
  const [tamano, setTamano] = useState('normal')
  const [altoContraste, setAltoContraste] = useState(false)
  const [reducirMovimiento, setReducirMovimiento] = useState(false)
  const [idioma, setIdioma] = useState('es')
  const [toast, setToast] = useState(null)
  const [paleta, setPaleta] = useState('defecto')
  const [fuente, setFuente] = useState('Verdana')

  useEffect(() => {
    get('api/usuarios/me',
      (data) => {
        const prefs = data.preferencias || {}
        if (prefs.tamano && TAMANOS[prefs.tamano]) setTamano(prefs.tamano)
        if (prefs.altoContraste !== undefined) setAltoContraste(prefs.altoContraste)
        if (prefs.reducirMovimiento !== undefined) setReducirMovimiento(prefs.reducirMovimiento)
        if (prefs.idioma) setIdioma(prefs.idioma)
        if (prefs.paleta) setPaleta(prefs.paleta)
        if (prefs.fuente) setFuente(prefs.fuente)
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

  useEffect(() => {
    const vars = PALETAS[paleta] || {}
    Object.entries(PALETAS['defecto']).forEach(([k]) => document.documentElement.style.removeProperty(k))
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
  }, [paleta])

  useEffect(() => {
    document.documentElement.style.setProperty('--family-font-conversacion', FUENTES[fuente] || FUENTES['Verdana'])
  }, [fuente])

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function guardar() {
    const prefs = { tamano, altoContraste, reducirMovimiento, idioma, paleta, fuente }
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
          <h2>Paleta de colores</h2>
          <div className="ajustes_paletas">
            {Object.keys(PALETAS).map((p) => (
              <button
                key={p}
                className={`ajustes_paleta_btn${paleta === p ? ' activo' : ''}`}
                onClick={() => setPaleta(p)}
                style={PALETAS[p]['--background-color-chats'] ? { backgroundColor: PALETAS[p]['--background-color-chats'] } : {}}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="ajustes_seccion">
          <h2>Tipografía</h2>
          <div className="ajustes_radio_grupo">
            {Object.keys(FUENTES).map((f) => (
              <button
                key={f}
                className={`ajustes_radio${fuente === f ? ' activo' : ''}`}
                style={{ fontFamily: FUENTES[f] }}
                onClick={() => setFuente(f)}
              >
                {f}
              </button>
            ))}
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
