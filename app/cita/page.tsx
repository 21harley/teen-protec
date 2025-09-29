'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import CalendarViewPsicologo from "@/components/calendarViewPsicologo/calendarView"
import CalendarViewSecretaria from "@/components/calendarViewSecretaria/calendarView"
import CalendarViewUsuario from "@/components/calendarViewUsuario/calendarView"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Cita() {
const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null // o un loader mientras se carga
  }

  const storageManager = new StorageManager('local')
  const data = storageManager.load<UsuarioInfo>('userData')

  if(data){
    //console.log(data);
    switch(data.tipoUsuario.nombre){
      case "administrador":
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
            <CalendarViewSecretaria />
          </section>
        )
      case "psicologo":
        return (
          <>
            {/*
             <PsychologistTest/>
            */}
            <section className="_color_four h-auto min-h-[80dvh] grid place-items-center"></section>
            <CalendarViewPsicologo usuario={data} />
          </>
        )
      case "secretaria":
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
            <CalendarViewSecretaria />
          </section>
        )
      case "usuario": case "adolecente":
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <CalendarViewUsuario usuario={data}/>
          </section>
        )
    }
  } else {
    router.push("/")
    return null
  }
}