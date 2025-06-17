'use client'
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { StorageManager } from "@/app/lib/storageManager";
import { AuthResponse } from "../../app/types/user";

type ValidateUserProps = {
  user?: AuthResponse; // Prop opcional para el usuario
  children: ReactNode; // Contenido que se renderizará si hay usuario
  redirectTo?: string; // Ruta opcional para redirección
};

export default function ValidateUserWrapper({
  user: propUser,
  children,
  redirectTo = "/"
}: ValidateUserProps) {
  const router = useRouter();
  
  // Si no se pasa el usuario por props, lo intentamos obtener del storage
  const storageManager = new StorageManager('local');
  const storageUser = propUser || storageManager.load<AuthResponse>('userData');
  
  if (!storageUser) {
    // Usamos el router de Next.js en lugar de window.location
    router.push(redirectTo);
    return null; // No renderizamos nada mientras redirige
  }

  // Si hay usuario, renderizamos los children
  return <>{children}</>;
}