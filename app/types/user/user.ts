//type user

import { TipoUsuario,Tutor,Psicologo } from "./compartidos";

export interface UsuarioBase {
  id?: number;
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date | null;
  sexo?: string;
  password?: string;
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
