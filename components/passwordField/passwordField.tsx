'use client'

import { useState, useEffect } from "react";

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValidityChange?: (isValid: boolean) => void;
  confirmValue?: string;
  onConfirmChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showRequirements?: boolean;
  requireValidation?: boolean;
  label?: string;
  confirmLabel?: string;
  error?: string;
  name?: string;
  confirmName?: string;
  disabled?: boolean;
}

export default function PasswordField({
  value,
  onChange,
  onValidityChange,
  confirmValue = "",
  onConfirmChange,
  showRequirements = true,
  requireValidation = true,
  label = "Contraseña",
  confirmLabel = "Repetir contraseña",
  error = "",
  name = "password",
  confirmName = "confirmPassword",
  disabled = false
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Validar formato de contraseña
  const validatePassword = (password: string) => {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecialChar,
      isValid: hasLowercase && hasUppercase && hasNumber && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(value);
  const isConfirmValid = !confirmValue || value === confirmValue;
  const allRequirementsMet = passwordValidation.isValid;

  // Mostrar validación solo cuando hay texto y no se han cumplido todos los requisitos
  useEffect(() => {
    if (value && !allRequirementsMet) {
      setShowValidation(true);
    } else {
      setShowValidation(false);
    }
  }, [value, allRequirementsMet]);

  // Notificar cambios de validez
  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(passwordValidation.isValid && isConfirmValid);
    }
  }, [passwordValidation.isValid, isConfirmValid, onValidityChange]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (!touched) setTouched(true);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onConfirmChange) {
      onConfirmChange(e);
      if (!confirmTouched) setConfirmTouched(true);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="w-full max-w-[300px]">
      {/* Campo de contraseña principal */}
      <div className="mb-4 relative">
        <label htmlFor={name} className="text-sm block mb-1">{label}:</label>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            name={name}
            id={name}
            value={value}
            onChange={handlePasswordChange}
            disabled={disabled}
            className={`w-full border ${error && touched ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2 pr-8 disabled:opacity-75`}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Indicadores de fortaleza de contraseña - Posicionado absoluto */}
        {showRequirements && requireValidation && showValidation && (
          <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10">
            <p className="mb-1 font-medium text-xs">La contraseña debe contener:</p>
            <div className={`${passwordValidation.hasLowercase ? 'text-green-500' : 'text-red-500'} text-xs`}>
              {passwordValidation.hasLowercase ? '✓' : '✗'} Al menos una letra minúscula
            </div>
            <div className={`${passwordValidation.hasUppercase ? 'text-green-500' : 'text-red-500'} text-xs`}>
              {passwordValidation.hasUppercase ? '✓' : '✗'} Al menos una letra mayúscula
            </div>
            <div className={`${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'} text-xs`}>
              {passwordValidation.hasNumber ? '✓' : '✗'} Al menos un número
            </div>
            <div className={`${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-red-500'} text-xs`}>
              {passwordValidation.hasSpecialChar ? '✓' : '✗'} Al menos un carácter especial
            </div>
          </div>
        )}
        
        {error && touched && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
      
      {/* Campo de confirmación de contraseña */}
      {onConfirmChange && (
        <div className="mb-2">
          <label htmlFor={confirmName} className="text-sm block mb-1">{confirmLabel}:</label>
          <div className="relative">
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              name={confirmName}
              id={confirmName}
              value={confirmValue}
              onChange={handleConfirmChange}
              disabled={disabled}
              className={`w-full border ${(!isConfirmValid && confirmTouched) ? 'border-red-500' : 'border-[#8f8f8f]'} rounded-[0.4rem] h-8 px-2 pr-8 disabled:opacity-75`}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              {showConfirmPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {!isConfirmValid && confirmTouched && (
            <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
          )}
        </div>
      )}
    </div>
  );
}