'use client'
import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import logo from "./../../app/public/logos/logo_header.svg"
import menu from "./../../app/public/logos/menu.svg"
import close_menu from "./../../app/public/logos/close_menu.svg"

// Tipos
type User = {
  id: string
  name: string
  accessLevel: 'guest' | 'basic' | 'premium' | 'admin'
}

type Route = {
  path: string
  label: string
  allowedLevels: ('guest' | 'basic' | 'premium' | 'admin')[]
  icon?: string
  className?: string
}

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Array de rutas configuradas
  const routes: Route[] = [
    {
      path: '/auth/login',
      label: 'Iniciar Sesión',
      allowedLevels: ['guest'],
      className: 'bg-stone-100'
    },
    {
      path: '/auth/register',
      label: 'Registrarse',
      allowedLevels: ['guest'],
      className: 'bg-stone-100'
    },
    {
      path: '/',
      label: 'Sobre nosotros',
      allowedLevels: ['guest', 'basic', 'premium', 'admin'],
      className: 'bg-stone-100'
    },
    {
      path: '/profile',
      label: 'Mi Perfil',
      allowedLevels: ['basic', 'premium', 'admin'],
      className: 'bg-blue-100'
    },
    {
      path: '/content',
      label: 'Contenido Básico',
      allowedLevels: ['basic'],
      className: 'bg-green-100'
    },
    {
      path: '/premium',
      label: 'Contenido Premium 👑',
      allowedLevels: ['premium', 'admin'],
      className: 'bg-purple-100'
    },
    {
      path: '/admin',
      label: 'Panel Administrador',
      allowedLevels: ['admin'],
      className: 'bg-red-100'
    },
    {
      path: '/logout',
      label: 'Cerrar Sesión',
      allowedLevels: ['basic', 'premium', 'admin'],
      className: 'bg-gray-200'
    }
  ]

  // Simular obtención del usuario
  useEffect(() => {
    // Ejemplo: usuario no logueado
    setUser({
      id: '',
      name: '',
      accessLevel: 'guest'
    })
    
    // Ejemplo alternativo para probar diferentes niveles:
    // setUser({
    //   id: '123',
    //   name: 'Ana López',
    //   accessLevel: 'premium' // Cambiar a 'basic', 'admin' o 'guest' para probar
    // })
  }, [])

  const toggleModal = () => setIsModalOpen(!isModalOpen)
  const closeModal = () => setIsModalOpen(false)

  // Método para filtrar rutas según nivel de acceso
  const getFilteredRoutes = () => {
    if (!user) return []
    return routes.filter(route => 
      route.allowedLevels.includes(user.accessLevel)
    )
  }

  // Método para generar links
  const generateLinks = () => {
    const filteredRoutes = getFilteredRoutes()
    
    return filteredRoutes.map((route, index) => (
      <li key={index}>
        {route.path === '/logout' ? (
          <button 
            onClick={() => {
              // Lógica para cerrar sesión
              setUser({
                id: '',
                name: '',
                accessLevel: 'guest'
              })
              closeModal()
            }}
            className={`w-full py-3 px-4 rounded text-center transition ${route.className}`}
          >
            {route.label}
          </button>
        ) : (
          <Link 
            href={route.path}
            onClick={closeModal}
            className={`block w-full py-3 px-4 text-center rounded transition ${route.className}`}
          >
            {route.label}
          </Link>
        )}
      </li>
    ))
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={closeModal}
        >
          <div className="fixed inset-0 bg-black opacity-15 transition-opacity" />
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="relative  rounded-lg max-w-md w-full p-6 "
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