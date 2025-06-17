'use client'
import { ReactNode } from 'react';
import Header from '../header/header';
import Footer from '../footer/footer';

export default function LayoutPage({ children }: { children: ReactNode }) {

  // Si hay usuario, renderizamos los children
  return <>
   <Header/>
        <main>
        <section className="_color_four h-full min-h-[80dvh] grid place-items-center p-5">
          {children}
        </section>
      </main>
  <Footer/>
  </>;
}