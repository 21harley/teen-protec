
import Image from "next/image"; 

export default function Footer() {
  return (
      <footer className="w-full  grid place-items-center footer_components  sm:flex sm:justify-center pt-5 pb-5">
        <div>
           <Image
              src="/logos/logo-footer.svg"
              width={0}
              height={0}
              alt="Picture of the author"
              className="w-[180px] h-[90px]"
           ></Image>
        </div>
        <div className="mt-2">
          <div className="flex gap-3 justify-center">
          <ul>
            <li>Sobre nosotros</li>
            <li>Desarrolladores</li>
          </ul>
          <ul>
            <li>Tipos de Test</li>
            <li>Sobre nosotros</li>
          </ul>
          </div>
          <p className="mt-2 text-xs">
            © 2025 PsicoTest. Todos los derechos reservados.
          </p>
        </div>
      </footer>
  );
}
