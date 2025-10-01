'use client'
import { StorageManager } from "@/app/lib/storageManager"
import useUserStore from "../store/store";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { UsuarioInfo } from "./../../app/types/user"
import RegistroPsicologo from "@/components/registroPsicologo/registroPsicologo";
import RegistroAdmin from "@/components/registroAmin/registroAmin";
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Registro() {
  const router = useRouter();
  const {user,isLogout} = useUserStore();


    useEffect(() => {
    if (!user) {
      router.push("/");
      router.refresh();
    }
  }, [ user ])

  if (isLogout) {
    return (
      <LoadingCar redirect={isLogout}></LoadingCar>
    );
  }

  // Determine which alert to show based on user type
  switch(user?.id_tipo_usuario) {
    case 1:
      return (
        <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          <RegistroAdmin usuario={user}  />
        </section>
      );
    case 2:
      return (
        <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          <RegistroPsicologo usuario={user} />
        </section>
      );
    case 5:
      return(
        <>
          <h1>Registro secretaria</h1>
        </>
      )
    case 4:case 3:default:
        return  <LoadingCar redirect={true}></LoadingCar>;
  }
}