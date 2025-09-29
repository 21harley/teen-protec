"use client"
import Cart_Home from '@/components/cartHome/cart_Home';
import Cart_Home_Mini from '@/components/cartHomeMini/cart_Home_Mini';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo} from "./types/user"

export default function Home() {
    const [isClient, setIsClient] = useState(false)
    const router = useRouter()
  
    useEffect(() => {
      setIsClient(true)
    }, [])
  
    if (!isClient) {
      return null // o un loader mientras se carga
    }
  
    const storageManager = new StorageManager('local')
    const data = storageManager.load<UsuarioInfo>('userData')
    let initUser = false
    if(data)  initUser = true
    
  return (
    <>
  {/* Primera sección - Consulta */}
  <section className='_color_one  min-h-[100dvh] flex flex-col-reverse sm:flex-col md:flex-row-reverse items-center justify-center gap-8 md:gap-16 p-4 md:p-8 w-full'>
      <div className="md:w-1/2 flex justify-center order-2 sm:order-1 md:order-1">
      <div>
      <Cart_Home  /> 
          <Link 
            href={initUser ? "/test" : "/auth/login"}
            className={`_color_seven block  p-3 px-4 text-center rounded transition m-auto mt-2 max-w-[200px]`}
          >
            {initUser ? "Hacer Test" : "Iniciar sesión"}
          </Link>
      </div>
    </div>
    <div className="w-full md:w-1/2 max-w-[300px] md:max-w-[400px] min-w-[120px] mx-auto p-4 md:p-10 order-1 sm:order-2 md:order-2">
      <Image
        src="/logos/psicologa_consulta_home.svg"  // Ruta desde public
        width={400}
        height={250}
        alt="Consulta médica"
        className="w-full h-auto"
        priority // Para imágenes above the fold
      />
    </div>
  </section>

  {/* Segunda sección - Online */}
  <section className='_color_four min-h-[100dvh] flex flex-col-reverse sm:flex-col md:flex-row-reverse items-center justify-center gap-8 md:gap-16 p-4 md:p-8'>
    <div className="md:w-1/2 flex justify-center order-2 sm:order-1 md:order-1">
      <Cart_Home_Mini />
    </div>
    <div className="w-full md:w-1/2 max-w-[300px] md:max-w-[400px] min-w-[120px] mx-auto p-4 md:p-10 order-1 sm:order-2 md:order-2">
      <Image
        src="/logos/consulta_online.svg"  // Ruta desde public
        width={300}
        height={150}
        alt="Consulta online"
        className="w-full h-auto"
        priority // Para imágenes above the fold
      />
    </div>
  </section>
    </>
  );
}