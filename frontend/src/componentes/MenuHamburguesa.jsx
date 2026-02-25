
export default function MenuHamburguesa({className, img, arrImg}){
    let id=0
    return(
        <>
                <details className={className}>
                    <summary><img src={img}/></summary>
                    <div className="dropdown">
                        {arrImg.map((i)=>{
                            id++
                            return <img src={i} key={id}></img>
                        })}
                    </div>
                </details>
        </>
    )
}