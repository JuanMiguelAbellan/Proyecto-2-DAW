
export default function MenuHamburguesa({className, img, opciones = []}){
    let id=0
    return(
        <>
                <details className={`menu_hamburguesa ${className || ''}`}>
                    <summary><img src={img}/></summary>
                    <div className="dropdown">
                        {opciones.map((opcion)=>{
                            return <button key={id++} onClick={()=>{
                                opcion.funcion()
                            }}>{opcion.texto}</button>
                        })}
                    </div>
                </details>
        </>
    )
}