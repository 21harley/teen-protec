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

      switch(user?.id_tipo_usuario){
          case 1:case 3:case 4:case 5: updateRootVariables('usuario');break;
          case 2:
            updateRootVariables('psicologo')
          break;
          default:
            updateRootVariables('usuario');break;
      }
    };

    loadUserData();
  }, [storeUser]);
  
  
    type ThemeKey = 'psicologo' | 'usuario';
    type ThemeVars = {
      '--color-one': string;
      '--color-two': string;
      '--color-three': string;
      '--color-four': string;
      '--color-five': string;
      '--color-six': string;
      '--color-seven': string;
      '--color-eight': string;
    };
    const updateRootVariables = (selectedTheme: ThemeKey) => {
      const root = document.documentElement;
      
      const themes: Record<ThemeKey, ThemeVars> = {
         psicologo: {
        '--color-one':'#AEA8E8',
        '--color-two':'#B8E4CC',
        '--color-three':'#975FCE',
        '--color-four':'#E0F8F0',
        '--color-five':'#673BB4',
        '--color-six':'#FFFACD',
        '--color-seven':'#DAB4E5',
        '--color-eight':'#0059FF'
        },
         usuario: {
         '--color-one':'#ADD8E6',
        '--color-two':'#B8E4CC',
        '--color-three':'#6DC7E4',
        '--color-four':'#E0F8F0',
        '--color-five':'#AADBDC',
        '--color-six':'#FFFACD',
        '--color-seven':'#FFFFFF',
        '--color-eight':'#0059FF'
        },
        
      };

      // Aplicar las variables del tema seleccionado
      const themeVars = themes[selectedTheme];
      Object.entries(themeVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    };

    let initUser = false
    if(user)  initUser = true

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${roboto.className}`}
      >

          <Header />
           {children}
          <Footer />

      </body>
    </html>
  );
}
