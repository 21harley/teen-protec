'use client'
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import FormUser from "@/components/formUser/formUser";

export default function Register(){
  
  return (
    <>
      <Header />
      <main>
        <section className="_color_four h-full min-h-[84dvh] grid place-items-center p-5">
          <FormUser/>
        </section>
      </main>
      <Footer />
    </>
  );
}