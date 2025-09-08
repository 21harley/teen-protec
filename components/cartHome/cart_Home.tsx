import Image from "next/image"; 
import svg from "./../../app/public/logos/logo_texto.svg";

export default function Cart_Home() {
  return(
    <div className="p-4 max-w-[400px] mx-auto flex flex-col items-center justify-center gap-4 _color_seven rounded-[10px]">
        <div>
           <Image
              src={svg}
              width={180}
              height={90}
              alt="Picture of the author"
           ></Image>
        </div>
        <div className="flex flex-col items-center gap-4">
            <p className="indent-5">
                Sabemos que el apoyo y los recursos son cruciales para tu práctica. Si buscas herramientas para mejorar la atención a pacientes y optimizar tu trabajo diario, nuestra plataforma está diseñada para ti.
            </p>
             <p className="indent-5"> 
                En PsicoTest te ofrecemos un espacio digital con recursos exclusivos y soporte para potenciar tu labor. Juntos, podemos marcar la diferencia.
            </p>
        </div>
    </div>
  )
}



