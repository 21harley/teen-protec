import { Roboto } from 'next/font/google'
import Footer from '@/components/footer/footer'; 
import Header from '@/components/header/header';
import Cart_Home from '@/components/cart_home/cart_Home';
import Cart_Home_Mini from '@/components/cart_home_mini/cart_Home_Mini';
import Image from 'next/image';
import home_image_consulta from "./../app/public/logos/psicologa_consulta_home.svg"
import home_image_online from "./../app/public/logos/consulta_online.svg"
import Link from 'next/link';

export default function Home() {
  return (
    <>
<Header />
<main>
  {/* Primera sección - Consulta */}
  <section className='_color_one  min-h-[100dvh] flex flex-col-reverse sm:flex-col md:flex-row-reverse items-center justify-center gap-8 md:gap-16 p-4 md:p-8'>
      <div className="md:w-1/2 flex justify-center order-2 sm:order-1 md:order-1">
      <div>
      <Cart_Home  /> 
        <Link 
            href="/auth/login"
            className={`_color_seven block  p-3 px-4 text-center rounded transition m-auto mt-2 max-w-[200px]`}
          >
            Iniciar sesión
          </Link>
      </div>
    </div>
    <div className="w-full md:w-1/2 max-w-[300px] md:max-w-[400px] min-w-[120px] mx-auto p-4 md:p-10 order-1 sm:order-2 md:order-2">
      <Image
        src={home_image_consulta}
        width={400}  // Aumentado para desktop
        height={250} // Aumentado para desktop
        alt="Consulta médica"
        className="w-full h-auto"
        sizes="(max-width: 768px) 100vw, 400px"
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
        src={home_image_online}
        width={300}  // Aumentado para desktop
        height={150} // Aumentado para desktop
        alt="Consulta online"
        className="w-full h-auto"
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  </section>
</main>
<Footer />
    </>
  );
}
