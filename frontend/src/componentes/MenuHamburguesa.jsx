import { useRef, useEffect } from 'react'
import './MenuHamburguesa.css'

export default function MenuHamburguesa({ className, img, opciones = [] }) {
  const ref = useRef(null)
  let id = 0

  useEffect(() => {
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        ref.current.open = false
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleOpcion(funcion) {
    funcion()
    ref.current.open = false
  }

  return (
    <details ref={ref} className={className || ''}>
      <summary><img src={img} /></summary>
      <div className="dropdown">
        {opciones.map((opcion) => (
          <button key={id++} onClick={() => handleOpcion(opcion.funcion)}>
            {opcion.texto}
          </button>
        ))}
      </div>
    </details>
  )
}
