// components/ProtectedRoute.tsx
'use client';
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../../app/types/user"
import useUserStore from "./../../app/store/store";
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useUserStore((state) => state.user)
  const isLoading = useUserStore((state)=>state.isLoading)
  const router = useRouter();
  const storageManager = new StorageManager('local');
  let data = storageManager.load<UsuarioInfo>('userData');
  
  useEffect(() => {
    if (!user) {
      console.log("Cerro sesion");
      console.log(isLoading);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if(user){
    return(
      <>{children}</>
    )
  }else{
    return null;
  }

};