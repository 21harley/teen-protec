// Enumerados
export enum TestStatus {
  NoIniciado = 'no_iniciado',
  EnProgreso = 'en_progreso',
  Completado = 'completado'
}

export enum TipoPreguntaNombre {
  OPCION_MULTIPLE = 'OPCION_MULTIPLE',
  VERDADERO_FALSO = 'VERDADERO_FALSO',
  RESPUESTA_CORTA = 'RESPUESTA_CORTA',
  SELECT = 'SELECT',
  RANGO = 'RANGO'
}

// Interfaces básicas
export interface TestBase {
  id?: number;
  id_psicologo?: number | null;
  id_usuario?: number | null;
  nombre?: string | null;
  estado?: TestStatus | null;
  progreso?: number | null;
  fecha_creacion?: Date | string | null;
  fecha_ultima_respuesta?: Date | string | null;
}

export interface PreguntaData {
  id: number; // Cambiado a obligatorio para consistencia
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  paso?: number | null;
  opciones?: OpcionData[];
  tipo: TipoPregunta; // Cambiado a obligatorio
}

export interface OpcionData {
  id: number; // Cambiado a obligatorio
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

export interface RespuestaData {
  id?: number;
  id_pregunta: number;
  id_opcion?: number | null;
  texto_respuesta?: string | null;
  valor_rango?: number | null;
  fecha?: Date | string;
  id_usuario?: number;
  pregunta?: PreguntaData;
  opcion?: OpcionData;
  usuario?: UsuarioData;
}

export interface FullTestData extends TestBase {
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
  psicologo?: PsicologoData;
  usuario?: UsuarioData;
}

// Interfaces para relaciones
export interface UsuarioData {
  id: number;
  nombre: string;
  email: string;
  cedula?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: Date | string | null;
  genero?: string | null;
  direccion?: string | null;
  foto_perfil?: string | null;
}

export interface PsicologoData {
  id_usuario: number;
  especialidad?: string | null;
  universidad?: string | null;
  anio_graduacion?: number | null;
  numero_colegiado?: string | null;
  descripcion?: string | null;
  usuario?: UsuarioData;
  redes_sociales?: RedSocialData[];
}

export interface RedSocialData {
  id: number;
  id_psicologo: number;
  plataforma: string;
  enlace: string;
}

export interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre; // Usando el enum
  descripcion?: string | null;
}

// Interfaces para paginación y búsqueda
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TestQueryParams {
  id?: number | string;
  nombre?: string;
  id_usuario?: number | string;
  id_psicologo?: number | string;
  estado?: TestStatus;
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  es_psicologa?: boolean;
  page?: number | string;
  pageSize?: number | string;
}

// Interfaces para request bodies
export interface CreateTestRequest extends Omit<FullTestData, 'id'> {}
export interface UpdateTestRequest extends FullTestData {}

// Interfaz Test completa y consistente
export interface Test {
  id?: number;
  nombre: string;
  estado: TestStatus;
  progreso: number;
  fecha_creacion: string | Date;
  fecha_ultima_respuesta: string | Date | null;
  id_psicologo?: number | null;
  id_usuario?: number | null;
  psicologo?: {
    usuario: UsuarioData;
    especialidad?: string | null;
    universidad?: string | null;
    anio_graduacion?: number | null;
    numero_colegiado?: string | null;
  } | null;
  usuario?: UsuarioData | null;
  preguntas?: Array<{
    id: number;
    texto_pregunta: string;
    id_tipo: number;
    orden: number;
    obligatoria?: boolean;
    placeholder?: string | null;
    min?: number | null;
    max?: number | null;
    paso?: number | null;
    tipo: TipoPregunta;
    opciones?: Array<{
      id: number;
      texto: string;
      valor: string;
      orden: number;
      es_otro?: boolean;
    }>;
  }>;
}