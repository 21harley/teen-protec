// contexts/NotificationContext.tsx
'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import io from "socket.io-client"
// Definir el tipo Socket correctamente
type SocketType = typeof io.Socket;

import { UsuarioInfo } from '@/app/types/user'

interface NotificationContextType {
  alertCount: number
  setAlertCount: (count: number) => void
  fetchAlertCount: (userId: number) => Promise<void>
  isSocketConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
  user: UsuarioInfo | null
}

export function NotificationProvider({ children, user }: NotificationProviderProps) {
  const [alertCount, setAlertCount] = useState(0)
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Función para obtener el contador de alertas
  const fetchAlertCount = async (userId: number) => {
    try {
      const response = await fetch(`/api/alerta?usuarioId=${userId}&noVistas=true`)
      if (response.ok) {
        const data = await response.json()
        setAlertCount(data.data.length)
      }
    } catch (error) {
      console.error('Error fetching alert count:', error)
    }
  }

  // Efecto para manejar la conexión del socket
  useEffect(() => {
    if (!user?.id) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsSocketConnected(false)
      }
      return
    }

    console.log("Intentando conectar Socket.io...")

    // Llamada para preparar el servidor
    fetch("/api/socket").then(() => {
      const newSocket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      })

      newSocket.on("connect", () => {
        console.log("✅ Conectado al servidor Socket.io")
        newSocket.emit("join-user-room", user.id.toString())
        setIsSocketConnected(true)
      })

      newSocket.on("connect_error", (err: any) => {
        console.error("❌ Error de conexión:", err.message)
        setIsSocketConnected(false)
      })

      newSocket.on("disconnect", (reason: any) => {
        console.log("🔌 Desconectado:", reason)
        setIsSocketConnected(false)
      })

      newSocket.on("notificationUpdate", (data: any) => {
        if (data.usuarioId === user.id.toString()) {
          fetchAlertCount(user.id)
        }
      })

      setSocket(newSocket)
    })

    return () => {
      console.log("Limpiando socket...")
      socket?.disconnect()
      setIsSocketConnected(false)
    }
  }, [user?.id])

  // Efecto para cargar las alertas iniciales cuando el usuario cambia
  useEffect(() => {
    if (user?.id) {
      fetchAlertCount(user.id)
    } else {
      setAlertCount(0)
    }
  }, [user?.id])

  const value = {
    alertCount,
    setAlertCount,
    fetchAlertCount,
    isSocketConnected
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider')
  }
  return context
}