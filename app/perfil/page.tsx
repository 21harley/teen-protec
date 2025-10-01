'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import useUserStore from "../store/store";
import FormUser from "@/components/formUser/formUser";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Perfil() {
  const router = useRouter();
  const {user,isLogout} = useUserStore();

  const handleSubmit = async (formData: any) => {
    try {
      if (!user) return;

      // Feedback al usuario
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    }
  };



  if ( isLogout) {
    return <LoadingCar redirect={isLogout}></LoadingCar>;
  }

  if(user?.id){
    return (
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <div className="container  px-4 py-8 w-full max-w-[1200px] ">
         <div className="w-full max-w-[1200px] mx-auto flex flex-col justify-center">
          <FormUser 
            user={user} 
            isEdit={true} 
            onSubmit={handleSubmit}
          />
         </div>
        </div>
      </section>
    );
  }else{
    return <LoadingCar redirect={true}></LoadingCar>;
  }
}