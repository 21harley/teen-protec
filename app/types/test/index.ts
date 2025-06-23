// Enums.ts
export enum TestStatus {
  no_iniciado = 'no_iniciado',
  en_progreso = 'en_progreso',
  completado = 'completado'
}

export enum TipoPreguntaNombre {
  radio = 'radio',
  checkbox = 'checkbox',
  text = 'text',
  select = 'select',
  range = 'range'
}

export interface TestData {
  id?: number | string; // Opcional para nuevos tests que aún no tienen ID
  name: string;
  description?: string; // Opcional
  questions: PreguntaData[];
  status?: 'draft' | 'published' | 'archived'; // Estado opcional con valores específicos
  created_at?: string | Date; // Opcional, fecha de creación
  updated_at?: string | Date; // Opcional, fecha de actualización
  // Puedes agregar más campos según necesites
}

// Interfaces principales
export interface TestBase {
  id_psicologo?: number | null;
  id_usuario?: number | null;
  nombre?: string | null;
  estado?: TestStatus;
  progreso?: number; // 0-100%
  fecha_creacion?: string | Date;
  fecha_ultima_respuesta?: string | Date | null;
}

export interface CreateTestRequest extends TestBase {
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
}

export interface UpdateTestRequest extends TestBase {
  id: number;
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
}

export interface GetTestsParams {
  id?: number | string;
  nombre?: string;
  id_usuario?: number | string;
  id_psicologo?: number | string;
  estado?: TestStatus;
  search?: string;
  fecha_inicio?: string | Date;
  fecha_fin?: string | Date;
  page?: number | string;
  pageSize?: number | string;
}

export interface DeleteTestParams {
  id: number | string;
}

// Tipos para preguntas y respuestas
export interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre;
  descripcion: string;
}

export interface PreguntaData {
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionData[];
}

export interface OpcionData {
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

export interface RespuestaData {
  id_pregunta: number;
  id_opcion?: number | null;
  texto_respuesta?: string | null;
  valor_rango?: number | null;
}

// Tipos de respuesta
export interface PreguntaResponse {
  id: number;
  id_test: number;
  id_tipo: number;
  texto_pregunta: string;
  orden: number;
  obligatoria: boolean;
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  paso?: number | null;
  tipo: TipoPregunta;
  opciones: OpcionResponse[];
}

export interface OpcionResponse {
  id: number;
  id_pregunta: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro: boolean;
}

export interface RespuestaResponse {
  id: number;
  id_test: number;
  id_pregunta: number;
  id_usuario: number | null;
  id_opcion: number | null;
  texto_respuesta: string | null;
  valor_rango: number | null;
  fecha: string | Date;
  pregunta?: PreguntaResponse;
  usuario?: UsuarioResponse | null;
  opcion?: OpcionResponse | null;
}

// Tipos para usuarios
export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: string | Date;
  id_tipo_usuario: number;
}

export interface PsicologoResponse {
  id_usuario: number;
  numero_de_titulo?: string | null;
  nombre_universidad?: string | null;
  monto_consulta?: number | null;
  telefono_trabajo?: string | null;
  usuario: UsuarioResponse;
  redes_sociales?: RedSocialPsicologo[];
}

export interface RedSocialPsicologo {
  id: number;
  id_psicologo: number;
  nombre_red: string;
  url_perfil: string;
}

export interface TutorResponse {
  id: number;
  cedula: string;
  nombre: string;
  profesion_tutor?: string | null;
  telefono_contacto?: string | null;
  correo_contacto?: string | null;
}

export interface AdolecenteResponse {
  id_usuario: number;
  id_tutor?: number | null;
  tutor?: TutorResponse | null;
  usuario: UsuarioResponse;
}

// Tipos para la respuesta completa del test
export interface TestResponse extends TestBase {
  id: number;
  psicologo?: PsicologoResponse | null;
  usuario?: UsuarioResponse | null;
  preguntas: PreguntaResponse[];
  respuestas: RespuestaResponse[];
}

// Tipos para paginación y respuestas generales
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  statusCode: number;
}

export interface SuccessResponse<T = any> {
  message: string;
  statusCode: number;
  data?: T;
}

// Tipos para alarmas
export interface AlarmaResponse {
  id: number;
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  fecha_creacion: string | Date;
  fecha_vista?: string | Date | null;
  vista: boolean;
  url_destino?: string | null;
  usuario?: UsuarioResponse | null;
  tipo_alerta?: TipoAlertaResponse | null;
}

export interface TipoAlertaResponse {
  id: number;
  nombre: string;
}

// Tipos para tipos de usuario
export interface TipoUsuarioResponse {
  id: number;
  nombre: string;
  menu: any[]; // Tipo específico según la estructura de tu menú
}


// Tipos base
export interface UsuarioBase {
  id: number;
  nombre: string;
  email: string;
  id_tipo_usuario: number;
}

export interface UsuarioResponse extends UsuarioBase {
  cedula?: string;
  fecha_nacimiento?: string | Date;
}

export interface PsicologoResponse {
  id: number;
  id_usuario: number;
  especialidad?: string;
  usuario: UsuarioResponse;
  redes_sociales?: any[];
}

export interface TestBase {
  id: number;
  id_psicologo: number | null;
  id_usuario: number | null;
  nombre: string;
  estado: TestStatus;
  progreso: number;
  fecha_creacion: string;
  fecha_ultima_respuesta: string | null;
}

// Tipos para preguntas y respuestas
export interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre;
  descripcion: string;
}

export interface PreguntaData {
  id?: number;
  id_test?: number;
  id_tipo: number;
  texto_pregunta: string;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  paso?: number | null;
  tipo?: TipoPregunta;
  opciones?: OpcionData[];
}

export interface OpcionData {
  id?: number;
  id_pregunta?: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

export interface RespuestaData {
  id?: number;
  id_test?: number;
  id_pregunta: number;
  id_usuario?: number | null;
  id_opcion?: number | null;
  texto_respuesta?: string | null;
  valor_rango?: number | null;
  fecha?: string | Date;
}

// Tipos completos con relaciones
export interface TestResponse extends TestBase {
  psicologo: PsicologoResponse | null;
  usuario: UsuarioResponse | null;
  preguntas: PreguntaData[];
  respuestas: RespuestaData[];
}

// Tipos para operaciones
export interface CreateTestRequest extends Omit<TestBase, 'id'> {
  preguntas?: PreguntaData[];
}

export interface UpdateTestRequest extends Partial<TestBase> {
  id: number;
  preguntas?: PreguntaData[];
}

// Tipos para componentes
export interface TestForComponent {
  id: number;
  nombre: string;
  estado: TestStatus;
  progreso: number;
  fecha_creacion: string;
  preguntas: PreguntaData[];
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
  psicologo?: {
    id: number;
    usuario: {
      id: number;
      nombre: string;
    };
  } | null;
}