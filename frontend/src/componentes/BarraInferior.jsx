import MenuHamburguesa from "./MenuHamburguesa";
import '../servicios/script'

export default function BarraInferior(){

    return(
        <>
            <div className="barra_inferior">
                <MenuHamburguesa className={"emoji"} img={"./public/images/emojis.svg"} arrImg={["./public/images/hogar.svg", "./public/images/llamada-telefonica.svg"]}/>
                <MenuHamburguesa className={"teclado"} img={"./public/images/teclado.svg"} arrImg={["./public/images/hogar.svg", "./public/images/llamada-telefonica.svg"]}/>
                <MenuHamburguesa className={"adjuntar"} img={"./public/images/adjuntar.svg"} arrImg={["./public/images/hogar.svg", "./public/images/llamada-telefonica.svg"]}/>
                <input type="text" className="input_text" id="campo"/>
                <button className="enviar">
                    <img className="enviar_imagen" src="./public/images/enviar.svg"/>
                </button>
                <img className="microfono" src="./public/images/microfono-circular-apagado.svg"></img>
            </div>
        </>
    )
}