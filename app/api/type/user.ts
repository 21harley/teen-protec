// Tipos para los datos
export interface UsuarioBase {
  id?: number;
  email: string;
  password?: string;
  nombre: string;
  cedula: string;
  telefono: string;
  fecha_nacimiento: string | Date;
  id_tipo_usuario?: number;
  id_psicologo?: number | null;
  sexo?: string | null; // Nuevo campo
  authToken?: string | null;
  authTokenExpiry?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | null;
}

export interface TutorData {
  cedula_tutor?: string;
  nombre_tutor?: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: string | null; // Nuevo campo
  parentesco?: string | null; // Nuevo campo
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
    telefono: string;
    fecha_nacimiento: Date;
    id_tipo_usuario: number;
    id_psicologo?: number | null;
    sexo?: string | null; // Nuevo campo
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
      sexo?: string | null; // Nuevo campo
      parentesco?: string | null; // Nuevo campo
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
    psicologoPaciente?: {
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

// Nuevos tipos para modelos adicionales
export interface TestData {
  id?: number;
  nombre?: string;
  estado?: 'NO_INICIADO' | 'EN_PROGRESO' | 'COMPLETADO';
  peso_preguntas?: 'SIN_VALOR' | 'IGUAL_VALOR' | 'BAREMO';
  config_baremo?: any;
  valor_total?: number;
  fecha_creacion?: Date;
  fecha_ultima_respuesta?: Date;
  id_psicologo?: number;
  id_usuario?: number;
}

export interface PreguntaData {
  id?: number;
  id_test: number;
  id_tipo: number;
  texto_pregunta: string;
  orden: number;
  obligatoria?: boolean;
  peso?: number;
  baremo_detalle?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
}

export interface OpcionData {
  id?: number;
  id_pregunta: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

export interface RespuestaData {
  id?: number;
  id_test: number;
  id_pregunta: number;
  id_usuario: number;
  id_opcion?: number;
  texto_respuesta?: string;
  valor_rango?: number;
  fecha?: Date;
}

export interface AlarmaData {
  id?: number;
  id_usuario?: number;
  id_tipo_alerta?: number;
  mensaje: string;
  fecha_creacion?: Date;
  fecha_vista?: Date;
  vista?: boolean;
}