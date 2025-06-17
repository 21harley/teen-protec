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
                 Sabemos que la adolescencia puede ser un torbellino de emociones y desafíos. Si sientes que la tristeza o la falta de motivación te están afectando, o si te preocupa tu bienestar emocional, has llegado al lugar indicado. 
            </p>
             <p className="indent-5"> 
                     En TeenProtec te ofrecemos un espacio seguro y herramientas para comprender y gestionar tus emociones, y evaluar tu riesgo de depresión. No estás solo/a.
            </p>
        </div>
    </div>
  )
}
