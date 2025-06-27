'use client'
import Image from "next/image"
import svg from "./../../app/public/logos/logo_texto.svg"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import { TipoRegistro, UsuarioBase, UsuarioCompleto, LoginResponse } from "./../../app/types/user/index"
import { TutorData, PsicologoData } from "./../../app/types/user/dataDB"
import useUserStore from "./../../app/store/store"
import { StorageManager } from "@/app/lib/storageManager"
import { useRouter } from "next/navigation"
import {UsuarioInfo} from "./../../app/types/user"

type Errors = {
  confirmPassword?: string;
  submit?: string;
};

type FormUserProps = {
  user?: UsuarioCompleto;
  isEdit?: boolean;
  onSubmit?: (data: any) => void;
  tipoRegistro?: TipoRegistro;
  isAdminSession?: boolean;
  endEditandCreate?: boolean;
  onToggleEditAndCreate?: (newValue: boolean) => void; 
};

function formatDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

export default function FormUser({ 
  user, 
  isEdit = false, 
  tipoRegistro = 'usuario',
  isAdminSession = false,
  onToggleEditAndCreate
}: FormUserProps) {
  const { login } = useUserStore()
  const storageManager = new StorageManager("local");
  const user_stora = storageManager.load<UsuarioInfo>("userData");
  const router = useRouter()
  
  const [userData, setUserData] = useState<UsuarioBase>({
    email: '',
    password: '',
    nombre: '',
    cedula: '',
    fecha_nacimiento: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [tutorData, setTutorData] = useState<TutorData>({
    cedula_tutor: '',
    nombre_tutor: '',
    profesion_tutor: '',
    telefono_contacto: '',
    correo_contacto: ''
  });

  const [psicologoData, setPsicologoData] = useState<PsicologoData>({
    numero_de_titulo: '',
    nombre_universidad: '',
    monto_consulta: 0,
    telefono_trabajo: '',
    redes_sociales: []
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isMinor, setIsMinor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentTipoRegistro, setCurrentTipoRegistro] = useState<TipoRegistro>(tipoRegistro);

  useEffect(() => {
    if (user && isEdit) {
      console.log(user,"Form-Edit");
      setUserData({
        email: user.email,
        password: '',
        nombre: user.nombre,
        cedula: user.cedula,
        fecha_nacimiento: formatDateForInput(user.fecha_nacimiento)
      });

      if (user.tutorInfo) {
        console.log("Tutor");
        setTutorData({
          cedula_tutor: user.tutorInfo.cedula,
          nombre_tutor: user.tutorInfo.nombre,
          profesion_tutor: user.tutorInfo.profesion_tutor || '',
          telefono_contacto: user.tutorInfo.telefono_contacto || '',
          correo_contacto: user.tutorInfo.correo_contacto || ''
        });
        setIsMinor(true);
        setCurrentTipoRegistro('adolescente');
      }

      if (user.psicologoInfo) {
         console.log("Psicologo");
        setPsicologoData({
          numero_de_titulo: user.psicologoInfo.numero_de_titulo,
          nombre_universidad: user.psicologoInfo.nombre_universidad,
          monto_consulta: user.psicologoInfo.monto_consulta,
          telefono_trabajo: user.psicologoInfo.telefono_trabajo,
          redes_sociales: user.psicologoInfo.redes_sociales || []
        });
        setCurrentTipoRegistro('psicologo');
      }
    }
  }, [user, isEdit]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors.confirmPassword || errors.submit) {
      setErrors({});
    }
    
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'fecha_nacimiento') {
      console.log(value,name);
      validateAge(value);
    }
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
    
    const minor = age < 18;
    setIsMinor(minor);
    
    // Solo actualizamos el tipo de registro si no estamos en modo edición o es admin session
    if ((!isEdit || isAdminSession) && !isAdminSession) {
      setCurrentTipoRegistro(minor ? 'adolescente' : 'usuario');
    }
  };

  const validatePasswords = () => {
    if ((!isEdit || userData.password) && userData.password !== confirmPassword) {
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
    
    if ((!isEdit || userData.password) && !validatePasswords()) {
      setIsSubmitting(false);
      return;
    }
    
    if (currentTipoRegistro === 'adolescente') {
      const requiredTutorFields = ['profesion_tutor', 'telefono_contacto', 'correo_contacto', 'cedula_tutor', 'nombre_tutor'];
      const missingFields = requiredTutorFields.filter(field => !tutorData[field as keyof typeof tutorData]);
      if (missingFields.length > 0) {
        setErrors({ submit: 'Por favor complete todos los datos del tutor' });
        setIsSubmitting(false);
        return;
      }
    }
    
    if (currentTipoRegistro === 'psicologo') {
      const requiredPsicologoFields = ['numero_de_titulo', 'nombre_universidad', 'monto_consulta', 'telefono_trabajo'];
      const missingFields = requiredPsicologoFields.filter(field => !psicologoData[field as keyof typeof psicologoData]);
      
      if (missingFields.length > 0) {
        setErrors({ submit: 'Por favor complete todos los datos del psicólogo' });
        setIsSubmitting(false);
        return;
      }
    }
    
    const requestData = {
      ...(isEdit && user?.id && { id: user.id }),
      tipoRegistro: currentTipoRegistro,
      usuarioData: {
        ...userData,
        ...(isEdit && !userData.password && { password: undefined }),
      },
      ...(currentTipoRegistro === 'adolescente' && { tutorData }),
      ...(currentTipoRegistro === 'psicologo' && { psicologoData })
    };

    try {
        const endpoint = isEdit ? '/api/usuario' : '/api/usuario';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Error en ${isEdit ? 'actualización' : 'registro'}`);
        }

        setSuccessMessage(isEdit ? 'Usuario actualizado correctamente!' : 'Usuario registrado correctamente!');
        
        if((isEdit || user_stora == null) && !isAdminSession){
            login( data.user,
            data.user.resetPasswordToken ?? "",
            data.user.resetPasswordTokenExpiry
              ? (typeof data.resetPasswordTokenExpiry === "string"
                  ? new Date(data.resetPasswordTokenExpiry)
                  : data.resetPasswordTokenExpiry)
              : new Date()
              )
          storageManager.save<UsuarioInfo>("userData", data.user);
        }
        
        if (!isEdit) {
          setUserData({
            email: '',
            password: '',
            nombre: '',
            cedula: '',
            fecha_nacimiento: ''
          });
          
          setTutorData({
            cedula_tutor: '',
            nombre_tutor: '',
            profesion_tutor: '',
            telefono_contacto: '',
            correo_contacto: ''
          });
          
          setPsicologoData({
            numero_de_titulo: '',
            nombre_universidad: '',
            monto_consulta: 0,
            telefono_trabajo: '',
            redes_sociales: []
          });
          
          setIsMinor(false);
          setConfirmPassword('');
          setCurrentTipoRegistro('usuario');
  
          if(user_stora == null && !isAdminSession) router.push('/');
          
          if(isAdminSession && typeof onToggleEditAndCreate === 'function'){
            onToggleEditAndCreate(true)
          }
        }
    } catch (error: any) {
      console.error('Error:', error);
      setErrors({ submit: error.message || (isEdit ? 'Error al actualizar el usuario' : 'Error al registrar el usuario') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="md:p-8 max-w-[400px] md:max-w-[600px] w-full flex flex-col items-center justify-between _color_seven rounded-[10px] m-auto"
    >
      {
        (isAdminSession)?(<></>):(
      <div>
        <Image
          src={svg}
          width={180}
          height={90}
          alt="Logo"
        />
      </div>
        )
      }

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
          {!isEdit && isAdminSession && (
            <div className="w-full max-w-[190px]">
              <label htmlFor="tipoRegistro" className="text-sm">Tipo de registro:</label>
              <select
                id="tipoRegistro"
                name="tipoRegistro"
                value={currentTipoRegistro}
                onChange={(e) => {
                  setCurrentTipoRegistro(e.target.value as TipoRegistro);
                  // Si seleccionan adolescente, forzar isMinor a true
                  if (e.target.value === 'adolescente') {
                    setIsMinor(true);
                  } else if (e.target.value === 'usuario') {
                    setIsMinor(false);
                  }
                }}
                className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              >
                <option value="usuario">Usuario Adulto</option>
                <option value="adolescente">Adolescente</option>
                <option value="psicologo">Psicólogo</option>
              </select>
            </div>
          )}
          
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
          
          {!isEdit && (
            <>
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`max-w-[300px] w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {isEdit && (
            <>
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
            </>
          )}
          
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
              readOnly={isEdit}
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
            {isMinor && currentTipoRegistro !== 'adolescente' && !isAdminSession && (
              <p className="text-yellow-600 text-xs mt-1">Se registrará como adolescente (requiere datos de tutor)</p>
            )}
          </div>
        </div>
        
        {/* Formulario del tutor - Mostrar si es adolescente o si estamos editando un adolescente */}
        {( (isMinor || isEdit || currentTipoRegistro === 'adolescente')) && (
          <div className="w-[240px] h-[336px] flex flex-col gap-2 m-auto">
            <div>
              <h2 className="text-sm">Datos de tutor:</h2>
              <hr className="my-1" />
            </div>
            <div className="w-[240px] border border-[#8f8f8f] rounded-[0.4rem] p-4 pt-1 m-auto">
              <div className="w-full h-[90%] grid place-items-center"> 
                <div className="w-full max-w-[190px]">
                  <label htmlFor="cedula_tutor" className="text-sm">Cédula del tutor:</label>
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

        {/* Formulario del psicólogo - Mostrar si es psicólogo y es admin session o si estamos editando un psicólogo */}
        {(currentTipoRegistro === 'psicologo' && (isAdminSession || isEdit)) && (
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

      <div className="w-full max-w-[190px] flex justify-center mt-2 mb-5"> 
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-300 cursor-pointer text-stone-50 text-center rounded transition max-w-[180px] w-full h-8 hover:bg-blue-800 disabled:bg-gray-400"
        >
          {isSubmitting 
            ? (isEdit ? 'Actualizando...' : 'Registrando...') 
            : (isEdit ? 'Actualizar' : 'Registrar')}
        </button>
      </div>
      
      {!isEdit && !isAdminSession && (
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
      )}
    </form>
  );
}