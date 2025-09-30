'use client'
import CrudTest from "@/components/crudTest/crudTest";
import PsychologistTestPlantilla from "@/components/psychologistTestPlantilla/psychologistTestPlantilla";
import UserTest from "@/components/testUser/testUser";
import { useEffect, useState } from "react"
import useUserStore from "../store/store";
import { useRouter } from "next/navigation"
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Test(){
  const user = useUserStore((state) => state.user)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Redirección en useEffect
  useEffect(() => {
    if (!user) {
      router.push("/");
      router.refresh();
    }
  }, [ user ])

  if (!isClient) {
    return <LoadingCar redirect={false}></LoadingCar> // o un loader mientras se carga
  }

  if (!user) {
    return <LoadingCar redirect={true}></LoadingCar>// o un loader mientras redirige
  }

  const renderComponent = () => {
    switch(user.id_tipo_usuario){
      case 1:
        return <CrudTest/>
      case 2:
        return <PsychologistTestPlantilla/>
      case 3: case 4: case 5:
        return <UserTest/>
      default:
        return <LoadingCar redirect={true}></LoadingCar>
    }
  }

  return (
    <>
      {renderComponent()}
    </>
  )
}