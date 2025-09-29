'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import CrudTest from "@/components/crudTest/crudTest";
//import PsychologistTest from "@/components/psychologistTest/psychologistTest";
import PsychologistTestPlantilla from "@/components/psychologistTestPlantilla/psychologistTestPlantilla";
import UserTest from "@/components/testUser/testUser";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useUserStore from "../store/store";

export default function Test(){
  const user = useUserStore((state) => state.user)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  const storageManager = new StorageManager('local');
  let data = storageManager.load<UsuarioInfo>('userData');

  useEffect(() => {
    setIsClient(true)
  }, [])

    useEffect(()=>{
    data = storageManager.load<UsuarioInfo>('userData')
  },[user])
  
  
  if (!isClient) {
    return null // o un loader mientras se carga
  }

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
    console.log("LLamada de salida.");
    router.push("/");
    router.refresh();
    return(
      <>
       <div>
        cargando...
       </div>
      </>
    )
  }
}


