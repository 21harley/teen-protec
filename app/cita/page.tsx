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
          <CalendarViewSecretaria />
        )
      case "psicologo":
        return (
          <>
            {/*
             <PsychologistTest/>
            */}
            <CalendarViewPsicologo usuario={data} />
          </>
        )
      case "secretaria":
        return (
           <CalendarViewSecretaria />
        )
      case "usuario": case "adolecente":
        return (
            <CalendarViewUsuario usuario={data}/>
        )
    }
  } else {
    router.push("/")
    return null
  }
}