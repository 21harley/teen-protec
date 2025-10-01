'use client'
import UserAlert from "@/components/alertUser/userAlert";
import CrudAlert from "@/components/crudAlert/crudAlert";
import useUserStore from "../store/store";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Alert() {
  const user = useUserStore((state) => state.user)
  const fetchAlertCount = useUserStore((state)=> state.fetchAlertCount);
  const router = useRouter();
  const loading = useUserStore((state)=>state.isLoading);
  fetchAlertCount()//actualizar el total de alertas

  // Redirección en useEffect
  useEffect(() => {
    if (!user) {
      router.push("/");
      router.refresh();
    }
  }, [ user ])

  if (loading) {
    return (
      <LoadingCar redirect={false}></LoadingCar>
    );
  }

  if (!user) {
    // The useEffect already handles redirection
    return <LoadingCar redirect={true}></LoadingCar>;
  }

  // Determine which alert to show based on user type
  switch(user.id_tipo_usuario) {
    case 1:
      return (
          <CrudAlert/>
      );
    case 2:case 3:case 4:case 5:
      return (
          <UserAlert/>
      );
    default:
      return  <LoadingCar redirect={true}></LoadingCar>;
  }
}