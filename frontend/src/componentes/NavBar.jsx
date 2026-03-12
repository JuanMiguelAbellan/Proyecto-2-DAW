import MenuHamburguesa from "./MenuHamburguesa";

export default function NavBar(){
    
    return (
        <>
            <nav className="navbar">
                <div className="menu_izq">
                    <img src="./public/images/iadocs_logo.svg" alt="Logotipo de la empresa" className="img_nav" id="logo"
                    onClick={()=>{
                        //Landing
                    }}/>
                    {/* <MenuHamburguesa className={"menu_hamburguesa"} img="./public/images/menu-hamburguesa.svg" opciones={[
                        {texto: "Opción 1", funcion: () => console.log("Opción 1 seleccionada")},
                        {texto: "Opción 2", funcion: () => console.log("Opción 2 seleccionada")},
                        {texto: "Opción 3", funcion: () => console.log("Opción 3 seleccionada")}
                    ]}></MenuHamburguesa> */}
                </div>
                <div className="menu_drc">
                    <img src="./public/images/accesibilidad.svg" className="img_nav"
                    onClick={()=>{
                        
                    }}></img>
                    <img src="./public/images/luna.svg" className="img_nav" id="luna"
                    onClick={()=>{

                    }}></img>
                    {/* <MenuHamburguesa className={"menu_ajustes"} img="./public/images/ajustes.svg" opciones={[
                        {texto: "Ajuste 1", funcion: () => console.log("Ajuste 1 seleccionado")},
                        {texto: "Ajuste 2", funcion: () => console.log("Ajuste 2 seleccionado")},
                        {texto: "Ajuste 3", funcion: () => console.log("Ajuste 3 seleccionado")}
                    ]}></MenuHamburguesa> */}
                </div>
            </nav>
        </>
    )
}