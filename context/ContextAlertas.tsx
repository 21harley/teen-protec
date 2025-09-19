'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { NotificationContextType, NotificationUpdate } from '../app/types/alarma';
import { io, Socket } from 'socket.io-client';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  usuarioId: string;
}

export const ContextAlertasProvider = ({ children, usuarioId }: NotificationProviderProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!usuarioId) return;

    // Conectar al WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    setSocket(newSocket);

    // Unirse a la sala del usuario
    newSocket.emit('join-user-room', usuarioId);

    // Escuchar actualizaciones
    newSocket.on('notificationUpdate', (data: NotificationUpdate) => {
      if (data.usuarioId === usuarioId) {
        setUnreadCount(data.unreadCount);
      }
    });

    // Obtener contador inicial
    fetchUnreadCount();

    return () => {
      newSocket.disconnect();
    };
  }, [usuarioId]);

  const fetchUnreadCount = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/alarmas?usuarioId=${usuarioId}&noVistas=true`);
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const value: NotificationContextType = {
    unreadCount,
    refreshCount: fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};