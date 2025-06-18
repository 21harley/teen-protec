//type user

import { TipoUsuario,Tutor,Psicologo } from "./compartidos";

export interface UsuarioBase {
  id?: number;
  email: string;
  password?: string; // Solo para creación/actualización
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date;
  id_tipo_usuario?: number;
}

export interface UsuarioSafe extends Omit<UsuarioBase, 'password'> {
  id: number;
  tipoUsuario: TipoUsuario;
  esAdolescente?: boolean;
  esPsicologo?: boolean;
}

export interface UsuarioCompleto extends UsuarioSafe {
  tutorInfo?: Tutor;
  psicologoInfo?: Psicologo;
}

export type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo';