'use client'
import { StorageManager } from "@/app/lib/storageManager"
import UserAlert from "@/components/alertUser/userAlert";
import CrudAlert from "@/components/crudAlert/crudAlert";
import LayoutPage from "@/components/layoutPage/layoutPage";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { AuthResponse } from "./../types/user"

export default function Alert(){
     const [isClient, setIsClient] = useState(false)
     const router = useRouter()
   
     useEffect(() => {
       setIsClient(true)
     }, [])
   
     if (!isClient) {
       return null // o un loader mientras se carga
     }

    const storageManager = new StorageManager('local')
    const data = storageManager.load<AuthResponse>('userData')


  if(data){
    switch(data.user.tipoUsuario.nombre){
    case "administrador":
        return(
        <>
        <LayoutPage>
         <CrudAlert/>
        </LayoutPage>
        </>
        )
    case "usuario":case "adolecente":case "psicologo":
       return(
        <>
         <LayoutPage>
          <UserAlert/>
         </LayoutPage>
        </>
       )
    
    }
  }else{
   router.push("/")
   return null
  }

}