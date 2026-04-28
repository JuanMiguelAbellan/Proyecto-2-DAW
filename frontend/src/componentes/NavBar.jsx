import MenuHamburguesa from "./MenuHamburguesa"

export default function NavBar({ onSuscripcion, onLogout, temaOscuro, setTemaOscuro }) {

  return (
    <>
      <nav className="navbar">
        <div className="menu_izq">
          <img src="./public/images/iadocs_logo.svg" alt="Logotipo de la empresa" className="img_nav" id="logo" />
          <MenuHamburguesa className={"menu_hamburguesa"} img="./public/images/menu-hamburguesa.svg" opciones={[
            { texto: "Mi suscripción", funcion: onSuscripcion },
            { texto: "Cerrar sesión", funcion: onLogout }
          ]} />
        </div>
        <div className="menu_drc">
          <button className="boton_premium" onClick={onSuscripcion}>✦ Premium</button>
          <img src="./public/images/accesibilidad.svg" className="img_nav" />
          <img
            src={temaOscuro ? "./public/images/sol.svg" : "./public/images/luna.svg"}
            className="img_nav"
            id="luna"
            onClick={() => setTemaOscuro(!temaOscuro)}
          />
          <MenuHamburguesa className={"menu_ajustes"} img="./public/images/ajustes.svg" opciones={[
            { texto: "Mi suscripción", funcion: onSuscripcion },
            { texto: "Cerrar sesión", funcion: onLogout }
          ]} />
        </div>
      </nav>
    </>
  )
}
