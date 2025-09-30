'use client'
import Image from "next/image"
import Link from "next/link"
import { apiPost } from './../../lib/apiClient';
import { StorageManager } from "@/app/lib/storageManager"
import useUserStore from "./../../../app/store/store"
import { LoginRequest } from "./../../types/user/index"
import { useRouter } from "next/navigation"
import { UsuarioInfo, LoginResponse } from "./../../types/user"
import { useEffect, useState } from "react";
import PasswordField from "@/components/passwordField/passwordField" // Ajusta la ruta según tu estructura
import LoadingCar from "@/components/loadingCar/loadingCar";

export default function Login() {
  const { login, user: user,isLoading:loading,setLoading } = useUserStore();
  const router = useRouter()


  // ========== VERIFICAR SESIÓN ACTIVA ========== //
  useEffect(() => {
      // Si hay usuario en Zustand, redirige
      if (user) {
        router.push("/")
        router.refresh()
      }
  }, [user]);

  // ========== ESTADOS DEL FORMULARIO ========== //
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });


  const [apiError, setApiError] = useState<string | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // ========== MANEJADORES DEL FORMULARIO ========== //
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (apiError) {
      setApiError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      password: e.target.value
    }));
  };

  const handleValidityChange = (isValid: boolean) => {
    setIsPasswordValid(isValid);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };

    if (!loginData.email.trim()) {
      newErrors.email = 'Este campo es requerido';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Por favor ingrese un email válido';
      valid = false;
    }

    if (!loginData.password) {
      newErrors.password = 'Este campo es requerido';
      valid = false;
    } else if (!isPasswordValid) {
      newErrors.password = 'La contraseña no cumple con los requisitos';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      const response = await apiPost<LoginResponse>('/auth/login', loginData);
 
      if (!response) {
        throw new Error('Invalid server response');
      }
      console.log(response);

      // Guardar en localStorage
      const storage = new StorageManager('local');
      storage.save<UsuarioInfo>("userData", response.user ?? {});

      // Actualizar el store de Zustand
      const expiryDate = typeof response.user.tokenExpiry === 'string' 
            ? new Date(response.user.tokenExpiry) 
            : response.user.tokenExpiry;
      
      // Redireccionar
      login(
        response.user,
        '',
        expiryDate
      );
      setLoading(false);
    } catch (err: any) {
      console.error('Login error:', err);
      setApiError(err.response?.data?.message || 'Credenciales incorrectas. Por favor verifique su email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDERIZADO ========== //
  // Evita renderizar el formulario hasta verificar la sesión
  if (loading) {
    return (
      <LoadingCar redirect={false}></LoadingCar>
    );
  }

  if(!user){
     return (
    <>
      <main>
        <section className="_color_four h-full min-h-[80dvh] grid place-items-center p-5">
          <form 
            onSubmit={handleSubmit}
            className="p-8 max-w-[400px] w-full flex flex-col items-center justify-center gap-4 _color_seven rounded-[10px]"
          >
            <div>
              <Image
                src="/logos/logo_texto.svg"
                width={0}
                height={0}
                alt="Logo de la empresa"
                className="w-[180px] h-[90px]"
                priority
              />
            </div>
            
            {apiError && (
              <div className="w-full max-w-[300px] text-red-500 text-sm text-center">
                {apiError}
              </div>
            )}
            
            <div className="w-full max-w-[300px]">
              <label htmlFor="email" className="text-sm">Correo:</label>
              <input 
                required 
                type="email" 
                name="email" 
                id="email" 
                value={loginData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full border ${errors.email ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2 disabled:opacity-75`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <PasswordField
              value={loginData.password}
              onChange={handlePasswordChange}
              onValidityChange={handleValidityChange}
              showRequirements={true}
              requireValidation={true}
              label="Contraseña"
              error={errors.password}
              name="password"
              disabled={loading}
            />

            <div className="w-full flex justify-center"> 
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
            
            <div className="text-center">
              <label className="text-[12px]">
                ¿No tiene cuenta?  
                <Link
                  href="/auth/register"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Regístrese ahora
                </Link>
              </label>
              <br/>
              <label className="text-[12px]">
                ¿Olvidaste tu contraseña? 
                <Link
                  href="/auth/recovery"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Recupérala
                </Link>
              </label>
            </div>
          </form>
        </section>
      </main>
    </>
  );
  }else{
    return(
      <LoadingCar redirect={false}></LoadingCar>
    )
  }
}