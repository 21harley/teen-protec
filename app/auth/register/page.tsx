'use client'

import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import FormUser from "@/components/formUser/formUser";
import { useRouter } from "next/navigation";
import { StorageManager } from "@/app/lib/storageManager";
import useUserStore from "./../../../app/store/store";
import { UsuarioInfo } from "./../../types/user";
import { useEffect, useState } from "react";

export default function Register() {
  const router = useRouter();
  const { user: storeUser } = useUserStore(); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveSession = () => {
      if (storeUser) {
        router.push("/");
        return;
      }

      const storageManager = new StorageManager('local');
      const userData = storageManager.load<UsuarioInfo>('userData');
      if (userData) {
        router.push("/");
        return;
      }

      setLoading(false);
    };

    checkActiveSession();
  }, [storeUser, router]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80dvh]">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="_color_four h-full min-h-[84dvh] grid place-items-center p-5">
          <FormUser />
        </section>
      </main>
      <Footer />
    </>
  );
}