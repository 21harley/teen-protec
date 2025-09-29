import Image from "next/image"; 

export default function Cart_Home_Mini() {
  return(
    <div className="p-4 max-w-[400px] mx-auto flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Obtén información valiosa.</h2>
        <div className="flex flex-col items-center gap-4 p-4 _color_seven rounded-[10px]">
             <p className="indent-5"> 
      Sobre tu bienestar emocional. Nuestro estudio de depresión te proporcionará una perspectiva útil sobre cómo te estás sintiendo. ¡Empieza ahora!            </p>
        </div>
    </div>
  )
}