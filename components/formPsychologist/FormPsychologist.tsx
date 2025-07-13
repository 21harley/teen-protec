'use client'
import Image from "next/image"
import svg from "./../../app/public/logos/logo_texto.svg"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import { PsicologoData } from "./../../app/types/user/dataDB"
import { UsuarioInfo } from "./../../app/types/user"
import useUserStore from "./../../app/store/store"
import { StorageManager } from "@/app/lib/storageManager"
import { useRouter } from "next/navigation"

type Errors = {
  confirmPassword?: string;
  submit?: string;
};

type FormPsychologistProps = {
  user?: UsuarioInfo;
  isEdit?: boolean;
  onSubmit?: (data: any) => void;
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

export default function FormPsychologist({ 
  user, 
  isEdit = false, 
  onToggleEditAndCreate
}: FormPsychologistProps) {
  const { login } = useUserStore()
  const storageManager = new StorageManager("local");
  const user_stora = storageManager.load<UsuarioInfo>("userData");
  const router = useRouter()
  
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    nombre: '',
    cedula: '',
    fecha_nacimiento: '',
    sexo: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [psicologoData, setPsicologoData] = useState<PsicologoData>({
    numero_de_titulo: '',
    nombre_universidad: '',
    monto_consulta: 0,
    telefono_trabajo: '',
    redes_sociales: []
  });

  const [socialNetworks, setSocialNetworks] = useState<{name: string, url: string}[]>([]);
  const [newSocialNetwork, setNewSocialNetwork] = useState({name: '', url: ''});

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtherSexo, setShowOtherSexo] = useState(false);
  const [otherSexoValue, setOtherSexoValue] = useState('');

  useEffect(() => {
    if (user && isEdit) {
      setUserData({
        email: user.email,
        password: '',
        nombre: user.nombre,
        cedula: user.cedula,
        fecha_nacimiento: formatDateForInput(user.fecha_nacimiento ?? undefined),
        sexo: user.sexo || ''
      });

      // Configurar campo de sexo "Otro" si es necesario
      if (user.sexo && !['Masculino', 'Femenino'].includes(user.sexo)) {
        setShowOtherSexo(true);
        setOtherSexoValue(user.sexo);
      }

      if (user.psicologoInfo) {
        setPsicologoData({
          numero_de_titulo: user.psicologoInfo.numero_de_titulo,
          nombre_universidad: user.psicologoInfo.nombre_universidad,
          monto_consulta: user.psicologoInfo.monto_consulta,
          telefono_trabajo: user.psicologoInfo.telefono_trabajo,
          redes_sociales: user.psicologoInfo.redes_sociales || []
        });

        if (user.psicologoInfo.redes_sociales) {
          setSocialNetworks(
            user.psicologoInfo.redes_sociales.map(red => ({
              name: red.nombre_red,
              url: red.url_perfil
            }))
          );
        }
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
  };

  const handleSexoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'Otro') {
      setShowOtherSexo(true);
      setUserData(prev => ({ ...prev, sexo: '' }));
    } else {
      setShowOtherSexo(false);
      setOtherSexoValue('');
      setUserData(prev => ({ ...prev, sexo: value }));
    }
  };

  const handleOtherSexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherSexoValue(value);
    setUserData(prev => ({ ...prev, sexo: value }));
  };

  const handlePsicologoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPsicologoData(prev => ({
      ...prev,
      [name]: name === 'monto_consulta' ? Number(value) : value
    }));
  };

  const handleSocialNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSocialNetwork(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSocialNetwork = () => {
    if (newSocialNetwork.name && newSocialNetwork.url) {
      setSocialNetworks(prev => [...prev, newSocialNetwork]);
      setNewSocialNetwork({ name: '', url: '' });
    }
  };

  const removeSocialNetwork = (index: number) => {
    setSocialNetworks(prev => prev.filter((_, i) => i !== index));
  };

  const validatePasswords = () => {
    if ((!isEdit || userData.password) && userData.password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return false;
    }
    return true;
  };

  const validateSexo = () => {
    if (!userData.sexo) {
      setErrors(prev => ({ ...prev, submit: 'Por favor seleccione su sexo' }));
      return false;
    }

    if (showOtherSexo && !otherSexoValue) {
      setErrors(prev => ({ ...prev, submit: 'Por favor especifique su sexo' }));
      return false;
    }

    return true;
  };

  const validateProfessionalFields = () => {
    const requiredFields = ['numero_de_titulo', 'nombre_universidad', 'monto_consulta'];
    const missingFields = requiredFields.filter(field => !psicologoData[field as keyof typeof psicologoData]);
    
    if (missingFields.length > 0) {
      setErrors({ submit: 'Por favor complete todos los datos profesionales requeridos' });
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
    
    if (!validateSexo()) {
      setIsSubmitting(false);
      return;
    }

    if (!validateProfessionalFields()) {
      setIsSubmitting(false);
      return;
    }
    
    const requestData = {
      ...(isEdit && user?.id && { id: user.id }),
      tipoRegistro: 'psicologo',
      usuarioData: {
        ...userData,
        sexo: showOtherSexo ? otherSexoValue : userData.sexo,
        ...(isEdit && !userData.password && { password: undefined }),
      },
      psicologoData: {
        ...psicologoData,
        redes_sociales: socialNetworks.map(network => ({
          nombre_red: network.name,
          url_perfil: network.url
        }))
      }
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

      setSuccessMessage(isEdit ? 'Perfil actualizado correctamente!' : 'Psicólogo registrado correctamente!');
      
      if((isEdit || user_stora == null)){
        login(
          data.user,
          data.user.resetPasswordToken ?? "",
          data.user.resetPasswordTokenExpiry
            ? (typeof data.resetPasswordTokenExpiry === "string"
                ? new Date(data.resetPasswordTokenExpiry)
                : data.resetPasswordTokenExpiry)
            : new Date()
        );
        storageManager.save<UsuarioInfo>("userData", data.user);
      }
      
      if (!isEdit) {
        setUserData({
          email: '',
          password: '',
          nombre: '',
          cedula: '',
          fecha_nacimiento: '',
          sexo: ''
        });
        
        setPsicologoData({
          numero_de_titulo: '',
          nombre_universidad: '',
          monto_consulta: 0,
          telefono_trabajo: '',
          redes_sociales: []
        });
        
        setSocialNetworks([]);
        setConfirmPassword('');
        setShowOtherSexo(false);
        setOtherSexoValue('');
        setNewSocialNetwork({name: '', url: ''});

        if(user_stora == null ) router.push('/');
        
        if( typeof onToggleEditAndCreate === 'function'){
          onToggleEditAndCreate(true);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setErrors({ submit: error.message || (isEdit ? 'Error al actualizar el perfil' : 'Error al registrar el psicólogo') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="md:p-6 w-auto flex flex-col items-center justify-between _color_seven rounded-[10px] m-auto"
    >
      <div>
        <Image
          src={svg}
          width={180}
          height={90}
          alt="Logo"
        />
      </div>
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
              disabled={isEdit}
            />
          </div>
          
          <div className="w-full max-w-[190px]">
            <label htmlFor="nombre" className="text-sm">Nombre y Apellido:</label>
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
            <label htmlFor="sexo" className="text-sm">Sexo:</label>
            <select
              name="sexo"
              id="sexo"
              value={showOtherSexo ? 'Otro' : userData.sexo}
              onChange={handleSexoChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              required
            >
              <option value="">Seleccione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
            {showOtherSexo && (
              <input
                type="text"
                placeholder="Especifique su sexo"
                value={otherSexoValue}
                onChange={handleOtherSexoChange}
                className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2 mt-2"
                required
              />
            )}
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
              value={formatDateForInput(userData.fecha_nacimiento ?? undefined)}
              onChange={handleUserChange}
              className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
        </div>
        
        {/* Datos profesionales del psicólogo */}
        <div className="w-[240px] h-auto flex flex-col gap-2 m-auto">
          <div>
            <h2 className="text-sm">Datos profesionales:</h2>
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
                  type="tel" 
                  name="telefono_trabajo" 
                  id="telefono_trabajo" 
                  value={psicologoData.telefono_trabajo || ''}
                  onChange={handlePsicologoChange}
                  className="max-w-[300px] w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="w-[240px] h-[336px] flex flex-col gap-2 m-auto">
          <div>
            <h2 className="text-sm">Redes sociales:</h2>
            <hr className="my-1" />
          </div>
          <div className="w-full h-[90%] border border-[#8f8f8f] rounded-[0.4rem] p-4 pt-0.5">
            <div className="w-full h-full grid place-items-center"> 
              <div className="w-full max-w-[190px]">
                <label className="text-sm">Agregar red social:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre (ej: LinkedIn)"
                    value={newSocialNetwork.name}
                    onChange={handleSocialNetworkChange}
                    className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                  />
                </div>
                <input
                  type="url"
                  name="url"
                  placeholder="URL del perfil"
                  value={newSocialNetwork.url}
                  onChange={handleSocialNetworkChange}
                  className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2 mt-2"
                />
                <button
                  type="button"
                  onClick={addSocialNetwork}
                  className="bg-blue-300 text-white rounded px-3 h-8 mt-2 hover:bg-blue-400"
                >
                  Agregar
                </button>
              </div>

              {socialNetworks.length > 0 && (
                <div className="w-full max-w-[190px] mt-2">
                  <label className="text-sm">Redes agregadas:</label>
                  <div className="space-y-1 mt-1">
                    {socialNetworks.map((network, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-1 rounded text-xs">
                        <span>
                          {network.name}: <a href={network.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">link</a>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSocialNetwork(index)}
                          className="text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
      
      {!isEdit && (
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