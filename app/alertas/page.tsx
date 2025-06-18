'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { AuthResponse } from "./../types/user"
import UserAlert from "@/components/alertUser/userAlert";
import CrudAlert from "@/components/crudAlert/crudAlert";
import LayoutPage from "@/components/layoutPage/layoutPage";
import useUserStore from "../store/store";
import { LoginResponse } from "../api/type";

export default function Alert(){
   let { user } = useUserStore();
   console.log(user);
  if(!user){
     const storageManager = new StorageManager('local');
     const data = storageManager.load<LoginResponse>('userData');
     user = data?.user ?? null
  }
   
  if(user && user.tipoUsuario && user.tipoUsuario.nombre){
    switch(user.tipoUsuario.nombre){
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