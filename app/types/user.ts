// Tipos básicos
export type MenuItem = {
  path: string;
  name: string;
  icon: string;
};

export type TipoUsuario = {
  id: number;
  nombre: string;
  menu: MenuItem[];
};

// Tipos para relaciones
export type Tutor = {
  id: number;
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
};

export type RedSocial = {
  id: number;
  nombre_red: string;
  url_perfil: string;
};

export type Psicologo = {
  id_usuario: number;
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: RedSocial[];
};

export type Adolescente = {
  id_usuario: number;
  id_tutor?: number;
  tutor?: Tutor;
};

// Tipo principal de usuario
export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: Date | string;
  id_tipo_usuario: number;
  id_psicologo?: number | null;
  tipo_usuario?: TipoUsuario;
  adolecente?: Adolescente;
  psicologo?: Psicologo;
  psicologoAsignado?: {
    usuario: {
      id: number;
      nombre: string;
      email: string;
      psicologo?: Psicologo;
    };
  };
};

// Tipo para la respuesta de login
export type LoginResponse = {
  user: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    fecha_nacimiento: Date | string;
    id_tipo_usuario: number;
    id_psicologo?: number;
    tipoUsuario: TipoUsuario;
    tokenExpiry: Date | string;
    psicologoAsignado?: {
      id: number;
      nombre: string;
      email: string;
      psicologo?: Psicologo;
    };
    esAdolescente?: boolean;
    tutorInfo?: Tutor;
    esPsicologo?: boolean;
    psicologoInfo?: Psicologo;
  };
  token?: string;
};

// Tipo simplificado para información de usuario (similar a Usuario pero más plano)
export type UsuarioInfo = {
  id: number;
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: Date | string;
  id_tipo_usuario: number;
  tipoUsuario: TipoUsuario;
  tokenExpiry?: Date | string;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | string | null;
  
  // Propiedades condicionales basadas en el tipo de usuario
  esAdmin?: boolean;
  esPsicologo?: boolean;
  esAdolescente?: boolean;
  
  // Información específica del rol
  tutorInfo?: Tutor;
  psicologoInfo?: Psicologo;
};

// Tipos para creación/actualización de usuarios
export type UsuarioBase = {
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date;
  password?: string;
  id_tipo_usuario?: number;
};

export type TutorData = {
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
};

export type PsicologoData = {
  numero_de_titulo: string;
  nombre_universidad: string;
  monto_consulta: number;
  telefono_trabajo: string;
  redes_sociales?: Omit<RedSocial, 'id'>[];
};

export type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo' | 'admin';