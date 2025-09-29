'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import CrudTest from "@/components/crudTest/crudTest";
//import PsychologistTest from "@/components/psychologistTest/psychologistTest";
import PsychologistTestPlantilla from "@/components/psychologistTestPlantilla/psychologistTestPlantilla";
import UserTest from "@/components/testUser/testUser";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Test(){
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
            <CrudTest/>
        )
      case "psicologo":
        return (
          <>
            {/*
             <PsychologistTest/>
            */}
            <PsychologistTestPlantilla/>
          </>
        )
      case "usuario": case "adolecente":
        return (
            <UserTest/>
        )
    }
  } else {
    router.push("/")
    return null
  }
}


