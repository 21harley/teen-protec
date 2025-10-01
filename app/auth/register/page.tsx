'use client'
import FormUser from "@/components/formUser/formUser";
import { useRouter } from "next/navigation";
import useUserStore from "./../../../app/store/store";
import { useEffect, useState } from "react";
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Register() {
  const router = useRouter();
  const { user,isLoading, } = useUserStore(); 

  useEffect(() => {
      if (user) {
        router.push("/");
        router.refresh();
        return;
      }
  }, [user]);

  if (isLoading) {
    return (
      <LoadingCar redirect={false}></LoadingCar>
    );
  }

  if(!user){
    return (
    <>
      <main>
        <section className="_color_four h-full min-h-[84dvh] grid place-items-center p-5">
          <FormUser isAuthRegister={true} />
        </section>
      </main>
    </>
  );
  }else{
    return(
      <LoadingCar redirect={true}></LoadingCar>
    )
  }
}