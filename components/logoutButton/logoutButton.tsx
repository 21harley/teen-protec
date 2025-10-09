'use client'
import { UsuarioInfo } from "./../../app/types/user"
import { StorageManager } from "@/app/lib/storageManager"
import useUserStore from "@/app/store/store"

interface LogoutButtonProps {
  onLogoutComplete: () => void;
}

export function LogoutButton({ onLogoutComplete }: LogoutButtonProps) {
  const logout = useUserStore((state) => state.logout)
  const isLoading = useUserStore((state) => state.setLoading);
  const isloading = useUserStore((state)=> state.isLoading);
  const handleLogout = async () => {
    isLoading(true);
    try {
      const storageManager = new StorageManager('local');
      const data = storageManager.load<UsuarioInfo>('userData');
      // Eliminar datos de almacenamiento local
      localStorage.removeItem('userData');
      sessionStorage.removeItem('tempData');

      try {
        const response = await fetch(`/api/auth/logout?id=${data?.id}`, {
          method: 'POST',
        });
        if (response.ok) {
          // Redirigir o actualizar el estado de la UI
          isLoading(true);
          logout()
          onLogoutComplete();
        }
      } catch (error) {
        console.error('Logout failed:', error);
        isLoading(true);
        logout()
        onLogoutComplete()
      }
      
    } catch (error) {
      console.error('Error durante logout:', error);
      isLoading(true);
      logout();
      onLogoutComplete()
    }
  };

  return (
    <>
      <button 
        onClick={handleLogout}
        className="w-full py-3 px-4 rounded text-center transition bg-stone-50 cursor-pointer"
        disabled={isloading}
      >
        {isloading ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>

      {/* Modal de carga */}
      {isloading && (
        <div className="fixed inset-0 _color_four bg-opacity-35 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              {/* Puedes reemplazar esto con tu GIF o animación preferida */}
              <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6DC7E4" strokeWidth="4"></circle>
                <path className="opacity-75" fill="#6DC7E4" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {/* Alternativa con GIF: 
              <img src="/loading.gif" alt="Cerrando sesión" className="h-12 w-12 mx-auto" />
              */}
            </div>
            <h3 className="text-lg font-medium text-gray-900">Cerrando sesión</h3>
            <p className="mt-2 text-sm text-gray-500">Por favor espera mientras terminamos tu sesión...</p>
          </div>
        </div>
      )}
    </>
  );
}