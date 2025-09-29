'use client'
import { StorageManager } from "@/app/lib/storageManager"
import useUserStore from "../store/store";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { UsuarioInfo } from "./../../app/types/user"
import RegistroPsicologo from "@/components/registroPsicologo/registroPsicologo";
import RegistroAdmin from "@/components/registroAmin/registroAmin";

export default function Registro() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const storeUser = useUserStore((state) => state.user);
  const [user, setUser] = useState<UsuarioInfo | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      // First try with store
      if (storeUser) {
        setUser(storeUser);
        setLoading(false);
        return;
      }

      // If not in store, check localStorage
      const storageManager = new StorageManager('local');
      const data = storageManager.load<UsuarioInfo>('userData');
      
      if (data) {
        setUser(data);
        setLoading(false);
      } else {
        // Redirect if no authenticated user
        router.push("/");
      }
    };

    loadUserData();
  }, [storeUser, router]);

  if (loading) {
    return (
       <>
        <div className="flex justify-center items-center h-64">
          <p>Cargando...</p>
        </div>
        </>
    );
  }

  if (!user) {
    // The useEffect already handles redirection
    return null;
  }

  // Determine which alert to show based on user type
  switch(user.tipoUsuario?.nombre ?? "usuario") {
    case "administrador":
      return (
          <RegistroAdmin usuario={user}  />
      );
    case "psicologo":
      return (
         <RegistroPsicologo usuario={user} />
      );
    case "secretaria":
      return(
        <>
          <h1>Registro secretaria</h1>
        </>
      )
      
    case "usuario":
    case "adolecente":  
    default:
      router.push("/");
      return null;
  }
}