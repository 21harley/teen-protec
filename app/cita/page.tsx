'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import LayoutPage from "@/components/layoutPage/layoutPage"
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
          <LayoutPage>
           <CalendarViewSecretaria />
          </LayoutPage>
        )
      case "psicologo":
        return (
          <LayoutPage>
            {/*
             <PsychologistTest/>
            */}
            <CalendarViewPsicologo usuario={data} />
          </LayoutPage>
        )
      case "secretaria":
        return (
          <LayoutPage>
           <CalendarViewSecretaria />
          </LayoutPage>
        )
      case "usuario": case "adolecente":
        return (
          <LayoutPage>
            <CalendarViewUsuario usuario={data}/>
          </LayoutPage>
        )
    }
  } else {
    router.push("/")
    return null
  }
}