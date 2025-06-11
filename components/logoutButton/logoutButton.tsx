import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();


  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('tempData');
      router.push('/login');
      
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Cerrar sesión
    </button>
  );
}