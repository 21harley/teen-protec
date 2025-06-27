// Tipos base
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: Date | string;
  genero?: string;
  direccion?: string;
  foto_perfil?: string;
  tests?: Test[];
  psicologo?: Psicologo | null;
  adolecente?: Adolecente | null;
}

export interface Psicologo {
  id_usuario: number;
  especialidad?: string;
  universidad?: string;
  anio_graduacion?: number;
  numero_colegiado?: string;
  biografia?: string;
  usuario?: Usuario;
}

export interface Adolecente {
  id_usuario: number;
  id_tutor: number;
  tutor?: Tutor;
  usuario?: Usuario;
}

export interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  parentesco?: string;
  adolecentes?: Adolecente[];
}

export interface Test {
  id: number;
  id_psicologo: number;
  id_usuario: number;
  nombre: string;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  progreso: number;
  fecha_creacion: Date | string;
  fecha_finalizacion?: Date | string;
  preguntas?: Pregunta[];
  respuestas?: Respuesta[];
  psicologo?: Psicologo;
  usuario?: Usuario;
}

export interface Pregunta {
  id: number;
  id_test: number;
  id_tipo: number;
  texto_pregunta: string;
  orden: number;
  obligatoria: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: Opcion[];
  tipo?: TipoPregunta;
  test?: Test;
}

export interface Opcion {
  id: number;
  id_pregunta: number;
  texto: string;
  valor: string | number;
  orden: number;
  es_otro: boolean;
  pregunta?: Pregunta;
}

export interface TipoPregunta {
  id: number;
  nombre: string;
  descripcion?: string;
  preguntas?: Pregunta[];
}

export interface Respuesta {
  id: number;
  id_test: number;
  id_pregunta: number;
  valor: string;
  pregunta?: Pregunta;
  test?: Test;
}

export interface TestPlantilla {
  id: number;
  id_psicologo: number;
  nombre: string;
  descripcion?: string;
  preguntas?: PreguntaPlantilla[];
  psicologo?: Psicologo;
}

export interface PreguntaPlantilla {
  id: number;
  id_plantilla: number;
  id_tipo: number;
  texto_pregunta: string;
  orden: number;
  obligatoria: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionPlantilla[];
  tipo?: TipoPregunta;
  plantilla?: TestPlantilla;
}

export interface OpcionPlantilla {
  id: number;
  id_pregunta: number;
  texto: string;
  valor: string | number;
  orden: number;
  es_otro: boolean;
  pregunta?: PreguntaPlantilla;
}

// Tipos para las solicitudes
export interface PacienteAsignacion {
  id_usuario: number;
  id_psicologo: number;
}

export interface TestAsignacion {
  id_plantilla: number;
  id_paciente: number;
  id_psicologo: number;
  nombre?: string;
}

// Tipos para las respuestas
export interface PacienteConTests extends Usuario {
  tests: Test[];
}

export interface TestCompleto extends Test {
  preguntas: Pregunta[];
  respuestas: Respuesta[];
}

// Tipos para los parámetros de búsqueda
export interface GetPacientesParams {
  id_psicologo: number;
}

export interface DeleteTestParams {
  id_test: number;
  id_paciente: number;
  id_psicologo: number;
}