'use client'
import CrudUser from "@/components/crudUser/crudUser"
import useUserStore from "../store/store";
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Usuarios(){
  const {user,isLogout} = useUserStore();

  if ( isLogout) {
      return <LoadingCar redirect={isLogout}></LoadingCar>;
  }

  if(user?.id){
    return (
      <>
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          <CrudUser/>
      </section>
      </>
    )
  }else{
    return <LoadingCar redirect={true}></LoadingCar>;
  }
 
}