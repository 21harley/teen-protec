import { create } from 'zustand';
import { 
  UsuarioInfo, 
  RedSocial, 
  PsicologoInfo,
  TutorInfo
} from './../../app/types/user'; // Asegúrate de que la ruta de importación sea correcta

interface UserState {
  // Estado de autenticación
  user: UsuarioInfo | null;
  token: string | null;
  tokenExpiry: Date | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones de autenticación
  login: (user: UsuarioInfo, token: string, tokenExpiry: Date) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Acciones de actualización de perfil
  updateUser: (updatedData: Partial<UsuarioInfo>) => void;
  updateTutor: (updatedData: Partial<TutorInfo>) => void;
  updatePsychologist: (updatedData: Partial<PsicologoInfo>) => void;
  
  // Acciones para redes sociales
  addSocialNetwork: (network: Omit<RedSocial, 'id'>) => void;
  removeSocialNetwork: (networkId: number) => void;
  updateSocialNetwork: (networkId: number, updates: Partial<RedSocial>) => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  tokenExpiry: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Iniciar sesión
  login: (user, token, tokenExpiry) => set({ 
     user:{...user},
    token,
    tokenExpiry,
    isAuthenticated: true,
    isLoading: false,
    error: null
  }),

  // Cerrar sesión
  logout: () => set({ 
    user: null, 
    token: null,
    tokenExpiry: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  // Manejo de carga y errores
  setLoading: (loading) => set({ isLoading: loading }),
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
  })
}));

export default useUserStore;