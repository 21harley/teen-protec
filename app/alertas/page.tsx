'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { AuthResponse } from "./../types/user"
import UserAlert from "@/components/alertUser/userAlert";
import CrudAlert from "@/components/crudAlert/crudAlert";
import LayoutPage from "@/components/layoutPage/layoutPage";

export default function Alert(){
  const storageManager = new StorageManager('local');
  const data = storageManager.load<AuthResponse>('userData');
   
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
    window.location.href="/"
  }

}