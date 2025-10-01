// stores/userStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { 
  UsuarioInfo, 
  RedSocial, 
  PsicologoInfo,
  TutorInfo
} from './../../app/types/user';

type SocketType = typeof io.Socket;

interface UserState {
  // Estado de autenticación
  user: UsuarioInfo | null;
  token: string | null;
  tokenExpiry: Date | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLogout: boolean;
  error: string | null;
  
  // Estado de notificaciones y socket
  alertCount: number;
  socket: SocketType | null;
  isSocketConnected: boolean;
  
  // Acciones de autenticación
  login: (user: UsuarioInfo, token: string, tokenExpiry: Date) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setLogouting: (activelogout: boolean) => void;
  setError: (error: string | null) => void;
  
  // Acciones de actualización de perfil
  updateUser: (updatedData: Partial<UsuarioInfo>) => void;
  updateTutor: (updatedData: Partial<TutorInfo>) => void;
  updatePsychologist: (updatedData: Partial<PsicologoInfo>) => void;
  
  // Acciones para redes sociales
  addSocialNetwork: (network: Omit<RedSocial, 'id'>) => void;
  removeSocialNetwork: (networkId: number) => void;
  updateSocialNetwork: (networkId: number, updates: Partial<RedSocial>) => void;
  
  // Acciones de socket y notificaciones
  setAlertCount: (count: number) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
  fetchAlertCount: () => Promise<void>;
}

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  tokenExpiry: null,
  isAuthenticated: false,
  isLoading: false,
  isLogout: false,
  error: null,

  // Estado de notificaciones
  alertCount: 0,
  socket: null,
  isSocketConnected: false,

  // Iniciar sesión
  login: (user, token, tokenExpiry) => set({ 
    user: { ...user },
    token,
    tokenExpiry,
    isAuthenticated: true,
    isLoading: false,
    error: null
  }),

  // Cerrar sesión
  logout: () => {
    const { socket, disconnectSocket } = get();
    // Desconectar socket al hacer logout
    if (socket) {
      disconnectSocket();
    }
    
    set({ 
      user: null, 
      token: null,
      tokenExpiry: null,
      isAuthenticated: false,
      error: null,
      alertCount: 0,
      socket: null,
      isSocketConnected: false
    });
  },

  // Manejo de carga y errores
  setLoading: (loading) => set({ isLoading: loading }),
  setLogouting: (activelogout) => set({ isLogout: activelogout }),
  setError: (error) => set({ error }),

  // Actualizar datos básicos del usuario
  updateUser: (updatedData) => set((state) => ({
    user: state.user ? {
      ...state.user,
      ...updatedData,
      nombre: updatedData.nombre || state.user.nombre,
      email: updatedData.email || state.user.email,
      cedula: updatedData.cedula || state.user.cedula,
      fecha_nacimiento: updatedData.fecha_nacimiento || state.user.fecha_nacimiento
    } : null
  })),

  // Actualizar datos de tutor (si es adolescente)
  updateTutor: (updatedData) => set((state) => {
    if (!state.user?.tutorInfo) return state;

    return {
      user: {
        ...state.user,
        tutorInfo: {
          ...state.user.tutorInfo,
          ...updatedData
        }
      }
    };
  }),

  // Actualizar datos de psicólogo
  updatePsychologist: (updatedData) => set((state) => {
    if (!state.user?.psicologoInfo) return state;
    
    return {
      user: {
        ...state.user,
        psicologoInfo: {
          ...state.user.psicologoInfo,
          ...updatedData,
          redes_sociales: updatedData.redes_sociales 
            ? updatedData.redes_sociales 
            : state.user.psicologoInfo.redes_sociales
        }
      }
    };
  }),

  // Añadir red social (para psicólogos)
  addSocialNetwork: (network) => set((state) => {
    if (!state.user?.psicologoInfo) return state;
    
    const newNetwork: RedSocial = {
      ...network,
      id: Math.random(), // ID temporal (se reemplazará con el ID real del backend)
    };
    
    return {
      user: {
        ...state.user,
        psicologoInfo: {
          ...state.user.psicologoInfo,
          redes_sociales: [
            ...(state.user.psicologoInfo.redes_sociales || []),
            newNetwork
          ]
        }
      }
    };
  }),

  // Eliminar red social
  removeSocialNetwork: (networkId) => set((state) => {
    if (!state.user?.psicologoInfo?.redes_sociales) return state;
    
    return {
      user: {
        ...state.user,
        psicologoInfo: {
          ...state.user.psicologoInfo,
          redes_sociales: state.user.psicologoInfo.redes_sociales.filter(
            (net) => net.id !== networkId
          )
        }
      }
    };
  }),

  // Actualizar red social
  updateSocialNetwork: (networkId, updates) => set((state) => {
    if (!state.user?.psicologoInfo?.redes_sociales) return state;
    
    return {
      user: {
        ...state.user,
        psicologoInfo: {
          ...state.user.psicologoInfo,
          redes_sociales: state.user.psicologoInfo.redes_sociales.map(
            (net) => net.id === networkId ? { ...net, ...updates } : net
          )
        }
      }
    };
  }),

  // Acciones de notificaciones y socket
  setAlertCount: (count) => set({ alertCount: count }),

  connectSocket: () => {
    const { user, socket: currentSocket, disconnectSocket, fetchAlertCount } = get();
    
    if (!user?.id) {
      console.log("No hay usuario para conectar socket");
      return;
    }

    // Desconectar socket existente
    if (currentSocket) {
      disconnectSocket();
    }

    console.log("Intentando conectar Socket.io...");
   try{
    fetch("/api/socket").then(() => {
      const newSocket = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Conectado al servidor Socket.io");
        newSocket.emit("join-user-room", user.id.toString());
        set({ isSocketConnected: true });
        
        // Cargar alertas iniciales al conectar
        fetchAlertCount();
      });

      newSocket.on("connect_error", (err: any) => {
        console.error("❌ Error de conexión:", err.message);
        set({ isSocketConnected: false });
      });

      newSocket.on("disconnect", (reason: any) => {
        console.log("🔌 Desconectado:", reason);
        set({ isSocketConnected: false });
      });

      newSocket.on("notificationUpdate", (data: any) => {
        if (data.usuarioId === user.id.toString()) {
          console.log("📢 Nueva notificación recibida:", data);
          fetchAlertCount();
        }
      });

      set({ socket: newSocket });
    }).catch(error => {
      console.error("Error inicializando socket:", error);
    });
   }catch(e){
     console.log(e);
   }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log("Desconectando socket...");
      socket.disconnect();
      set({ 
        socket: null, 
        isSocketConnected: false,
        alertCount: 0 
      });
    }
  },

  fetchAlertCount: async () => {
    const { user, setAlertCount } = get();
    
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/alerta?usuarioId=${user.id}&noVistas=true`);
      if (response.ok) {
        const data = await response.json();
        setAlertCount(data.data.length);
      }
    } catch (error) {
      console.error('Error fetching alert count:', error);
    }
  }
}));

export default useUserStore;