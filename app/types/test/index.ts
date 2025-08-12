/**
 * Enumerados para el sistema de tests psicológicos
 */
export enum TestStatus {
  NO_INICIADO = 'NO_INICIADO',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
  EVALUADO = 'EVALUADO'
}

export enum PesoPreguntaTipo {
  SIN_VALOR = 'SIN_VALOR',
  IGUAL_VALOR = 'IGUAL_VALOR',
  BAREMO = 'BAREMO'
}

export enum TipoPreguntaNombre {
  OPCION_UNICA= 'radio',
  OPCION_MULTIPLE = 'checkbox',
  RESPUESTA_CORTA = 'text',
  SELECT = 'select',
  RANGO = 'range'
}


export const TipoPreguntaMap: Record<number, string> = {
  1: 'radio',
  2: 'checkbox',
  3: 'text',
  4: 'select',
  5: 'range'
};

/**
 * Interfaces principales para Tests
 */
export interface TestBase {
  id?: number;
  id_psicologo?: number | null;
  id_usuario?: number | null;
  nombre?: string | null;
  estado?: TestStatus | null;
  peso_preguntas?: PesoPreguntaTipo | null;
  config_baremo?: any | null;
  valor_total?: number | null;
  fecha_creacion?: Date | string | null;
  fecha_ultima_respuesta?: Date | string | null;
  evaluado?:            boolean;          
  fecha_evaluacion?:    Date;
  ponderacion_final?:      number;           
  comentarios_psicologo?: string; 
}

export interface PreguntaData {
  id?: number;
  id_test?: number;
  texto_pregunta: string;
  id_tipo: number;
  id_grupo?: number;
  orden: number;
  obligatoria?: boolean;
  peso?: number | null;
  baremo_detalle?: any | null;
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  paso?: number;
  eva_psi?: number | null;
  opciones?: OpcionData[];
  tipo?: TipoPregunta;
}

export interface OpcionData {
  id?: number;
  id_pregunta?: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
  valor_baremo?: number; 
  es_correcta?: boolean; 
}

export interface RespuestaData {
  id?: number;
  id_test?: number;
  id_pregunta?: number;
  id_usuario?: number;
  id_opcion?: number | null;
  texto_respuesta?: string | null;
  valor_rango?: number | null;
  fecha?: Date | string;
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

/**
 * Interfaces para relaciones de usuario
 */
export interface UsuarioData {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  password?: string;
  password_iv?: string;
  fecha_nacimiento: Date | string;
  sexo?: string | null;
  id_tipo_usuario: number;
  id_psicologo?: number | null;
  authToken?: string | null;
  authTokenExpiry?: Date | string | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | string | null;
  tipo_usuario?: TipoUsuarioData;
  adolecente?: AdolecenteData;
  psicologo?: PsicologoData;
}

export interface TipoUsuarioData {
  id: number;
  nombre: string;
  menu: any;
}

export interface PsicologoData {
  id_usuario: number;
  numero_de_titulo?: string | null;
  nombre_universidad?: string | null;
  monto_consulta?: number | null;
  telefono_trabajo?: string | null;
  usuario?: UsuarioData;
  redes_sociales?: RedSocialData[];
}

export interface RedSocialData {
  id: number;
  id_psicologo: number;
  nombre_red: string;
  url_perfil: string;
}

export interface TutorData {
  id: number;
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string | null;
  telefono_contacto?: string | null;
  correo_contacto?: string | null;
  sexo?: string | null;
  parentesco?: string | null;
}

export interface AdolecenteData {
  id_usuario: number;
  id_tutor?: number | null;
  tutor?: TutorData | null;
  usuario: UsuarioData;
}

/**
 * Interfaces para tipos de pregunta
 */
export interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre;
  descripcion?: string | null;
  tipo_respuesta: string;
}

/**
 * Interfaces para plantillas de tests
 */
export interface TestPlantillaData {
  id?: number;
  id_psicologo: number;
  nombre: string;
  estado: TestStatus;
  peso_preguntas: PesoPreguntaTipo;
  config_baremo?: any;
  valor_total?: number;
  fecha_creacion?: Date | string;
  preguntas?: PreguntaPlantillaData[];
  psicologo?: PsicologoData;
}

export interface PreguntaPlantillaData {
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
  paso?:number;
  eva_psi?: number;
  tipo?: TipoPregunta;
  opciones?: OpcionPlantillaData[];
}

export interface OpcionPlantillaData {
  id?: number;
  id_pregunta: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

/**
 * Interfaces para alarmas/notificaciones
 */
export interface TipoAlertaData {
  id: number;
  nombre: string;
  url_destino?: string | null;
  id_tipo_usuario: number;
}

export interface AlarmaData {
  id?: number;
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  fecha_creacion?: Date | string;
  fecha_vista?: Date | string | null;
  vista?: boolean;
  usuario?: UsuarioData;
  tipo_alerta?: TipoAlertaData;
}

/**
 * Interfaces para paginación y búsqueda
 */
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
  es_psicologa?: boolean | string;
  page?: number | string;
  pageSize?: number | string;
}

export interface PreguntaQueryParams {
  id_test?: number | string;
  search?: string;
}

/**
 * Interfaces para request bodies
 */
export interface CreateTestRequest extends Omit<FullTestData, 'id'> {}
export interface UpdateTestRequest extends FullTestData {}
export interface CreateTestFromTemplateRequest {
  id_plantilla: number;
  id_usuario: number;
}

/**
 * Tipo para respuestas de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Tipo para formularios de tests
 */
export interface TestFormValues {
  nombre: string;
  id_usuario?: number | null;
  preguntas: Array<{
    texto_pregunta: string;
    id_tipo: number;
    orden: number;
    obligatoria: boolean;
    opciones?: Array<{
      texto: string;
      valor: string;
      orden: number;
    }>;
    placeholder?: string;
    min?: number;
    max?: number;
    paso?:number;
    eva_psi?: number;
  }>;
}