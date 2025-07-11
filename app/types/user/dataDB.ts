//type data

export interface UsuarioBase {
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date | null;
  sexo?: string;
  password?: string;
  id_tipo_usuario?: number;
}

export interface TutorData {
  cedula_tutor?: string;
  nombre_tutor?: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: 'Masculino' | 'Femenino' | 'Otro' | string;
  parentesco?: 'Padre' | 'Madre' | 'Tío' | 'Tía' | 'Abuelo' | 'Abuela' | 'Otro' | string;
}

export interface PsicologoData {
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: { nombre_red: string; url_perfil: string }[];
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    fecha_nacimiento: Date;
    id_tipo_usuario: number;
    tipoUsuario: { 
      id: number; 
      nombre: string;
      menu: Array<{
        path: string;
        name: string;
        icon: string;
      }>;
    };
    tokenExpiry: Date;
    esAdolescente?: boolean;
    tutorInfo?: {
      id: number;
      cedula: string;
      nombre: string;
      profesion_tutor?: string;
      telefono_contacto?: string;
      correo_contacto?: string;
    };
    esPsicologo?: boolean;
    psicologoInfo?: {
      numero_de_titulo: string;
      nombre_universidad: string;
      monto_consulta: number;
      telefono_trabajo: string;
      redes_sociales?: Array<{
        id: number;
        nombre_red: string;
        url_perfil: string;
      }>;
    };
  };
}

export interface LoginResponseDB {
  user:{  
    id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: string;
  tipo_usuario: {
    id: number;
    nombre: string;
     menu: Array<{
        path: string;
        name: string;
        icon: string;
      }>;
  };
  adolecente?: {
    tutor: {
      id: number;
      nombre_tutor: string;
      cedula_tutor: string;
      profesion_tutor?: string;
      telefono_contacto?: string;
      correo_contacto?: string;
    };
  } | null;
  psicologo?: {
    numero_de_titulo: string;
    nombre_universidad: string;
    monto_consulta: number;
    telefono_trabajo: string;
    redes_sociales: {
      nombre_red: string;
      url_perfil: string;
    }[];
  } | null;
  };
}