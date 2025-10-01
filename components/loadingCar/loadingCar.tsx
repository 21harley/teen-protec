import Link from 'next/link';
import { useEffect, useRef } from 'react';
type LoadingProps = {
  redirect: boolean;
  route?:string;
};
export default function LoadingCar({
    redirect=false,
    route="/"
}:LoadingProps){
  const linkRef = useRef<HTMLAnchorElement>(null);

  const triggerLinkClick = () => {
    if (linkRef.current) {
      linkRef.current.click();
    }
  };
   
    useEffect(() => {
        console.log("useEffect-LoadingCar-",redirect);
        if(redirect){
            console.log("Click")
            setInterval(()=>{
                triggerLinkClick()
            },1000);
        }
    }, [redirect])

  return(
    <main>
       <Link href={route} ref={linkRef} style={{ display: 'none' }}>
        Link oculto
      </Link>
        <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
            <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6DC7E4" strokeWidth="4"></circle>
                <path className="opacity-75" fill="#6DC7E4" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </section>
    </main>
  )
}