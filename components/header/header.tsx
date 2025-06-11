'use client'
import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import logo from "./../../app/public/logos/logo_header.svg"
import menu from "./../../app/public/logos/menu.svg"
import close_menu from "./../../app/public/logos/close_menu.svg"
import { LogoutButton } from "../logoutButton/logoutButton"
// Tipos actualizados
type MenuItem = {
  path: string
  name: string
  icon?: string
}

type TipoUsuario = {
  id: number
  nombre: string
  menu: MenuItem[]
}

type User = {
  id: number
  email: string
  nombre: string
  id_tipo_usuario: number
  tipoUsuario: TipoUsuario
}

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    // Verificar si hay datos de usuario en localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        if (parsedData.user) {
          setUser(parsedData.user)
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const toggleModal = () => setIsModalOpen(!isModalOpen)
  const closeModal = () => setIsModalOpen(false)

  // Método para generar links basados en el menú del usuario
  const generateLinks = () => {
    if (!user) {
      // Mostrar menú para usuarios no autenticados
      return (
        <>
          <li>
            <Link 
              href="/auth/login"
              onClick={closeModal}
              className="block w-full py-3 px-4 text-center rounded transition bg-stone-100"
            >
              Iniciar Sesión
            </Link>
          </li>
          <li>
            <Link 
              href="/auth/register"
              onClick={closeModal}
              className="block w-full py-3 px-4 text-center rounded transition bg-stone-100"
            >
              Registrarse
            </Link>
          </li>
          <li>
            <Link 
              href="/"
              onClick={closeModal}
              className="block w-full py-3 px-4 text-center rounded transition bg-stone-100"
            >
              Sobre nosotros
            </Link>
          </li>
        </>
      )
    }

    // Mostrar menú del usuario autenticado
    return (
      <>
        {user.tipoUsuario.menu.map((item, index) => (
          <li key={index}>
            <Link 
              href={item.path}
              onClick={closeModal}
              className="block w-full py-3 px-4 text-center rounded transition bg-stone-100"
            >
              {item.name}
            </Link>
          </li>
        ))}
        <li>
          <button 
            onClick={() => {
              // Lógica para cerrar sesión
              localStorage.removeItem('userData')
              setUser(null)
              closeModal()
              // Redirigir al inicio o login si es necesario
              window.location.href = '/auth/login'
            }}
            className="w-full py-3 px-4 rounded text-center transition bg-gray-200"
          >
            Cerrar Sesión
          </button>
        </li>
      </>
    )
  }

  return (
    <header className="max-w-[1000px] m-auto p-2">
      <div className="w-full flex justify-between items-center">
        <Link href="/">
          <Image
            src={logo}
            width={70}
            height={40}
            alt="Website logo"
          />
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm hidden sm:block">
              Hola, {user.nombre.split(' ')[0]} {/* Muestra solo el primer nombre */}
            </span>
          )}
          <button 
            onClick={toggleModal}
            aria-label="Toggle menu"
            className="p-1 focus:outline-none"
          >
            <Image
              src={isModalOpen ? close_menu : menu}
              width={20}
              height={20}
              alt="Menu icon"
            />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={closeModal}
        >
          <div className="fixed inset-0 bg-black opacity-15 transition-opacity" />
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="relative rounded-lg max-w-md w-full p-6 bg-white"
              onClick={(e) => e.stopPropagation()}
            >   
              <nav>
                <ul className="space-y-4">
                  {generateLinks()}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}