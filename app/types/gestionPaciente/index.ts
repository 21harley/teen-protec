export interface TutorInfo {
  id?: number;
  cedula_tutor?: string;
  nombre_tutor?: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: string; // Nuevo campo: 'Masculino', 'Femenino', 'Otro', etc.
  parentesco?: string; // (Opcional) Ej: 'Padre', 'Madre', 'Tutor legal'
}

export interface TestInfo {
  id: number;
  id_psicologo: number;
  id_usuario: number | null;
  nombre: string;
  estado: string;
  progreso: number;
  fecha_creacion: Date;
  preguntas?: any[]; // Puedes definir un tipo más específico si lo necesitas
  respuestas?: any[]; // Puedes definir un tipo más específico si lo necesitas
}

export interface UsuarioCompleto {
  id: number;
  email: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: Date | null;
  id_tipo_usuario: number;
  sexo?: string; // Nuevo campo: 'Masculino', 'Femenino', 'No binario', etc.
  esAdolescente?: boolean;
  esPsicologo?: boolean;
  adolecente?: {
    id_tutor?: number;
    tutor?: TutorInfo;
  };
  tests?: TestInfo[];
  tipo_usuario?: {
    id: number;
    nombre: string;
    descripcion: string;
    menu: any[]; // Puedes definir un tipo más específico para el menú
  };
  psicologo?: {
    numero_de_titulo?: string;
    nombre_universidad?: string;
    monto_consulta?: number;
    telefono_trabajo?: string;
    redes_sociales?: Array<{
      id: number;
      id_psicologo: number;
      nombre_red: string;
      url_perfil: string;
    }>;
  };
  tutorInfo?: TutorInfo;
}