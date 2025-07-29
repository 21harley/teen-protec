// Enums
export enum Sexo {
  MASCULINO = "MASCULINO",
  FEMENINO = "FEMENINO",
  OTRO = "OTRO"
}

export enum EstadoTestRegistro {
  NO_INICIADO = "NO_INICIADO",
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO",
  EVALUADO = "EVALUADO"
}

export enum PesoPreguntaTipo {
  SIN_VALOR = 'SIN_VALOR',
  IGUAL_VALOR = 'IGUAL_VALOR',
  BAREMO = 'BAREMO'
}


// Interfaces principales
export interface RegistroUsuario {
  id: number;
  usuario_id: number;
  fecha_registro: Date;
  sexo: Sexo | string; // Usar string si no quieres usar el enum
  fecha_nacimiento: Date | null;
  tipo_usuario: string;
  psicologo_id?: number | null;
  tests_ids?: number[] | null; // Asumiendo que es array de números
  total_tests: number;
  avg_notas?: number | null;
  
  // Relaciones (opcionales si no siempre se cargan)
  trazabilidades?: RegistroTrazabilidad[];
  metricas?: RegistroMetricaUsuario[];
  sesiones?: RegistroSesion[];
}

export interface RegistroTestUsuario {
  id: number;
  test_id: number;
  usuario_id: number;
  psicologo_id?: number | null;
  fecha_creacion: Date;
  fecha_completado?: Date | null;
  estado: EstadoTestRegistro | string;
  nombre_test?: string | null;
  valor_total?: number | null;
  nota_psicologo?: number | null;
  evaluado: boolean;
  fecha_evaluacion?: Date | null;
  ponderacion_usada: PesoPreguntaTipo;
  
  metricas?: RegistroMetricaTest[];
}

export interface RegistroTrazabilidad {
  id: number;
  registro_usuario_id: number;
  psicologo_id: number;
  fecha_inicio: Date;
  fecha_fin?: Date | null;
  secuencia: number;
  
  usuario?: RegistroUsuario; // Opcional si no siempre se carga
}

export interface RegistroMetricaUsuario {
  id: number;
  registro_usuario_id: number;
  fecha: Date;
  tests_asignados: number;
  tests_completados: number;
  tests_evaluados: number;
  avg_notas?: number | null;
  sesiones_totales: number;
  
  usuario?: RegistroUsuario; // Opcional
}

export interface RegistroMetricaTest {
  id: number;
  registro_test_id: number;
  fecha: Date;
  tiempo_respuesta?: number | null;
  preguntas_contestadas: number;
  preguntas_totales: number;
  nota_psicologo?: number | null;
  
  test?: RegistroTest; // Opcional
}

export interface RegistroSesion {
  id: number;
  registro_usuario_id: number;
  psicologo_id: number;
  fecha: Date;
  duracion?: number | null;
  tests_revisados?: string | null;
  
  usuario?: RegistroUsuario; // Opcional
}

export interface RegistroReporte {
  id: number;
  tipo: string; // Considera usar enum: "general" | "psicologo" | "paciente"
  parametros: any; // Mejor definir una interfaz específica si conoces la estructura
  fecha_generacion: Date;
  generado_por_id?: number | null;
  formato: string;
  ruta_almacenamiento?: string | null;
}
/*
export interface RegistroProblema {
  id: number;
  reportado_por_id: number;
  descripcion: string;
  categoria: string;
  prioridad: number;
  fecha: Date;
  estado: string; // Considera usar enum
}
*/

// Tipos para los registros
export interface RegistroMetricaTest {
  id: number;
  registro_test_id: number;
  fecha: Date;
  tiempo_respuesta?: number | null;
  preguntas_contestadas: number;
  preguntas_totales: number;
  nota_psicologo?: number | null;
}

export interface RegistroTest {
  id: number;
  test_id: number;
  usuario_id: number;
  psicologo_id?: number | null;
  fecha_creacion: Date;
  fecha_completado?: Date | null;
  estado: EstadoTestRegistro | string;
  nombre_test?: string | null;
  valor_total?: number | null;
  nota_psicologo?: number | null;
  evaluado: boolean;
  fecha_evaluacion?: Date | null;
  ponderacion_usada: string;
  metricas: RegistroMetricaTest[];
}

// Tipos para inputs (pueden ir en otro archivo si lo prefieres)
export type CreateRegistroTestInput = {
  test_id: number;
  usuario_id: number;
  psicologo_id?: number | null;
  fecha_creacion: Date;
  fecha_completado?: Date | null;
  estado: EstadoTestRegistro;
  nombre_test?: string;
  valor_total?: number;
  nota_psicologo?: number | null;
  evaluado?: boolean;
  fecha_evaluacion?: Date | null;
  ponderacion_usada: string;
};

export type UpdateRegistroTestInput = Partial<CreateRegistroTestInput>;
export enum EstadoCita {
  PENDIENTE="PEDIENTE",
  CONFIRMADA="CONFIRMADA",
  CANCELADA="CANCELADA",
  COMPLETADA="COMPLETADA"
}

export type CanceladoPor = 'PSICOLOGO' | 'PACIENTE' | 'SISTEMA' | null;

export type PeriodoMetrica = 'DIARIO' | 'SEMANAL' | 'MENSUAL';

export interface RegistroCita {
  id: number;
  cita_id: number;
  fecha_registro: Date;
  id_psicologo: number;
  nombre_psicologo: string;
  id_paciente: number | null;
  nombre_paciente: string | null;
  fecha_cita: Date;
  duracion_planeada: number; // en minutos
  duracion_real: number | null; // en minutos
  estado: EstadoCita;
  tipo_cita: string | null;
  color_calendario: string | null;
  tiempo_confirmacion: number | null; // en minutos
  cancelado_por: CanceladoPor;
  motivo_cancelacion: string | null;
  registro_usuario_id: number | null;
}


export interface RegistroCitaInput {
  cita_id: number;
  id_psicologo: number;
  nombre_psicologo: string;
  id_paciente?: number | null;
  nombre_paciente?: string | null;
  fecha_cita: Date;
  duracion_planeada: number;
  duracion_real?: number | null;
  estado: EstadoCita;
  tipo_cita?: string | null;
  color_calendario?: string | null;
  tiempo_confirmacion?: number | null;
  cancelado_por?: CanceladoPor;
  motivo_cancelacion?: string | null;
  registro_usuario_id?: number | null;
}

// Para métricas de citas
export interface RegistroMetricaCitas {
    id: number;
    fecha: Date;
    periodo: PeriodoMetrica;
    citas_totales: number;
    citas_completadas: number;
    citas_canceladas: number;
    tasa_confirmacion: number;
    tiempo_promedio_confirmacion: number; // en minutos
    duracion_promedio: number; // en minutos
    tipos_cita: Record<string, number>; // Ej: {"EVALUACION": 5, "SEGUIMIENTO": 3}
}
// Para métricas de citas
export interface RegistroMetricaCitasInput {
  fecha?: Date;
  periodo: PeriodoMetrica;
  citas_totales: number;
  citas_completadas: number;
  citas_canceladas: number;
  tasa_confirmacion: number;
  tiempo_promedio_confirmacion: number;
  duracion_promedio: number;
  tipos_cita: {
    [key: string]: number;
  };
}

// Para respuestas paginadas de la API
export interface PaginatedRegistroCitaResponse {
  data: RegistroCita[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}