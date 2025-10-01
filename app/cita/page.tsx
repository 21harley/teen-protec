'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import CalendarViewPsicologo from "@/components/calendarViewPsicologo/calendarView"
import CalendarViewSecretaria from "@/components/calendarViewSecretaria/calendarView"
import CalendarViewUsuario from "@/components/calendarViewUsuario/calendarView"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useUserStore from "../store/store"
import LoadingCar from "@/components/loadingCar/loadingCar"

export default function Cita() {
const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const {user,isLogout} = useUserStore();

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null // o un loader mientras se carga
  }

 if(isLogout){
    return  <LoadingCar redirect={isLogout}></LoadingCar>;
 }

  if(user?.id){
    //console.log(data);
    switch(user?.id_tipo_usuario){
      case 1:
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
            <CalendarViewSecretaria />
          </section>
        )
      case 2:
        return (
          <>
            {/*
             <PsychologistTest/>
            */}
            <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <CalendarViewPsicologo usuario={user} />
            </section>
          </>
        )
      case 5:
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
            <CalendarViewSecretaria />
          </section>
        )
      case 6: case 4:
        return (
          <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <CalendarViewUsuario usuario={user}/>
          </section>
        )
    }
  } else {
    return  <LoadingCar redirect={true}></LoadingCar>;
  }
}