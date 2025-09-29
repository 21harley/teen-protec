'use client'
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import useUserStore from "../store/store";
import FormUser from "@/components/formUser/formUser";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const storeUser = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const [user, setUser] = useState<UsuarioInfo | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      // Primero intentar con el store
      if (storeUser) {
        setUser(storeUser);
        setLoading(false);
        return;
      }

      // Si no hay en store, buscar en localStorage
      const storageManager = new StorageManager('local');
      const data = storageManager.load<UsuarioInfo>('userData');
      
      if (data) {
        setUser(data);
        setLoading(false);
      } else {
        // Redirigir si no hay usuario autenticado
        router.push("/");
      }
    };

    loadUserData();
  }, [storeUser, router]);

  const handleSubmit = async (formData: any) => {
    try {
      if (!user) return;

      // Actualizar en el store
      updateUser(formData.usuarioData);
      
      // Actualizar en localStorage
      const storageManager = new StorageManager('local');
      const currentData = storageManager.load<UsuarioInfo>('userData');
      
      if (currentData) {
        const updatedData = {
          ...currentData,
          user: {
            ...currentData,
            ...formData.usuarioData
          }
        };
        storageManager.save('userData', updatedData);
      }

      // Feedback al usuario
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
        <>
        <div className="flex justify-center items-center h-64">
          <p>Cargando perfil...</p>
        </div>
        </>
    );
  }

  if (!user || !user.tipoUsuario?.nombre) {
    // El efecto de useEffect ya maneja la redirección
    return null;
  }

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
}