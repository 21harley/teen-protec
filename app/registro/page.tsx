'use client'
import { StorageManager } from "@/app/lib/storageManager"
import LayoutPage from "@/components/layoutPage/layoutPage";
import useUserStore from "../store/store";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { UsuarioInfo } from "./../../app/types/user"

export default function Alert() {
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
      <LayoutPage>
        <div className="flex justify-center items-center h-64">
          <p>Cargando...</p>
        </div>
      </LayoutPage>
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
        <LayoutPage>
          <h1>Admin registro</h1>
        </LayoutPage>
      );
    case "usuario":
    case "adolecente":
    case "psicologo":
      return (
        <LayoutPage>
         <h1>Registro</h1>
        </LayoutPage>
      );
    case "secretaria":
      return(
        <LayoutPage>
          <h1>Registro secretaria</h1>
        </LayoutPage>
      )
    default:
      router.push("/");
      return null;
  }
}