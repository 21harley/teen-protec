'use client'
import { ReactNode, useEffect, useState } from 'react';
import { Geist, Geist_Mono ,Roboto} from "next/font/google";
import "./globals.css";
import Header from '../components/header/header';
import Footer from '../components/footer/footer';
import useUserStore from '@/app/store/store';
import { UsuarioInfo } from '@/app/types/user';
import { StorageManager } from "@/app/lib/storageManager"

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})
 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    


  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${roboto.className}`}
      >
        <Header></Header>
          {children}
        <Footer></Footer>
      </body>
    </html>
  );
}
