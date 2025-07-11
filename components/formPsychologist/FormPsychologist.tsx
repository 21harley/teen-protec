'use client'
import Image from "next/image"
import svg from "./../../app/public/logos/logo_texto.svg"
import Link from "next/link"
import React, { useState, useEffect } from "react"

type Errors = {
  confirmPassword?: string;
  professionalFields?: string;
  submit?: string;
};

type SocialNetwork = {
  name: string;
  url: string;
};

type UserData = {
  id?: number;
  email: string;
  password?: string;
  confirmPassword?: string;
  fullName: string;
  ci: string;
  birthDate: string;
  sexo?: string;
};

type ProfessionalData = {
  licenseNumber: string;
  university: string;
  consultationFee: string;
  workPhone: string;
};

type PsicologoData = {
  id_usuario?: number;
  numero_de_titulo: string;
  nombre_universidad: string;
  monto_consulta: number;
  telefono_trabajo?: string;
  redes_sociales?: {
    nombre_red: string;
    url_perfil: string;
  }[];
};

type FormPsychologistProps = {
  user?: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    fecha_nacimiento: string;
    sexo?: string;
    psicologo?: PsicologoData;
  };
  isEdit?: boolean;
  onSubmit?: (data: any) => Promise<void>;
};

export default function FormPsychologist({ user, isEdit = false, onSubmit }: FormPsychologistProps) {
  // Estado para los datos del usuario
  const [userData, setUserData] = useState<UserData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    ci: '',
    birthDate: '',
    sexo: ''
  });

  // Estado para controlar si se muestra el campo "Otro sexo"
  const [showOtherSexo, setShowOtherSexo] = useState(false);
  const [otherSexoValue, setOtherSexoValue] = useState('');

  // Estado para los datos profesionales del psicólogo
  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    licenseNumber: '',
    university: '',
    consultationFee: '',
    workPhone: ''
  });

  // Estado para las redes sociales
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);
  const [newSocialNetwork, setNewSocialNetwork] = useState<SocialNetwork>({
    name: '',
    url: ''
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos del usuario si estamos en modo edición
  useEffect(() => {
    if (isEdit && user) {
      setUserData({
        id: user.id,
        email: user.email,
        fullName: user.nombre,
        ci: user.cedula,
        birthDate: user.fecha_nacimiento.split('T')[0], // Formatear fecha
        sexo: user.sexo || ''
      });

      // Si el sexo no es Masculino ni Femenino, mostrar campo "Otro"
      if (user.sexo && !['Masculino', 'Femenino'].includes(user.sexo)) {
        setShowOtherSexo(true);
        setOtherSexoValue(user.sexo);
      }

      if (user.psicologo) {
        setProfessionalData({
          licenseNumber: user.psicologo.numero_de_titulo,
          university: user.psicologo.nombre_universidad,
          consultationFee: user.psicologo.monto_consulta.toString(),
          workPhone: user.psicologo.telefono_trabajo || ''
        });

        if (user.psicologo.redes_sociales) {
          setSocialNetworks(
            user.psicologo.redes_sociales.map(red => ({
              name: red.nombre_red,
              url: red.url_perfil
            }))
          );
        }
      }
    }
  }, [isEdit, user]);

  // Manejar cambios en los inputs del usuario
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors.confirmPassword || errors.submit) {
      setErrors(prev => ({
        confirmPassword: name === 'confirmPassword' ? prev.confirmPassword : undefined,
        professionalFields: prev.professionalFields
      }));
    }
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el campo de sexo
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

  // Manejar cambios en el campo "Otro sexo"
  const handleOtherSexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherSexoValue(value);
    setUserData(prev => ({ ...prev, sexo: value }));
  };

  // Manejar cambios en los inputs profesionales
  const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors.professionalFields || errors.submit) {
      setErrors(prev => ({
        confirmPassword: prev.confirmPassword,
        professionalFields: name === 'consultationFee' || name === 'licenseNumber' || name === 'university' ? undefined : prev.professionalFields
      }));
    }
    setProfessionalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en los inputs de redes sociales
  const handleSocialNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSocialNetwork(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Agregar una nueva red social
  const addSocialNetwork = () => {
    if (newSocialNetwork.name && newSocialNetwork.url) {
      setSocialNetworks(prev => [...prev, newSocialNetwork]);
      setNewSocialNetwork({ name: '', url: '' });
    }
  };

  // Eliminar una red social
  const removeSocialNetwork = (index: number) => {
    setSocialNetworks(prev => prev.filter((_, i) => i !== index));
  };

  // Validar contraseñas coincidan (solo para registro)
  const validatePasswords = () => {
    if (!isEdit && userData.password !== userData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Las contraseñas no coinciden'
      }));
      return false;
    }
    return true;
  };

  // Validar campos profesionales
  const validateProfessionalFields = () => {
    const requiredFields = ['licenseNumber', 'university', 'consultationFee'];
    const missingFields = requiredFields.filter(field => !professionalData[field as keyof ProfessionalData]);
    
    if (missingFields.length > 0) {
      setErrors(prev => ({
        ...prev,
        professionalFields: 'Complete todos los campos profesionales requeridos'
      }));
      return false;
    }

    // Validar que el monto de consulta sea un número válido
    if (isNaN(parseFloat(professionalData.consultationFee))) {
      setErrors(prev => ({
        ...prev,
        professionalFields: 'El monto de consulta debe ser un número válido'
      }));
      return false;
    }

    return true;
  };

  // Validar campo de sexo
  const validateSexo = () => {
    if (!userData.sexo) {
      setErrors(prev => ({
        ...prev,
        submit: 'Por favor seleccione su sexo'
      }));
      return false;
    }

    if (showOtherSexo && !otherSexoValue) {
      setErrors(prev => ({
        ...prev,
        submit: 'Por favor especifique su sexo'
      }));
      return false;
    }

    return true;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    // Validar contraseñas (solo para registro)
    if (!isEdit && !validatePasswords()) {
      setIsLoading(false);
      return;
    }
    
    // Validar campos profesionales
    if (!validateProfessionalFields()) {
      setIsLoading(false);
      return;
    }

    // Validar campo de sexo
    if (!validateSexo()) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Preparar datos para enviar al servidor
      const requestData = {
        ...(isEdit && user?.id && { id: user.id }),
        tipoRegistro: 'psicologo',
        usuarioData: {
          email: userData.email,
          ...(!isEdit && { password: userData.password }), // Solo incluir password si no es edición
          nombre: userData.fullName,
          cedula: userData.ci,
          fecha_nacimiento: userData.birthDate,
          sexo: showOtherSexo ? otherSexoValue : userData.sexo
        },
        psicologoData: {
          numero_de_titulo: professionalData.licenseNumber,
          nombre_universidad: professionalData.university,
          monto_consulta: parseFloat(professionalData.consultationFee),
          telefono_trabajo: professionalData.workPhone || undefined,
          redes_sociales: socialNetworks.map(network => ({
            nombre_red: network.name,
            url_perfil: network.url
          }))
        }
      };

      if (onSubmit) {
        // Si hay una función onSubmit personalizada, usarla
        await onSubmit(requestData);
        setSuccessMessage('Perfil actualizado correctamente!');
      } else {
        // Enviar datos al servidor
        const endpoint = '/api/usuario';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error en la ${isEdit ? 'actualización' : 'registro'}`);
        }

        const result = await response.json();
        
        // Mostrar mensaje de éxito
        setSuccessMessage(`${isEdit ? 'Perfil actualizado' : 'Registro completado'} correctamente!`);

        if (!isEdit) {
          // Resetear formulario solo para registro
          setUserData({
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            ci: '',
            birthDate: '',
            sexo: ''
          });
          
          setProfessionalData({
            licenseNumber: '',
            university: '',
            consultationFee: '',
            workPhone: ''
          });
          
          setSocialNetworks([]);
          setShowOtherSexo(false);
          setOtherSexoValue('');
        }
      }
    } catch (error: any) {
      console.error(`Error en el ${isEdit ? 'actualización' : 'registro'}:`, error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || `Error en el ${isEdit ? 'actualización' : 'registro'}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-8 max-w-[800px] w-full flex flex-col items-center justify-between _color_seven rounded-[10px]"
    >
      <div>
        <Image
          src={svg}
          width={180}
          height={90}
          alt="Logo"
        />
      </div>
      
      <h1 className="text-xl font-semibold my-4">
        {isEdit ? 'Editar Perfil de Psicólogo' : 'Registro de Psicólogo'}
      </h1>

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
      
      <div className="flex flex-col md:flex-row justify-around p-5 gap-5 w-full">
        {/* Datos personales */}
        <div className="w-full max-w-[350px] space-y-4">
          <h2 className="text-lg font-medium">Datos Personales</h2>
          
          <div>
            <label htmlFor="email" className="text-sm">Correo electrónico:</label>
            <input 
              required 
              type="email" 
              name="email" 
              id="email" 
              value={userData.email}
              onChange={handleUserChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              disabled={isEdit} // Email no se puede editar normalmente
            />
          </div>
          
          {!isEdit && (
            <>
              <div>
                <label htmlFor="password" className="text-sm">Contraseña:</label>
                <input 
                  required 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={userData.password}
                  onChange={handleUserChange}
                  className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="text-sm">Confirmar contraseña:</label>
                <input 
                  required 
                  type="password" 
                  name="confirmPassword" 
                  id="confirmPassword" 
                  value={userData.confirmPassword}
                  onChange={handleUserChange}
                  className={`w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {isEdit && (
            <>
              <div>
                <label htmlFor="password" className="text-sm">Nueva contraseña (opcional):</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={userData.password}
                  onChange={handleUserChange}
                  className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="text-sm">Confirmar nueva contraseña:</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  id="confirmPassword" 
                  value={userData.confirmPassword}
                  onChange={handleUserChange}
                  className={`w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="fullName" className="text-sm">Nombre completo:</label>
            <input 
              required 
              type="text" 
              name="fullName" 
              id="fullName" 
              value={userData.fullName}
              onChange={handleUserChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>

          <div>
            <label htmlFor="sexo" className="text-sm">Sexo:</label>
            <select
              name="sexo"
              id="sexo"
              value={showOtherSexo ? 'Otro' : userData.sexo}
              onChange={handleSexoChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
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
                className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2 mt-2"
                required
              />
            )}
          </div>
          
          <div>
            <label htmlFor="ci" className="text-sm">Cédula:</label>
            <input 
              required 
              type="text" 
              name="ci" 
              id="ci" 
              value={userData.ci}
              onChange={handleUserChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              disabled={isEdit} // Cédula no se puede editar normalmente
            />
          </div>
          
          <div>
            <label htmlFor="birthDate" className="text-sm">Fecha de nacimiento:</label>
            <input 
              required 
              type="date" 
              name="birthDate" 
              id="birthDate" 
              value={userData.birthDate}
              onChange={handleUserChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
        </div>
        
        {/* Datos profesionales */}
        <div className="w-full max-w-[350px] space-y-4">
          <h2 className="text-lg font-medium">Datos Profesionales</h2>
          
          <div>
            <label htmlFor="licenseNumber" className="text-sm">Número de título profesional:</label>
            <input 
              required 
              type="text" 
              name="licenseNumber" 
              id="licenseNumber" 
              value={professionalData.licenseNumber}
              onChange={handleProfessionalChange}
              className={`w-full border ${errors.professionalFields ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
            />
          </div>
          
          <div>
            <label htmlFor="university" className="text-sm">Universidad donde obtuvo el título:</label>
            <input 
              required 
              type="text" 
              name="university" 
              id="university" 
              value={professionalData.university}
              onChange={handleProfessionalChange}
              className={`w-full border ${errors.professionalFields ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
            />
          </div>
          
          <div>
            <label htmlFor="consultationFee" className="text-sm">Monto de consulta (USD):</label>
            <input 
              required 
              type="number" 
              name="consultationFee" 
              id="consultationFee" 
              value={professionalData.consultationFee}
              onChange={handleProfessionalChange}
              min="0"
              step="0.01"
              className={`w-full border ${errors.professionalFields ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2`}
            />
          </div>
          
          <div>
            <label htmlFor="workPhone" className="text-sm">Teléfono de trabajo (opcional):</label>
            <input 
              type="tel" 
              name="workPhone" 
              id="workPhone" 
              value={professionalData.workPhone}
              onChange={handleProfessionalChange}
              className="w-full border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
            />
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium">Redes Sociales Profesionales (opcional)</h3>
            
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                name="name"
                placeholder="Nombre (ej: LinkedIn)"
                value={newSocialNetwork.name}
                onChange={handleSocialNetworkChange}
                className="flex-1 border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              />
              <input
                type="url"
                name="url"
                placeholder="URL del perfil"
                value={newSocialNetwork.url}
                onChange={handleSocialNetworkChange}
                className="flex-1 border border-[#8f8f8f] rounded-[0.4rem] h-8 px-2"
              />
              <button
                type="button"
                onClick={addSocialNetwork}
                className="bg-blue-300 text-white rounded px-3 h-8 hover:bg-blue-400"
              >
                +
              </button>
            </div>
            
            {socialNetworks.length > 0 && (
              <div className="mt-2 space-y-1">
                {socialNetworks.map((network, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-1 rounded">
                    <span className="text-sm">
                      {network.name}: <a href={network.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">{network.url}</a>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSocialNetwork(index)}
                      className="text-red-500 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {errors.professionalFields && (
        <p className="text-red-500 text-sm mb-4">{errors.professionalFields}</p>
      )}

      <div className="w-full max-w-[350px] flex justify-center mt-2 mb-5"> 
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-600 cursor-pointer text-white text-center rounded transition w-full h-10 hover:bg-blue-700 ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? (
            'Procesando...'
          ) : isEdit ? (
            'Actualizar Perfil'
          ) : (
            'Registrar como Psicólogo'
          )}
        </button>
      </div>
      
      {!isEdit && (
        <div className="text-center">
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