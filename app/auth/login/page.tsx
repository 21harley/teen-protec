'use client'
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import Image from "next/image"
import svg from "./../../public/logos/logo_texto.svg"
import Link from "next/link"
import { useState } from "react"
import { apiPost } from './../../lib/apiClient';
import { StorageManager } from "@/app/lib/storageManager"
import { AuthResponse } from "./../../types/user"
export default function Login(){
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: '',
      password: ''
    };

    if (!loginData.username.trim()) {
      newErrors.username = 'Este campo es requerido';
      valid = false;
    }

    if (!loginData.password) {
      newErrors.password = 'Este campo es requerido';
      valid = false;
    } else if (loginData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Aquí iría la lógica para enviar los datos al servidor
      console.log('Datos de login:', loginData);
    try {
        const response = await apiPost<AuthResponse>('/auth/login', { email: loginData.username, password: loginData.password });
  
        // Guardar datos del usuario en contexto o estado global
        //console.log('Login exitoso:', response.user);
        const localStorageManager = new StorageManager('local');
        localStorageManager.save<AuthResponse>("userData",response);

      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.log(err);
      //setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      console.log("finally");
      //setLoading(false);
    }
      // Resetear formulario (opcional)
      // setLoginData({ username: '', password: '' });
    }
  };

  return (
    <>
      <Header />
      <main>
        <section className="_color_four h-full min-h-[80dvh] grid place-items-center p-5">
          <form 
            onSubmit={handleSubmit}
            className="p-8 max-w-[400px] w-full flex flex-col items-center justify-center gap-4 _color_seven rounded-[10px]"
          >
            <div>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de la empresa"
                priority
              />
            </div>
            
            <div className="w-full max-w-[190px]">
              <label htmlFor="username" className="text-sm">Nombre usuario o correo:</label>
              <input 
                required 
                type="text" 
                name="username" 
                id="username" 
                value={loginData.username}
                onChange={handleChange}
                className={`w-full border ${errors.username ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>
            
            <div className="w-full max-w-[190px]">
              <label htmlFor="password" className="text-sm">Contraseña:</label>
              <input 
                required 
                type="password" 
                name="password" 
                id="password" 
                value={loginData.password}
                onChange={handleChange}
                className={`w-full border ${errors.password ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            
            <div className="w-full flex justify-center"> 
              <button
                type="submit"
                className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800"
              >
                Iniciar sesión
              </button>
            </div>
            
            <div className="text-center">
              <label className="text-[10px]">
                ¿No tiene cuenta?  
                <Link
                  href="/auth/register"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Regístrese ahora
                </Link>
              </label>
              <br/>
              <label className="text-[10px]">
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
      <Footer />
    </>
  )
}