// Enums
export enum TestStatus {
  NoIniciado = 'no_iniciado',
  EnProgreso = 'en_progreso',
  Completado = 'completado'
}

export enum TipoPreguntaNombre {
  Radio = 'radio',
  Checkbox = 'checkbox',
  Text = 'text',
  Select = 'select',
  Range = 'range'
}

// Tipos base
export interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre;
  descripcion: string;
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
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionPlantillaBase[];
}

export interface PreguntaPlantilla extends PreguntaPlantillaBase {
  id: number;
  id_test: number;
  tipo?: TipoPregunta;
  opciones?: OpcionPlantilla[];
}

// Tipos para Usuario y Psicólogo
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: Date;
  id_tipo_usuario: number;
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
  id_psicologo?: number;
  fecha_creacion?: Date;
}

export interface TestPlantillaInput extends TestPlantillaBase {
  preguntas: PreguntaPlantillaBase[];
}

export interface TestPlantilla extends TestPlantillaBase {
  id: number;
  id_psicologo: number;
  fecha_creacion: Date;
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