'use client'
import React, { useState, useEffect } from "react"
import { UsuarioCompleto, TutorInfo } from "./../../app/types/gestionPaciente/index"
import { useRouter } from "next/navigation"

type Errors = {
  confirmPassword?: string;
  submit?: string;
};

type FormPacientesProps = {
  user: UsuarioCompleto;
  onSubmit: (data: any) => void;
  psicologoId:number;
  isAdminSession?: boolean;
  onToggleEdit?: (newValue: boolean) => void; 
};

function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

export default function FormPacientes({ 
  user, 
  onSubmit,
  isAdminSession = false,
  onToggleEdit
}: FormPacientesProps) {
  const router = useRouter();
  
  const [userData, setUserData] = useState({
    email: user.email,
    password: '',
    nombre: user.nombre,
    cedula: user.cedula,
    fecha_nacimiento: formatDateForInput(user.fecha_nacimiento)
  });

  const [tutorData, setTutorData] = useState<TutorInfo>({
    cedula: user.adolecente?.tutor?.cedula || '',
    nombre: user.adolecente?.tutor?.nombre || '',
    profesion_tutor: user.adolecente?.tutor?.profesion_tutor || '',
    telefono_contacto: user.adolecente?.tutor?.telefono_contacto || '',
    correo_contacto: user.adolecente?.tutor?.correo_contacto || ''
  });

  const [psicologoData, setPsicologoData] = useState({
    numero_de_titulo: user.psicologo?.numero_de_titulo || '',
    nombre_universidad: user.psicologo?.nombre_universidad || '',
    monto_consulta: user.psicologo?.monto_consulta || 0,
    telefono_trabajo: user.psicologo?.telefono_trabajo || '',
    redes_sociales: user.psicologo?.redes_sociales || []
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors.confirmPassword || errors.submit) {
      setErrors({});
    }
    
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTutorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTutorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePsicologoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPsicologoData(prev => ({
      ...prev,
      [name]: name === 'monto_consulta' ? Number(value) : value
    }));
  };

  const validatePasswords = () => {
    if (userData.password && userData.password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    
    if (!validatePasswords()) {
      setIsSubmitting(false);
      return;
    }
    
    if (user.esAdolescente) {
      const requiredTutorFields = ['profesion_tutor', 'telefono_contacto', 'correo_contacto', 'cedula', 'nombre'];
      const missingFields = requiredTutorFields.filter(field => !tutorData[field as keyof typeof tutorData]);
      if (missingFields.length > 0) {
        setErrors({ submit: 'Por favor complete todos los datos del tutor' });
        setIsSubmitting(false);
        return;
      }
    }
    
    if (user.esPsicologo) {
      const requiredPsicologoFields = ['numero_de_titulo', 'nombre_universidad', 'monto_consulta', 'telefono_trabajo'];
      const missingFields = requiredPsicologoFields.filter(field => !psicologoData[field as keyof typeof psicologoData]);
      
      if (missingFields.length > 0) {
        setErrors({ submit: 'Por favor complete todos los datos del psicólogo' });
        setIsSubmitting(false);
        return;
      }
    }
    
    const requestData = {
      id: user.id,
      usuarioData: {
        ...userData,
        ...(!userData.password && { password: undefined }),
      },
      ...(user.esAdolescente && { tutorData }),
      ...(user.esPsicologo && { psicologoData })
    };

    try {
      const response = await onSubmit(requestData);
      
      setSuccessMessage('Usuario actualizado correctamente!');
      
      if (typeof onToggleEdit === 'function') {
        onToggleEdit(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setErrors({ submit: error.message || 'Error al actualizar el usuario' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="md:p-8 max-w-[400px] md:max-w-[600px] w-full flex flex-col items-center justify-between _color_seven rounded-[10px] m-auto"
    >
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errors.submit && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {errors.submit}
        </div>
      )}

      <div className="flex flex-col justify-center md:flex-row md:justify-around p-5 gap-2 md:gap-2 w-full max-w-[400px] md:max-w-[800px]">
        <div className="grid place-items-center w-[240px] m-auto">
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
            <label htmlFor="password" className="text-sm">Nueva contraseña (opcional):</label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              value={userData.password}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
          
          <div className="w-full max-w-[190px]">
            <label htmlFor="confirmPassword" className="text-sm">Confirmar nueva contraseña:</label>
            <input 
              type="password" 
              name="confirmPassword" 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              readOnly
            />
          </div>
          
          <div className="w-full max-w-[190px]">
            <label htmlFor="fecha_nacimiento" className="text-sm">Fecha de nacimiento:</label>
            <input 
              required 
              type="date" 
              name="fecha_nacimiento" 
              id="fecha_nacimiento" 
              value={formatDateForInput(userData.fecha_nacimiento)}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
        </div>
        
        {/* Formulario del tutor - Mostrar si es adolescente */}
        {user.esAdolescente && (
          <div className="w-[240px] h-[336px] flex flex-col gap-2 m-auto">
            <div>
              <h2 className="text-sm">Datos de tutor:</h2>
              <hr className="my-1" />
            </div>
            <div className="w-[240px] border border-[#8f8f8f] rounded-[0.4rem] p-4 pt-1 m-auto">
              <div className="w-full h-[90%] grid place-items-center"> 
                <div className="w-full max-w-[190px]">
                  <label htmlFor="cedula" className="text-sm">Cédula del tutor:</label>
                  <input 
                    required
                    type="text" 
                    name="cedula" 
                    id="cedula_tutor" 
                    value={tutorData.cedula}
                    onChange={handleTutorChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                <div className="w-full max-w-[190px]">
                  <label htmlFor="nombre" className="text-sm">Nombre completo del tutor:</label>
                  <input 
                    required
                    type="text" 
                    name="nombre" 
                    id="nombre_tutor" 
                    value={tutorData.nombre}
                    onChange={handleTutorChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
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
          </div>
        )}

        {/* Formulario del psicólogo - Mostrar si es psicólogo */}
        {user.esPsicologo && (
          <div className="w-[240px] h-[336px] flex flex-col gap-2 m-auto">
            <div>
              <h2 className="text-sm">Datos de psicólogo:</h2>
              <hr className="my-1" />
            </div>
            <div className="w-full h-[90%] border border-[#8f8f8f] rounded-[0.4rem] p-4 pt-0.5">
              <div className="w-full h-full grid place-items-center"> 
                <div className="w-full max-w-[190px]">
                  <label htmlFor="numero_de_titulo" className="text-sm">Número de título:</label>
                  <input 
                    required
                    type="text" 
                    name="numero_de_titulo" 
                    id="numero_de_titulo" 
                    value={psicologoData.numero_de_titulo}
                    onChange={handlePsicologoChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                <div className="w-full max-w-[190px]">
                  <label htmlFor="nombre_universidad" className="text-sm">Universidad:</label>
                  <input 
                    required
                    type="text" 
                    name="nombre_universidad" 
                    id="nombre_universidad" 
                    value={psicologoData.nombre_universidad}
                    onChange={handlePsicologoChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                <div className="w-full max-w-[190px]">
                  <label htmlFor="monto_consulta" className="text-sm">Monto de consulta ($):</label>
                  <input 
                    required
                    type="number" 
                    name="monto_consulta" 
                    id="monto_consulta" 
                    value={psicologoData.monto_consulta}
                    onChange={handlePsicologoChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                <div className="w-full max-w-[190px]">
                  <label htmlFor="telefono_trabajo" className="text-sm">Teléfono de trabajo:</label>
                  <input 
                    required
                    type="tel" 
                    name="telefono_trabajo" 
                    id="telefono_trabajo" 
                    value={psicologoData.telefono_trabajo}
                    onChange={handlePsicologoChange}
                    className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[190px] flex justify-center mt-2 mb-5 gap-4"> 
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 cursor-pointer text-white text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar'}
        </button>
        
        {typeof onToggleEdit === 'function' && (
          <button
            type="button"
            onClick={() => onToggleEdit(false)}
            className="bg-gray-300 cursor-pointer text-gray-700 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-gray-400"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}