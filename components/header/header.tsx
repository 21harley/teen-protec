'use client'
import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import logo from "./../../app/public/logos/logo_header.svg"
import menu from "./../../app/public/logos/menu.svg"
import close_menu from "./../../app/public/logos/close_menu.svg"
import { LogoutButton } from "../logoutButton/logoutButton"
import IconAlerta from "./../../app/public/logos/icono_alerta.svg"
import useUserStore from "@/app/store/store"
import { UsuarioInfo } from "./../../app/types/user"
import { StorageManager } from "@/app/lib/storageManager"
import { usePathname } from 'next/navigation'

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const user = useUserStore((state) => state.user)
  const login = useUserStore((state) => state.login)
  const storageManager = new StorageManager("local");
  const pathname = usePathname()

  // Efecto para hidratar el store con los datos del localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedData = storageManager.load<UsuarioInfo>("userData");
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
        //localStorage.removeItem('userData')
      } finally {
        setIsHydrated(true)
      }
    }

    loadUserData()
  }, [login])


  // Efecto para cargar las alertas
  useEffect(() => {
    const fetchAlertCount = async (userId: number) => {
      try {
        const response = await fetch(`/api/alerta?usuarioId=${userId}&noVistas=true`)
        if (response.ok) {
          const data = await response.json()
          setAlertCount(data.data.length)
          //console.log(data.data.length);
        }
      } catch (error) {
        console.error('Error fetching alert count:', error)
      }
    }

    if (user?.id) {
      fetchAlertCount(user.id)
    }
  }, [user])

  const toggleModal = () => setIsModalOpen(!isModalOpen)
  const closeModal = () => setIsModalOpen(false)
  const ajustarNombre = (user:UsuarioInfo) => {
    if(user?.nombre){
    if(user.nombre.length>3){
      return user.nombre.split(' ')[0]
    }
    return "usuario";
    }else{
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
                {item.name === "Alertas" && alertCount > 0 && (user?.id_tipo_usuario !== 1)  && pathname != "/alertas" &&(
                  <div className="absolute top-[5px]  transform translate-x-9/5">
                    <div className="relative">
                      <Image src={IconAlerta} alt="Alerta" width={24} height={24} />
                      <span className="absolute top-[1px] w-full left-[-5px] text-white text-xs font-bold rounded-full h-5  flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                        {alertCount > 9 ? '9+' : alertCount}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
          </li>
        ))}
        <li>
          <LogoutButton/>
        </li>
      </>
    )
  }

  if (!isHydrated) {
    return (
      <header className="max-w-[1250px] m-auto p-2">
        <div className="w-full flex justify-between items-center">
          <Link href="/">
            <Image src={logo} width={70} height={40} alt="Website logo" priority />
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="max-w-[1250px] m-auto p-2">
      <div className="w-full flex justify-between items-center">
        <Link href="/">
          <Image src={logo} width={70} height={40} alt="Website logo" priority />
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm hidden sm:block">
              Hola, { ajustarNombre(user)}
            </span>
          )}
          
            
          <div className="relative">
            <button onClick={toggleModal} aria-label="Toggle menu" className="p-1 focus:outline-none cursor-pointer">
            {(user?.id_tipo_usuario !== 1) && !isModalOpen && alertCount > 0 && pathname != "/alertas" &&(
              <div className="absolute">
                <div className="absolute left-[10px] top-[-10px] z-10 w-[21px] h-6">
                  <Image src={IconAlerta} alt="Alerta" width={24} height={24} />
                  <span className="absolute top-[1px] left-[-5px] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                </div>
              </div>
            )}
              <Image src={isModalOpen ? close_menu : menu} width={20} height={20} alt="Menu icon" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
          <div className="fixed inset-0 bg-[#ADD8E6] opacity-45 transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative rounded-lg max-w-md w-full p-6 " onClick={(e) => e.stopPropagation()}>   
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