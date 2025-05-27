'use client'
import Image from "next/image"
import svg from "./../../app/public/logos/logo_texto.svg"
import Link from "next/link"
import React,{useState} from "react"

type Errors = {
  confirmPassword?: string;
};

export default function FormUser(){
  // Estado para los datos del usuario
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    ci: '',
    birthDate: ''
  });

  // Estado para los datos del tutor
  const [tutorData, setTutorData] = useState({
    ci: '',
    fullName: '',
    job: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Errors>({});
  // Estado para controlar la visibilidad del formulario del tutor
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [isMinor, setIsMinor] = useState(false);

  // Manejar cambios en los inputs del usuario
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación especial para la fecha de nacimiento
    if (name === 'birthDate') {
      validateAge(value);
    }
  };

  // Manejar cambios en los inputs del tutor
  const handleTutorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTutorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar si es menor de 18 años
  const validateAge = (birthDate: string) => {
    if (!birthDate) {
      setIsMinor(false);
      setShowTutorForm(false);
      return;
    }

    const today = new Date();
    const birthDateObj = new Date(birthDate);
    const age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    const isUnder18 = age < 18 || (age === 18 && monthDiff < 0);
    
    setIsMinor(isUnder18);
    setShowTutorForm(isUnder18);
  };

  // Validar contraseñas coincidan
  const validatePasswords = () => {
    if (userData.password !== userData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Las contraseñas no coinciden'
      }));
      return false;
    }
    return true;
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar contraseñas
    if (!validatePasswords()) return;
    
    // Validar que si es menor, los datos del tutor estén completos
    if (isMinor) {
      const tutorFields = Object.values(tutorData);
      if (tutorFields.some(field => !field)) {
        alert('Por favor complete todos los datos del tutor');
        return;
      }
    }
    
    // Aquí iría la lógica para enviar los datos al servidor
    console.log('Datos del usuario:', userData);
    if (isMinor) {
      console.log('Datos del tutor:', tutorData);
    }
    
    // Resetear formulario
    setUserData({
      username: '',
      password: '',
      confirmPassword: '',
      ci: '',
      birthDate: ''
    });
    
    setTutorData({
      ci: '',
      fullName: '',
      job: '',
      phone: '',
      email: ''
    });
    
    setShowTutorForm(false);
    setIsMinor(false);
    setErrors({});
  };

  return (
    <>
          <form 
            onSubmit={handleSubmit}
            className="p-8 max-w-[400px] md:max-w-[600px] w-full flex flex-col items-center justify-between _color_seven rounded-[10px]"
          >
            <div>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo"
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-around p-5 gap-1 w-full max-w-[400px] md:max-w-[800px]">
              <div className="grid place-items-center">
                <div className="w-full max-w-[190px]">
                  <label htmlFor="username" className="text-sm">Nombre usuario o correo:</label>
                  <input 
                    required 
                    type="text" 
                    name="username" 
                    id="username" 
                    value={userData.username}
                    onChange={handleUserChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                
                <div className="w-full max-w-[190px]">
                  <label htmlFor="password" className="text-sm">Contraseña:</label>
                  <input 
                    required 
                    type="password" 
                    name="password" 
                    id="password" 
                    value={userData.password}
                    onChange={handleUserChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                
                <div className="w-full max-w-[190px]">
                  <label htmlFor="confirmPassword" className="text-sm">Repetir contraseña:</label>
                  <input 
                    required 
                    type="password" 
                    name="confirmPassword" 
                    id="confirmPassword" 
                    value={userData.confirmPassword}
                    onChange={handleUserChange}
                    className={`max-w-[300px] w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="w-full max-w-[190px]">
                  <label htmlFor="ci" className="text-sm">Cédula:</label>
                  <input 
                    required 
                    type="text" 
                    name="ci" 
                    id="ci" 
                    value={userData.ci}
                    onChange={handleUserChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                
                <div className="w-full max-w-[190px]">
                  <label htmlFor="birthDate" className="text-sm">Fecha de nacimiento:</label>
                  <input 
                    required 
                    type="date" 
                    name="birthDate" 
                    id="birthDate" 
                    value={userData.birthDate}
                    onChange={handleUserChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                  {isMinor && (
                    <p className="text-yellow-600 text-xs mt-1">Menor de edad - Se requieren datos del tutor</p>
                  )}
                </div>
              </div>
              
              {/* Formulario del tutor - Solo visible si es menor de edad */}
              {showTutorForm && (
                <div className="w-[240px] border border-[#8f8f8f] rounded-[0.4rem] p-4">
                  <h2 className="text-sm">Datos de tutor:</h2>
                  <hr className="my-1" />
                  <div className="w-full grid place-items-center"> 
                    <div className="w-full max-w-[190px]">
                      <label htmlFor="tutorCi" className="text-sm">Cédula:</label>
                      <input 
                        required={isMinor}
                        type="text" 
                        name="ci" 
                        id="tutorCi" 
                        value={tutorData.ci}
                        onChange={handleTutorChange}
                        className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                      />
                    </div>
                    
                    <div className="w-full max-w-[190px]">
                      <label htmlFor="fullName" className="text-sm">Nombre completo:</label>
                      <input 
                        required={isMinor}
                        type="text" 
                        name="fullName" 
                        id="fullName" 
                        value={tutorData.fullName}
                        onChange={handleTutorChange}
                        className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                      />
                    </div>
                    
                    <div className="w-full max-w-[190px]">
                      <label htmlFor="job" className="text-sm">Profesión del tutor:</label>
                      <input 
                        required={isMinor}
                        type="text" 
                        name="job" 
                        id="job" 
                        value={tutorData.job}
                        onChange={handleTutorChange}
                        className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                      />
                    </div>
                    
                    <div className="w-full max-w-[190px]">
                      <label htmlFor="phone" className="text-sm">Teléfono contacto:</label>
                      <input 
                        required={isMinor}
                        type="tel" 
                        name="phone" 
                        id="phone" 
                        value={tutorData.phone}
                        onChange={handleTutorChange}
                        className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                      />
                    </div>
                    
                    <div className="w-full max-w-[190px]">
                      <label htmlFor="email" className="text-sm">Correo contacto:</label>
                      <input 
                        required={isMinor}
                        type="email" 
                        name="email" 
                        id="email" 
                        value={tutorData.email}
                        onChange={handleTutorChange}
                        className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                      />
                    </div>
                    <div className="flex justify-end items-center w-full p-1 mt-2">
                       <button
                       type="button"
                        className=" text-sm bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition  max-w-[120px] w-full p-1 h-7 "
                       > Agregar tutor +</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-[190px] flex justify-center mt-2 mb-5"> 
              <button
                type="submit"
                className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800"
              >
                Registro
              </button>
            </div>
            
            <div>
              <label htmlFor="" className="text-[10px]">
                ¿Ya tiene una cuenta?  
                <Link
                  href="/auth/login"
                  className={`_text_color_eight hover:underline`}
                > Iniciar sesión</Link>
              </label>
              <br/>
              <label htmlFor="" className="text-[10px]">
                ¿Olvidaste tu contraseña? 
                <Link
                  href="/auth/recovery"
                  className={`_text_color_eight hover:underline`}
                > Recuperala</Link>
              </label>
            </div>
          </form>
    </>
  );
}