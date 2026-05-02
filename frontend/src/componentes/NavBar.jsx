import MenuHamburguesa from './MenuHamburguesa'
import './NavBar.css'

const BADGE_PLAN = {
  gratis:  { texto: '✦ Premium', clase: '' },
  pro:     { texto: '⭐ Pro',     clase: 'boton_plan_pro' },
  empresa: { texto: '🏢 Empresa', clase: 'boton_plan_empresa' },
}

export default function NavBar({ onNavegar, onLogout, temaOscuro, setTemaOscuro, planActual = 'gratis' }) {
  const badge = BADGE_PLAN[planActual] || BADGE_PLAN.gratis

  return (
    <nav className="navbar">
      <div className="menu_izq">
        <img
          src="./public/images/iadocs_logo.svg"
          alt="IADocs"
          className="img_nav"
          id="logo"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavegar('chat')}
        />
        <MenuHamburguesa className="menu_hamburguesa" img="./public/images/menu-hamburguesa.svg" opciones={[
          { texto: 'Mi subscripción', funcion: () => onNavegar('ajustesSubscripcion') },
          { texto: 'Cuenta', funcion: () => onNavegar('cuenta') },
          { texto: 'Mis documentos', funcion: () => onNavegar('documentos') },
          { texto: 'Accesibilidad', funcion: () => onNavegar('accesibilidad') },
          { texto: 'Cerrar sesión', funcion: onLogout },
        ]} />
      </div>
      <div className="menu_drc">
        <button
          className={`boton_premium ${badge.clase}`}
          onClick={() => onNavegar(planActual === 'gratis' ? 'subscripcion' : 'ajustesSubscripcion')}
        >
          {badge.texto}
        </button>
        <img
          src="./public/images/accesibilidad.svg"
          className="img_nav"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavegar('accesibilidad')}
          alt="Accesibilidad"
        />
        <img
          src={temaOscuro ? './public/images/sol.svg' : './public/images/luna.svg'}
          className="img_nav"
          id="luna"
          style={{ cursor: 'pointer' }}
          onClick={() => setTemaOscuro(!temaOscuro)}
          alt="Tema"
        />
        <MenuHamburguesa className="menu_ajustes" img="./public/images/ajustes.svg" opciones={[
          { texto: 'Cuenta', funcion: () => onNavegar('cuenta') },
          { texto: 'Subscripciones', funcion: () => onNavegar('ajustesSubscripcion') },
          { texto: 'Mis documentos', funcion: () => onNavegar('documentos') },
          { texto: 'Accesibilidad', funcion: () => onNavegar('accesibilidad') },
          { texto: 'Cerrar sesión', funcion: onLogout },
        ]} />
      </div>
    </nav>
  )
}
