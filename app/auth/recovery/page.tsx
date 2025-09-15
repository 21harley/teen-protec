'use client'
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import Image from "next/image"
import svg from "./../../public/logos/logo_texto.svg"
import Link from "next/link"
import { useEffect, useState } from "react"
import PasswordField from "@/components/passwordField/passwordField"

type Errors = {
  confirmPassword?: string;
  submit?: string;
};

type RecoveryStep = 'email' | 'code' | 'password' | 'final';

export default function PasswordRecovery() {
  const [data, setData] = useState({
    email: "",
    code: "",
    iv: "",
    newPassword: ""
  })
  const [errors, setErrors] = useState<Errors>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<RecoveryStep>('email'); // Controlar el paso actual

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData(data => ({
      ...data,
      newPassword: e.target.value
    }));
  };

  const handlePasswordValidityChange = (isValid: boolean) => {
    setIsPasswordValid(isValid);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setIsConfirmPasswordValid(e.target.value === data.newPassword);
  };
  const ruteKeys = ["email","code","password","final"];
  const fetchData = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const currentIndex = ruteKeys.findIndex(k => k === step);
      if (currentIndex >= 0 && currentIndex < ruteKeys.length - 1) {
        setStep(ruteKeys[currentIndex + 1] as RecoveryStep);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };
  useEffect(()=>{
    console.log(step);
    if(step){

    }
  },[step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!data.email) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }
    
    if (!validateEmail(data.email)) {
      setError('Por favor ingrese un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const dataResponse = await fetchData('/api/auth/recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          iv : data.iv,
          email: data.email, 
          code: data.code, 
          newPassword: data.newPassword 
        })
      });
      
      // Actualizar el estado con la respuesta del servidor
      setData(prev => ({ ...prev, ...dataResponse.data }));
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Error al enviar el correo de recuperación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <div className="w-full max-w-[190px]">
        <label htmlFor="email" className="text-sm">Ingrese Correo:</label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          value={data.email}
          onChange={(e) => {
            setData({ ...data, email: e.target.value })
            setError('')
          }}
          placeholder="correo@ejemplo.com"
          className={`w-full border ${error ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
          disabled={isSubmitting}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
      
      <div className="w-full flex justify-center"> 
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Código'}
        </button>
      </div>
    </>
  );

  const renderCodeStep = () => (
    <>
      <div className="w-full max-w-[190px]">
        <label htmlFor="code" className="text-sm">Ingrese Código:</label>
        <input 
          type="text" 
          name="code" 
          id="code" 
          value={data.code}
          onChange={(e) => {
            setData({ ...data, code: e.target.value })
            setError('')
          }}
          className={`w-full border ${error ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
          disabled={isSubmitting}
          placeholder="Código de verificación"
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-xs mt-1">
            ¡Correo enviado! Por favor revise su bandeja de entrada.
          </p>
        )}
      </div>
      
      <div className="w-full flex justify-center"> 
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Verificando...' : 'Verificar Código'}
        </button>
      </div>
    </>
  );

  const renderPasswordStep = () => (
    <>
      {/* Componente de contraseña principal */}
      <div className="w-full max-w-[190px]">
        <PasswordField
          value={data.newPassword}
          onChange={handlePasswordChange}
          onValidityChange={handlePasswordValidityChange}
          showRequirements={true}
          requireValidation={true}
          label="Nueva Contraseña"
          name="password"
          disabled={isSubmitting}
        />
      </div>
      
      {/* Componente de confirmación de contraseña */}
      <div className="w-full max-w-[190px]">
        <label htmlFor="confirmPassword" className="text-sm">Repetir nueva contraseña:</label>
        <input 
          required
          type="password"
          name="confirmPassword" 
          id="confirmPassword" 
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={isSubmitting}
          className={`max-w-[300px] w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
        )}
        {confirmPassword && data.newPassword !== confirmPassword && (
          <p className="text-red-500 text-xs">Las contraseñas no coinciden</p>
        )}
        {confirmPassword && data.newPassword === confirmPassword && (
          <p className="text-green-500 text-xs">Las contraseñas coinciden</p>
        )}
      </div>
      
      <div className="w-full flex justify-center"> 
        <button
          type="submit"
          disabled={isSubmitting || !isPasswordValid || !isConfirmPasswordValid}
          className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Procesando...' : 'Restablecer Contraseña'}
        </button>
      </div>
    </>
  );
  
  const message = () =>{
    return (
      <>
      <p className="text-center">
        Cambio de clave completado con exito, por favor ingrese al login y  <Link
                  href="/auth/login"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Inicie Sesión
                </Link>
      </p>
      </>
    )
  }

  const getSubmitHandler = () => handleSubmit;

  return (
    <>
      <Header />
      <main>
        <section className="_color_four h-full min-h-[80dvh] grid place-items-center p-5">
          <form 
            onSubmit={getSubmitHandler()}
            className="p-8 max-w-[400px] w-full flex flex-col items-center justify-center gap-4 _color_seven rounded-[10px]"
          >
            <div>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de TeenProtec"
                priority
              />
            </div>
            
            <h2 className="text-lg font-semibold">
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'code' && 'Verificar Código'}
              {step === 'password' && 'Nueva Contraseña'}
            </h2>
            
            {step === 'email' && renderEmailStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'password' && renderPasswordStep()}
            {step === 'final' && message()}
            
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
                ¿Tiene cuenta?
                <Link
                  href="/auth/login"
                  className="_text_color_eight hover:underline ml-1"
                >
                  Inicie Sesión
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