'use client'
import Image from "next/image"
import svg from "./../../app/public/logos/logo_texto.svg"
import Link from "next/link"
import React, { useState } from "react"

type Errors = {
  confirmPassword?: string;
};

export default function FormUser() {
  // Estado para los datos del usuario
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    cedula: '',
    fecha_nacimiento: ''
  });

  // Estado para los datos del tutor
  const [tutorData, setTutorData] = useState({
    cedula_tutor:'',
    nombre_tutor:'',
    profesion_tutor: '',
    telefono_contacto: '',
    correo_contacto: ''
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isMinor, setIsMinor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar cambios en los inputs del usuario
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     if(errors.confirmPassword){
       if(validatePasswords()) setErrors({confirmPassword: ''})
     }
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación especial para la fecha de nacimiento
    if (name === 'fecha_nacimiento') {
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
  const validateAge = (fecha_nacimiento: string) => {
    if (!fecha_nacimiento) {
      setIsMinor(false);
      return;
    }

    const today = new Date();
    const birthDate = new Date(fecha_nacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setIsMinor(age < 18);
  };

  // Validar contraseñas coincidan
  const validatePasswords = () => {
    if (userData.password !== userData.confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return false;
    }
    return true;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validar contraseñas
    if (!validatePasswords()) {
      setIsSubmitting(false);
      return;
    }
    
    // Validar que si es menor, los datos del tutor estén completos
    if (isMinor) {
      const requiredTutorFields = ['profesion_tutor', 'telefono_contacto', 'correo_contacto'];
      const missingFields = requiredTutorFields.filter(field => !tutorData[field as keyof typeof tutorData]);
      
      if (missingFields.length > 0) {
        alert('Por favor complete todos los datos del tutor');
        setIsSubmitting(false);
        return;
      }
    }
    
    // Preparar los datos para enviar al endpoint
    const requestData = {
      tipoRegistro: isMinor ? 'adolescente' : 'usuario',
      usuarioData: {
        email: userData.email,
        password: userData.password,
        nombre: userData.nombre,
        cedula: userData.cedula,
        fecha_nacimiento: userData.fecha_nacimiento
      },
      ...(isMinor && { tutorData })
    };

    try {
      console.log(requestData)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      // Registro exitoso
      alert('Registro exitoso!');
      
      // Resetear formulario
      setUserData({
        email: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        cedula: '',
        fecha_nacimiento: ''
      });
      
      setTutorData({
        cedula_tutor:'',
        nombre_tutor:'',
        profesion_tutor: '',
        telefono_contacto: '',
        correo_contacto: ''
      });
      
      setIsMinor(false);
      setErrors({});

    } catch (error: any) {
      console.error('Error en el registro:', error);
      alert(error.message || 'Error al registrar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <label htmlFor="email" className="text-sm">Correo electrónico:</label>
            <input 
              required 
              type="email" 
              name="email" 
              id="email" 
              value={userData.email}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
          
          <div className="w-full max-w-[190px]">
            <label htmlFor="nombre" className="text-sm">Nombre completo:</label>
            <input 
              required 
              type="text" 
              name="nombre" 
              id="nombre" 
              value={userData.nombre}
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
            <label htmlFor="cedula" className="text-sm">Cédula:</label>
            <input 
              required 
              type="text" 
              name="cedula" 
              id="cedula" 
              value={userData.cedula}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
          
          <div className="w-full max-w-[190px]">
            <label htmlFor="fecha_nacimiento" className="text-sm">Fecha de nacimiento:</label>
            <input 
              required 
              type="date" 
              name="fecha_nacimiento" 
              id="fecha_nacimiento" 
              value={userData.fecha_nacimiento}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
            {isMinor && (
              <p className="text-yellow-600 text-xs mt-1">Menor de edad - Se requieren datos del tutor</p>
            )}
          </div>
        </div>
        
        {/* Formulario del tutor - Solo visible si es menor de edad */}
        {isMinor && (
          <div className="w-[240px]  border border-[#8f8f8f] rounded-[0.4rem] p-4">
            <h2 className="text-sm">Datos de tutor:</h2>
            <hr className="my-1" />
            <div className="w-full h-[90%] grid place-items-center"> 
              <div className="w-full max-w-[190px]">
                <label htmlFor="profesion_tutor" className="text-sm">Profesión del tutor:</label>
                <input 
                  required
                  type="text" 
                  name="profesion_tutor" 
                  id="profesion_tutor" 
                  value={tutorData.profesion_tutor}
                  onChange={handleTutorChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
              <div className="w-full max-w-[190px]">
                <label htmlFor="cedula_tutor" className="text-sm">Cedula del tutor:</label>
                <input 
                  required
                  type="text" 
                  name="cedula_tutor" 
                  id="cedula_tutor" 
                  value={tutorData.cedula_tutor}
                  onChange={handleTutorChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
              <div className="w-full max-w-[190px]">
                <label htmlFor="nombre_tutor" className="text-sm">Nombre completo del tutor:</label>
                <input 
                  required
                  type="text" 
                  name="nombre_tutor" 
                  id="nombre_tutor" 
                  value={tutorData.nombre_tutor}
                  onChange={handleTutorChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>              
              <div className="w-full max-w-[190px]">
                <label htmlFor="telefono_contacto" className="text-sm">Teléfono contacto:</label>
                <input 
                  required
                  type="tel" 
                  name="telefono_contacto" 
                  id="telefono_contacto" 
                  value={tutorData.telefono_contacto}
                  onChange={handleTutorChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
              
              <div className="w-full max-w-[190px]">
                <label htmlFor="correo_contacto" className="text-sm">Correo contacto:</label>
                <input 
                  required
                  type="email" 
                  name="correo_contacto" 
                  id="correo_contacto" 
                  value={tutorData.correo_contacto}
                  onChange={handleTutorChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[190px] flex justify-center mt-2 mb-5"> 
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Registrando...' : 'Registro'}
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
  );
}