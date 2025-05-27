'use client'
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import Image from "next/image"
import svg from "./../../public/logos/logo_texto.svg"
import Link from "next/link"
import { useState } from "react"

export default function PasswordRecovery() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email) {
      setError('Por favor ingrese su correo electrónico')
      return
    }
    
    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo electrónico válido')
      return
    }
    
    // Simular envío de correo (en producción sería una llamada a la API)
    console.log('Correo enviado a:', email)
    setSuccess(true)
    setError('')
  }

  return (
    <>
      <Header />
      <main>
        <section className="_color_four h-full min-h-[80dvh] grid place-items-center p-5">
          <form 
            onSubmit={handleSubmit}
            className="p-8 max-w-[400px] w-full flex flex-col items-center justify-center gap-4 _color_seven rounded-[10px]"
          >
            <div>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de TeenProtec"
                priority
              />
            </div>
            
            <div className="w-full max-w-[190px]">
              <label htmlFor="password" className="text-sm">Ingrese Correo:</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="correo@ejemplo.com"
                className={`w-full border ${error ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
              {success && (
                <p className="text-green-600 text-xs mt-1">
                  ¡Correo enviado! Por favor revise su bandeja de entrada.
                </p>
              )}
            </div>
            
            <div className="w-full flex justify-center"> 
              <button
                type="submit"
                className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800"
              >
                Validar Correo
              </button>
            </div>
            
            <div className="text-center">
              <label className="text-[10px]">
                ¿No tiene cuenta?  
                <Link
                  href="/auth/register"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Regístrese ahora
                </Link>
              </label>
              <br/>
              <label className="text-[10px]">
                ¿Tiene cuenta?
                <Link
                  href="/auth/login"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Inicie Sesión
                </Link>
              </label>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  )
}