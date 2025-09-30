'use client'
import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useUserStore from "@/app/store/store"
import { UsuarioInfo } from "./../../app/types/user"
import { StorageManager } from "@/app/lib/storageManager"
import { usePathname } from 'next/navigation'

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Usar el store unificado con socket integrado
  const { 
    user, 
    login, 
    logout, 
    setLoading, 
    setLogouting, 
    isLogout,
    alertCount,
    connectSocket,
    disconnectSocket,
    fetchAlertCount
  } = useUserStore()
  
  const storageManager = new StorageManager("local")
  const pathname = usePathname()
  const router = useRouter()

  // Efecto para hidratar el store con los datos del localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedData = storageManager.load<UsuarioInfo>("userData")
        if (storedData && !user) {
          login(
            storedData,
            storedData.resetPasswordToken ?? "",
            storedData.resetPasswordTokenExpiry
              ? (typeof storedData.resetPasswordTokenExpiry === "string"
                  ? new Date(storedData.resetPasswordTokenExpiry)
                  : storedData.resetPasswordTokenExpiry)
              : new Date()
          )
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsHydrated(true)
      }
    }

    loadUserData()
  }, [login, user])

  // Efecto para manejar la conexión del socket cuando el usuario cambia
  useEffect(() => {
    if (user?.id) {
      console.log("🔗 Conectando socket para usuario:", user.id)
      connectSocket()
    } else {
      console.log("🔗 Desconectando socket - usuario no autenticado")
      disconnectSocket()
    }

    return () => {
      // No desconectamos aquí para mantener la conexión activa entre rutas
      // La desconexión se maneja en el logout y cuando el usuario cambia
    }
  }, [user?.id, connectSocket, disconnectSocket])

  // Efecto para cargar las alertas iniciales cuando el usuario cambia
  useEffect(() => {
    if (user?.id) {
      fetchAlertCount()
    }
  }, [user?.id, fetchAlertCount])

  useEffect(() => {
    if (!user) {
      router.push("/")
      router.refresh()
      setLoading(false)
      setLogouting(false)
    }
  }, [user, router, setLoading, setLogouting])

  const toggleModal = () => setIsModalOpen(!isModalOpen)
  const closeModal = () => setIsModalOpen(false)
  
  const logoutEffect = async () => {
    closeModal()
    logout() // Esto ahora también desconecta el socket automáticamente
  }

  const ajustarNombre = (user: UsuarioInfo) => {
    if (user?.nombre) {
      if (user.nombre.length > 3) {
        return user.nombre.split(' ')[0]
      }
      return "usuario"
    } else {
      return "user"
    }
  }

  const generateLinks = () => {
    if (!user) {
      return (
        <>
          <li>
            <Link href="/auth/login" onClick={closeModal} className="block w-full py-3 px-4 text-center rounded transition bg-stone-50">
              Iniciar Sesión
            </Link>
          </li>
          <li>
            <Link href="/auth/register" onClick={closeModal} className="block w-full py-3 px-4 text-center rounded transition bg-stone-50">
              Registrarse
            </Link>
          </li>
          <li>
            <Link href="/" onClick={closeModal} className="block w-full py-3 px-4 text-center rounded transition bg-stone-50">
              Sobre nosotros
            </Link>
          </li>
        </>
      )
    }
    return (
      <>
        {user && user.tipoUsuario?.menu.map((item, index) => (
          <li key={index}>
            <Link 
              href={item.path}
              onClick={closeModal}
              className={`block w-full py-3 px-4 text-center rounded transition bg-stone-50 relative ${
                item.name === "Alertas" ? "flex justify-center items-center gap-2" : ""
              }`}
            >
              {item.name}
              {item.name === "Alertas" && alertCount > 0 && (user?.id_tipo_usuario !== 1) && pathname != "/alertas" && (
                <div className="absolute top-[5px] transform translate-x-10">
                  <div className="relative">
                    <Image src="/logos/icono_alerta.svg" alt="Alerta" className="w-[28px] h-[28px]" width={0} height={0} />
                    <span className="absolute top-[4px] left-[-1px] text-white text-sm font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          </li>
        ))}
      </>
    )
  }

  const handleLogout = async () => {
    setLogouting(true)
    try {
      const storageManager = new StorageManager('local')
      const data = storageManager.load<UsuarioInfo>('userData')
      
      // Eliminar datos de almacenamiento local
      localStorage.removeItem('userData')
      sessionStorage.removeItem('tempData')

      try {
        const response = await fetch(`/api/auth/logout?id=${data?.id}`, {
          method: 'POST',
        })
        if (response.ok) {
          logoutEffect()
        }
      } catch (error) {
        console.error('Logout failed:', error)
      }
    } catch (error) {
      console.error('Error durante logout:', error)
    }
  }

  if (!isHydrated) {
    return (
      <header className="max-w-[1250px] m-auto p-2">
        <div className="w-full flex justify-between items-center">
          <Link href="/">
            <Image src="/logos/logo_header.svg" className="w-[70px] h-[40px]" width={0} height={0} alt="Website logo" />
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="max-w-[1250px] m-auto p-2">
      <div className="w-full flex justify-between items-center">
        <Link href="/">
          <Image src="/logos/logo_header.svg" className="w-[70px] h-[40px]" width={0} height={0} alt="Website logo"  />
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm hidden sm:block">
              Hola, {ajustarNombre(user)}
            </span>
          )}
          
          <div className="relative">
            <button onClick={toggleModal} aria-label="Toggle menu" className="p-1 focus:outline-none cursor-pointer">
              {(user?.id_tipo_usuario !== 1) && !isModalOpen && alertCount > 0 && pathname != "/alertas" && (
                <div className="absolute">
                  <div className="absolute left-[10px] top-[-10px] z-10 w-[25px] h-6">
                    <Image src="/logos/icono_alerta.svg" alt="Alerta" className="w-[28px] h-[28px]" width={28} height={28} />
                    <span className="absolute top-[3px] left-[-2px] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  </div>
                </div>
              )}
              <Image src={isModalOpen ? "/logos/close_menu.svg": "/logos/menu.svg"} width={0} height={0} alt="Menu icon" className="w-[20px] h-[20px]" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
          <div className="fixed inset-0 bg-[#ADD8E6] opacity-45 transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>   
              <nav>
                <ul className="space-y-4">
                  {generateLinks()}
                  <li className={user? "block" : "hidden"} >
                     <button 
                        onClick={handleLogout}
                        className="w-full py-3 px-4 rounded text-center transition bg-stone-50 cursor-pointer"
                        disabled={isLogout}
                      >
                        {isLogout ? 'Cerrando sesión...' : 'Cerrar sesión'}
                      </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
      {isLogout && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-35 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6DC7E4" strokeWidth="4"></circle>
                <path className="opacity-75" fill="#6DC7E4" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Cerrando sesión</h3>
            <p className="mt-2 text-sm text-gray-500">Por favor espera mientras terminamos tu sesión...</p>
          </div>
        </div>
      )}
    </header>
  )
}