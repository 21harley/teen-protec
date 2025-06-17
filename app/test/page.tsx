'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { AuthResponse } from "./../types/user"
import CrudTest from "@/components/crudTest/crudTest";
import PsychologistTest from "@/components/psychologistTest/psychologistTest";
import UserTest from "@/components/userTest/userTest";
import LayoutPage from "@/components/layoutPage/layoutPage";

export default function Test(){
  const storageManager = new StorageManager('local');
  const data = storageManager.load<AuthResponse>('userData');
   
  if(data){
    switch(data.user.tipoUsuario.nombre){
    case "administrador":
        return(
        <>
        <LayoutPage>
           <CrudTest/>
        </LayoutPage>
        </>
        )
    case "psicologo":
       return(
        <>
         <LayoutPage>
            <PsychologistTest/>
         </LayoutPage>
        </>
       )
    case "usuario":case "adolecente":
        return(
        <>
         <LayoutPage>
            <UserTest/>
         </LayoutPage>
        </>
       )
    }
  }else{
    window.location.href="/"
  }

}