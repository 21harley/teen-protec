// Tipos para los datos
export interface UsuarioBase {
  id?: number;
  email: string;
  password?: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string | Date;
  id_tipo_usuario?: number;
  id_psicologo?: number | null; // Nuevo campo para relación con psicólogo
}

export interface TutorData {
  cedula_tutor?: string;
  nombre_tutor?: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
}

export interface PsicologoData {
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: { nombre_red: string; url_perfil: string }[];
}

export type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo';

export interface PsicologoAsignado {
  id: number;
  nombre: string;
  email: string;
  psicologo?: {
    numero_de_titulo?: string;
    nombre_universidad?: string;
  };
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    fecha_nacimiento: Date;
    id_tipo_usuario: number;
    id_psicologo?: number | null;
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
      cedula_tutor: string;
      nombre_tutor: string;
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
    psicologoPaciente?: { // Nombre actualizado para coincidir con el modelo
      id: number;
      nombre: string;
      email: string;
      psicologo?: {
        numero_de_titulo?: string;
        nombre_universidad?: string;
      };
    };
  };
}