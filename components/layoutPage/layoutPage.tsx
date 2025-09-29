'use client'
import { ReactNode, useEffect, useState } from 'react';
import Header from '../header/header';
import Footer from '../footer/footer';
import useUserStore from '@/app/store/store';
import { UsuarioInfo } from '@/app/types/user';
import { StorageManager } from "@/app/lib/storageManager"

export default function LayoutPage({ children }: { children: ReactNode }) {
const storeUser = useUserStore((state) => state.user);
  const [user, setUser] = useState<UsuarioInfo | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      // First try with store
      if (storeUser) {
        setUser(storeUser);
        return;
      }

      // If not in store, check localStorage
      const storageManager = new StorageManager('local');
      const data = storageManager.load<UsuarioInfo>('userData');
      
      if (data) {
        setUser(data);
      } 
    };

    loadUserData();
  }, [storeUser]);
  
  
    let initUser = false
    if(user)  initUser = true
    

  // Si hay usuario, renderizamos los children
  return <>
   <Header />
        <main>
        <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          {children}
        </section>
      </main>
  <Footer/>
  </>;
}
