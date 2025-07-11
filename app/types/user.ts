// Tipos básicos
export type MenuItem = {
  path: string;
  name: string;
  icon: string;
};

export type TipoUsuario = {
  id: number;
  nombre: string;
  descripcion?: string;
  menu: MenuItem[];
};

// Tipos para relaciones
export type Tutor = {
  id?: number;
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: 'Masculino' | 'Femenino' | 'Otro' | string;
  parentesco?: 'Padre' | 'Madre' | 'Tío' | 'Tía' | 'Abuelo' | 'Abuela' | 'Otro' | string;
};

export type RedSocial = {
  id?: number;
  id_psicologo?: number;
  nombre_red: string;
  url_perfil: string;
};

export type Psicologo = {
  id_usuario: number;
  numero_de_titulo: string;
  nombre_universidad: string;
  monto_consulta: number;
  telefono_trabajo: string;
  redes_sociales?: RedSocial[];
};

export type Adolescente = {
  id_usuario: number;
  id_tutor?: number;
  tutor?: Tutor;
};

export type TestInfo = {
  id: number;
  id_psicologo: number;
  id_usuario: number | null;
  nombre: string;
  estado: string;
  progreso: number;
  fecha_creacion: Date | string;
  preguntas?: any[];
  respuestas?: any[];
};

// Tipo principal de usuario
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: string | Date | null;
  sexo?: 'Masculino' | 'Femenino' | 'Otro' | string;
  id_tipo_usuario: number;
  esAdolescente?: boolean;
  esPsicologo?: boolean;
  tipo_usuario?: TipoUsuario;
  adolecente?: Adolescente | null;
  psicologo?: Psicologo | null;
  tutorInfo?: Tutor;
  psicologoInfo?: Psicologo;
  tests?: TestInfo[];
}

// Tipo para la respuesta de login
export type LoginResponse = {
  user: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    fecha_nacimiento: Date | string | null;
    sexo?: string;
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
    tests?: TestInfo[];
  };
  token?: string;
};

// Tipo simplificado para información de usuario
export type UsuarioInfo = {
  id: number;
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: Date | string | null;
  sexo?: string;
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
  tests?: TestInfo[];
};

// Tipos para creación/actualización de usuarios
export type UsuarioBase = {
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date | null;
  sexo?: string;
  password?: string;
  id_tipo_usuario?: number;
};

export type TutorData = {
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: string;
  parentesco?: string;
};

export type PsicologoData = {
  numero_de_titulo: string;
  nombre_universidad: string;
  monto_consulta: number;
  telefono_trabajo: string;
  redes_sociales?: Omit<RedSocial, 'id' | 'id_psicologo'>[];
};

export type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo' | 'admin';

// Para respuestas paginadas
export interface PaginatedUsuariosResponse {
  data: Usuario[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
