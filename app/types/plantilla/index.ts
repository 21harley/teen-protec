// Enums
export enum TestStatus {
  NoIniciado = 'NO_INICIADO',
  EnProgreso = 'EN_PROGRESO',
  Completado = 'COMPLETADO'
}

export enum PesoPreguntaTipoPlantilla {
  SIN_VALOR = 'SIN_VALOR',
  IGUAL_VALOR = 'IGUAL_VALOR',
  BAREMO = 'BAREMO'
}

// Tipos base
export interface TipoPreguntaPlantilla {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_respuesta: string;
}

// Tipos para Opciones
export interface OpcionPlantillaBase {
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

export interface OpcionPlantilla extends OpcionPlantillaBase {
  id: number;
  id_pregunta: number;
}

// Tipos para Preguntas
export interface PreguntaPlantillaBase {
  id?:number,
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  peso?: number;
  baremo_detalle?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?:number;
  eva_psi?: number;
  opciones?: OpcionPlantillaBase[];
}

export interface PreguntaPlantilla extends PreguntaPlantillaBase {
  id: number;
  id_test: number;
  tipo?: TipoPreguntaPlantilla;
  opciones?: OpcionPlantilla[];
}

// Tipos para Usuario y Psicólogo
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  password?: string;
  password_iv?: string;
  fecha_nacimiento: Date | string;
  sexo?: string;
  id_tipo_usuario: number;
  id_psicologo?: number;
  authToken?: string;
  authTokenExpiry?: Date | string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date | string;
}

export interface Psicologo {
  id_usuario: number;
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  usuario: Usuario;
}

// Tipos principales para Plantillas
export interface TestPlantillaBase {
  nombre: string;
  estado: TestStatus;
  peso_preguntas: PesoPreguntaTipoPlantilla;
  config_baremo?: any;
  valor_total?: number;
  id_psicologo?: number;
  fecha_creacion?: Date | string;
}

export interface TestPlantillaInput extends TestPlantillaBase {
  preguntas?: PreguntaPlantillaBase[];
}

export interface TestPlantilla extends TestPlantillaBase {
  id: number;
  id_psicologo: number;
  fecha_creacion: Date | string;
  psicologo?: Psicologo;
  preguntas?: PreguntaPlantilla[];
}

// Tipos para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para filtros
export interface FilterTestPlantillaParams {
  id?: string;
  nombre?: string;
  id_psicologo?: string;
  estado?: TestStatus;
  peso_preguntas?: PesoPreguntaTipoPlantilla;
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  pageSize?: number;
}

// Tipos para operaciones CRUD
export interface CreateTestPlantillaInput extends Omit<TestPlantillaInput, 'id'> {}
export interface UpdateTestPlantillaInput extends TestPlantillaInput {
  id: number;
}

// Tipo para respuesta detallada de plantilla
export interface PlantillaDetailResponse {
  id: number;
  nombre: string;
  estado: TestStatus;
  peso_preguntas: PesoPreguntaTipoPlantilla;
  config_baremo?: any;
  valor_total?: number;
  fecha_creacion: string;
  id_psicologo: number;
  psicologo?: {
    usuario: {
      nombre: string;
      email: string;
      cedula: string;
    };
    numero_de_titulo?: string;
    nombre_universidad?: string;
  };
  preguntas?: {
    id: number;
    texto_pregunta: string;
    id_tipo: number;
    orden: number;
    obligatoria: boolean;
    peso?: number;
    baremo_detalle?: any;
    placeholder?: string;
    min?: number;
    max?: number;
    paso?:number;
    eva_psi?: number;
    tipo: TipoPreguntaPlantilla;
    opciones?: OpcionPlantilla[];
  }[];
}


