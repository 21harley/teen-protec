//type form

import { RedSocial } from "./compartidos";
import { TipoRegistro, UsuarioBase } from "./user";

export interface RegisterFormValues {
  tipoRegistro: TipoRegistro;
  // Datos básicos
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  
  // Datos de tutor (si es adolescente)
  cedula_tutor?: string;
  nombre_tutor?: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  
  // Datos de psicólogo (si es psicólogo)
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: RedSocial[];
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ProfileFormValues extends Omit<UsuarioBase, 'password'> {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  // Campos específicos según tipo de usuario
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: RedSocial[];
}