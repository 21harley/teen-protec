import { EstadoCita, PrismaClient } from "../../generated/prisma";
import { RegistroCita, RegistroMetricaCitas } from "../../types/registros/index";

const prisma = new PrismaClient();

// Tipos para inputs y filtros
export type CreateRegistroCitaInput = {
  cita_id: number;
  id_psicologo: number;
  nombre_psicologo: string;
  id_paciente?: number | null;
  nombre_paciente?: string | null;
  fecha_cita: Date;
  duracion_planeada: number;
  duracion_real?: number | null;
  estado: string; // EstadoCita enum
  tipo_cita?: string | null;
  color_calendario?: string | null;
  tiempo_confirmacion?: number | null;
  cancelado_por?: string | null;
  motivo_cancelacion?: string | null;
  registro_usuario_id?: number | null;
};

export type UpdateRegistroCitaInput = Partial<CreateRegistroCitaInput>;

export type OrderByCitaOptions = {
  fecha_cita?: "asc" | "desc";
  fecha_registro?: "asc" | "desc";
  duracion_planeada?: "asc" | "desc";
  duracion_real?: "asc" | "desc";
};

export type FilterRegistroCitaOptions = {
  id_psicologo?: number;
  id_paciente?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estados?: string[]; // Estados de cita a filtrar
  tipo_cita?: string;
  minDuracion?: number;
  maxDuracion?: number;
  skip?: number;
  take?: number;
  orderBy?: OrderByCitaOptions;
  cancelado_por?: string;
};

export type CreateMetricaCitasInput = {
  periodo: "DIARIO" | "SEMANAL" | "MENSUAL";
  citas_totales: number;
  citas_completadas: number;
  citas_canceladas: number;
  tasa_confirmacion: number;
  tiempo_promedio_confirmacion: number;
  duracion_promedio: number;
  tipos_cita: any; // JSON object
};

export type FilterMetricaCitasOptions = {
  fechaDesde?: Date;
  fechaHasta?: Date;
  periodo?: "DIARIO" | "SEMANAL" | "MENSUAL";
  skip?: number;
  take?: number;
  orderBy?: {
    fecha?: "asc" | "desc";
  };
};

// Función para transformar los datos de Prisma al tipo RegistroCita
function toRegistroCita(prismaData: any): RegistroCita {
  return {
    id: prismaData.id,
    cita_id: prismaData.cita_id,
    fecha_registro: prismaData.fecha_registro,
    id_psicologo: prismaData.id_psicologo,
    nombre_psicologo: prismaData.nombre_psicologo,
    id_paciente: prismaData.id_paciente ?? null,
    nombre_paciente: prismaData.nombre_paciente ?? null,
    fecha_cita: prismaData.fecha_cita,
    duracion_planeada: prismaData.duracion_planeada,
    duracion_real: prismaData.duracion_real ?? null,
    estado: prismaData.estado,
    tipo_cita: prismaData.tipo_cita ?? null,
    color_calendario: prismaData.color_calendario ?? null,
    tiempo_confirmacion: prismaData.tiempo_confirmacion ?? null,
    cancelado_por: prismaData.cancelado_por ?? null,
    motivo_cancelacion: prismaData.motivo_cancelacion ?? null,
    registro_usuario_id: prismaData.registro_usuario_id ?? null,
  };
}

// Función para transformar los datos de Prisma al tipo RegistroMetricaCitas
function toRegistroMetricaCitas(prismaData: any): RegistroMetricaCitas {
  return {
    id: prismaData.id,
    fecha: prismaData.fecha,
    periodo: prismaData.periodo,
    citas_totales: prismaData.citas_totales,
    citas_completadas: prismaData.citas_completadas,
    citas_canceladas: prismaData.citas_canceladas,
    tasa_confirmacion: prismaData.tasa_confirmacion,
    tiempo_promedio_confirmacion: prismaData.tiempo_promedio_confirmacion,
    duracion_promedio: prismaData.duracion_promedio,
    tipos_cita: prismaData.tipos_cita,
  };
}

class RegistroCitaService {
  /**
   * Crea un nuevo registro de cita
   * @param data Datos del registro de cita
   * @returns RegistroCita creado
   */
  /**
 * Crea un nuevo registro de cita verificando primero si existe un registro de usuario
 * Si no existe, crea un registro de usuario antes de crear la cita
 * @param data Datos del registro de cita
 * @returns RegistroCita creado
 */
async createRegistroCita(data: CreateRegistroCitaInput): Promise<RegistroCita> {
  console.log(data,"cita-data-createRegistroCita");
  try {
    // Validaciones básicas
    if (data.duracion_planeada <= 0) {
      throw new Error("La duración planeada debe ser mayor a 0");
    }

    // Verificar si se proporcionó un ID de paciente
    if (data.id_paciente) {
      // Verificar si existe un registro de usuario para este paciente
      let registroUsuario = await prisma.registroUsuario.findUnique({
        where: { id: data.id_paciente },
      });
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: data.id_paciente }
      });

      // Si no existe, crear un nuevo registro de usuario
      if (!registroUsuario ) {
      if(usuarioExistente){
          registroUsuario = await prisma.registroUsuario.create({
          data: {
            usuario_id: usuarioExistente.id,
            sexo: usuarioExistente.sexo ?? "",
            fecha_nacimiento: usuarioExistente.fecha_nacimiento,
            tipo_usuario: String(usuarioExistente.id_tipo_usuario),
            psicologo_id: usuarioExistente.id_psicologo,
            tests_ids: [],
            total_tests: 0,
          },
        });
        data.registro_usuario_id = registroUsuario.id;
      }
      }

      // Asignar el ID del registro de usuario a la cita
      
    }

    // Si se proporcionó un registro_usuario_id, validar que exista
    if (data.registro_usuario_id) {
      const registroUsuarioExists = await prisma.registroUsuario.findUnique({
        where: { id: data.registro_usuario_id },
      });

      if (!registroUsuarioExists) {
        throw new Error("El registro de usuario referenciado no existe");
      }
    }

    // Crear el registro de la cita
    console.log(data,"cita");
    const registro = await prisma.registroCita.create({
      data: {
        cita_id: data.cita_id,
        id_psicologo: data.id_psicologo,
        nombre_psicologo: data.nombre_psicologo,
        id_paciente: data.id_paciente ?? null,
        nombre_paciente: data.nombre_paciente ?? null,
        fecha_cita: data.fecha_cita,
        duracion_planeada: 1,
        duracion_real:1,
        estado: data.estado as EstadoCita,
        tipo_cita: data.tipo_cita ?? null,
        color_calendario: data.color_calendario ?? null,
        tiempo_confirmacion: data.tiempo_confirmacion ?? null,
        cancelado_por: data.cancelado_por ?? null,
        motivo_cancelacion: data.motivo_cancelacion ?? null,
        registro_usuario_id: data.registro_usuario_id ?? null,
      },
    });

    return toRegistroCita(registro);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al crear registro de cita: ${message}`);
  }
}

  /**
   * Obtiene un registro de cita por su ID
   * @param id ID del registro
   * @returns RegistroCita encontrado o null
   */
  async getRegistroCitaById(id: number): Promise<RegistroCita | null> {
    try {
      const registro = await prisma.registroCita.findUnique({
        where: { id },
      });

      return registro ? toRegistroCita(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registro de cita por ID: ${message}`);
    }
  }

  /**
   * Obtiene registros de citas con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de RegistroCita que coinciden con los filtros
   */
  async getRegistrosCitas(
    options?: FilterRegistroCitaOptions
  ): Promise<RegistroCita[]> {
    try {
      const registros = await prisma.registroCita.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha_cita: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return registros.map(toRegistroCita);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registros de citas: ${message}`);
    }
  }

  /**
   * Actualiza un registro de cita
   * @param id ID del registro a actualizar
   * @param data Datos a actualizar
   * @returns RegistroCita actualizado
   */
  async updateRegistroCita(
    id: number,
    data: UpdateRegistroCitaInput
  ): Promise<RegistroCita> {
    try {
      // Validar que el registro existe
      const registroExists = await prisma.registroCita.findUnique({
        where: { id },
      });

      if (!registroExists) {
        throw new Error("Registro de cita no encontrado");
      }

      // Validaciones adicionales si se actualizan estos campos
      if (data.registro_usuario_id !== undefined && data.registro_usuario_id !== null) {
        const registroUsuarioExists = await prisma.registroUsuario.findUnique({
          where: { id: data.registro_usuario_id },
        });
        if (!registroUsuarioExists) {
          throw new Error("El registro de usuario referenciado no existe");
        }
      }

      if (data.duracion_real !== undefined  && data.duracion_real !== null) {
        if(data.duracion_real <= 0) throw new Error("La duración real debe ser mayor a 0");
      }
      let auxDuracionPlaneada = parseInt(String(data.duracion_planeada) || "1");
      let auxDuracionReal = parseInt(String(data.duracion_real) || "1");

      const registro = await prisma.registroCita.update({
        where: { id },
        data: {
          id_psicologo: data.id_psicologo,
          nombre_psicologo: data.nombre_psicologo,
          id_paciente: data.id_paciente === undefined ? undefined : data.id_paciente,
          nombre_paciente: data.nombre_paciente === undefined ? undefined : data.nombre_paciente,
          fecha_cita: data.fecha_cita,
          duracion_planeada: auxDuracionPlaneada,
          duracion_real: auxDuracionReal,
          estado: data.estado as EstadoCita,
          tipo_cita: data.tipo_cita === undefined ? undefined : data.tipo_cita,
          color_calendario: data.color_calendario === undefined ? undefined : data.color_calendario,
          tiempo_confirmacion: data.tiempo_confirmacion === undefined ? undefined : data.tiempo_confirmacion,
          cancelado_por: data.cancelado_por === undefined ? undefined : data.cancelado_por,
          motivo_cancelacion: data.motivo_cancelacion === undefined ? undefined : data.motivo_cancelacion,
          registro_usuario_id: data.registro_usuario_id === undefined ? undefined : data.registro_usuario_id,
        },
      });

      return toRegistroCita(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de cita: ${message}`);
    }
  }

  /**
   * Elimina un registro de cita
   * @param id ID del registro a eliminar
   * @returns RegistroCita eliminado
   */
  async deleteRegistroCita(id: number): Promise<RegistroCita> {
    try {
      const registro = await prisma.registroCita.delete({
        where: { id },
      });

      return toRegistroCita(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar registro de cita: ${message}`);
    }
  }

  /**
   * Obtiene las citas de un psicólogo específico
   * @param psicologoId ID del psicólogo
   * @param options Opciones de filtrado adicionales
   * @returns Lista de citas
   */
  async getCitasByPsicologo(
    psicologoId: number,
    options?: Omit<FilterRegistroCitaOptions, 'id_psicologo'>
  ): Promise<RegistroCita[]> {
    try {
      const citas = await prisma.registroCita.findMany({
        where: this.buildWhereClause({ ...options, id_psicologo: psicologoId }),
        orderBy: options?.orderBy || { fecha_cita: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return citas.map(toRegistroCita);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener citas por psicólogo: ${message}`);
    }
  }

  /**
   * Obtiene las citas de un paciente específico
   * @param pacienteId ID del paciente
   * @param options Opciones de filtrado adicionales
   * @returns Lista de citas
   */
  async getCitasByPaciente(
    pacienteId: number,
    options?: Omit<FilterRegistroCitaOptions, 'id_paciente'>
  ): Promise<RegistroCita[]> {
    try {
      const citas = await prisma.registroCita.findMany({
        where: this.buildWhereClause({ ...options, id_paciente: pacienteId }),
        orderBy: options?.orderBy || { fecha_cita: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return citas.map(toRegistroCita);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener citas por paciente: ${message}`);
    }
  }

  /**
   * Actualiza la duración real de una cita
   * @param id ID de la cita
   * @param duracionReal Duración en minutos
   * @returns RegistroCita actualizado
   */
  async actualizarDuracionReal(
    id: number,
    duracionReal: number
  ): Promise<RegistroCita> {
    try {
      if (duracionReal <= 0) {
        throw new Error("La duración real debe ser mayor a 0");
      }

      const registro = await prisma.registroCita.update({
        where: { id },
        data: { duracion_real: duracionReal },
      });

      return toRegistroCita(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar duración real: ${message}`);
    }
  }

  /**
   * Cancela una cita
   * @param id ID de la cita
   * @param canceladoPor Quién cancela la cita ("PSICOLOGO", "PACIENTE", "SISTEMA")
   * @param motivo Motivo de cancelación (opcional)
   * @returns RegistroCita actualizado
   */
  async cancelarCita(
    id: number,
    canceladoPor: string,
    motivo?: string
  ): Promise<RegistroCita> {
    try {
      if (!["PSICOLOGO", "PACIENTE", "SISTEMA"].includes(canceladoPor)) {
        throw new Error('cancelado_por debe ser "PSICOLOGO", "PACIENTE" o "SISTEMA"');
      }

      const registro = await prisma.registroCita.update({
        where: { id },
        data: {
          estado: "CANCELADA",
          cancelado_por: canceladoPor,
          motivo_cancelacion: motivo ?? null,
        },
      });

      return toRegistroCita(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al cancelar cita: ${message}`);
    }
  }

     /**
   * Busca un registro por ID de cita y lo actualiza si existe, o crea uno nuevo si no existe
   * @param citaId ID de la cita
   * @param citaData Datos de la cita para crear/actualizar
   * @returns El registro creado o actualizado
   */
  async upsertRegistroByCitaId(
    citaId: number,
    citaData: CreateRegistroCitaInput
  ): Promise<RegistroCita> {
    try {
      // Verificar si ya existe un registro para esta cita
      const registroExistente = await prisma.registroCita.findFirst({
        where: { cita_id: citaId },
      });
      if (registroExistente) {
        citaData.registro_usuario_id = registroExistente.id
        // Si existe, actualizamos el registro
        return await this.updateRegistroCita(registroExistente.id, citaData);
      } else {
        // Si no existe, creamos un nuevo registro
        return await this.createRegistroCita({
          ...citaData,
          cita_id: citaId, // Aseguramos que el cita_id sea el correcto
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al hacer upsert del registro de cita: ${message}`);
    }
  }

  // Métodos auxiliares privados
  private buildWhereClause(options?: FilterRegistroCitaOptions): any {
    const where: any = {};

    if (options?.id_psicologo) where.id_psicologo = options.id_psicologo;
    if (options?.id_paciente) where.id_paciente = options.id_paciente;
    
    // Filtros de fecha
    if (options?.fechaDesde || options?.fechaHasta) {
      where.fecha_cita = {};
      if (options.fechaDesde) where.fecha_cita.gte = options.fechaDesde;
      if (options.fechaHasta) where.fecha_cita.lte = options.fechaHasta;
    }
    
    // Filtros de estado
    if (options?.estados && options.estados.length > 0) {
      where.estado = { in: options.estados };
    }
    
    // Filtros de tipo de cita
    if (options?.tipo_cita) where.tipo_cita = options.tipo_cita;
    
    // Filtros de duración
    if (options?.minDuracion || options?.maxDuracion) {
      where.duracion_planeada = {};
      if (options.minDuracion) where.duracion_planeada.gte = options.minDuracion;
      if (options.maxDuracion) where.duracion_planeada.lte = options.maxDuracion;
    }
    
    // Filtro de cancelado por
    if (options?.cancelado_por) where.cancelado_por = options.cancelado_por;

    return where;
  }
}

class RegistroMetricaCitasService {


  /**
   * Crea una nueva métrica de citas
   * @param data Datos de la métrica
   * @returns RegistroMetricaCitas creado
   */
  async createMetricaCitas(data: CreateMetricaCitasInput): Promise<RegistroMetricaCitas> {
    try {
      // Validaciones básicas
      if (data.citas_totales < 0 || data.citas_completadas < 0 || data.citas_canceladas < 0) {
        throw new Error("Los conteos de citas no pueden ser negativos");
      }

      if (!["DIARIO", "SEMANAL", "MENSUAL"].includes(data.periodo)) {
        throw new Error('periodo debe ser "DIARIO", "SEMANAL" o "MENSUAL"');
      }

      const metrica = await prisma.registroMetricaCitas.create({
        data: {
          periodo: data.periodo,
          citas_totales: data.citas_totales,
          citas_completadas: data.citas_completadas,
          citas_canceladas: data.citas_canceladas,
          tasa_confirmacion: data.tasa_confirmacion,
          tiempo_promedio_confirmacion: data.tiempo_promedio_confirmacion,
          duracion_promedio: data.duracion_promedio,
          tipos_cita: data.tipos_cita,
        },
      });

      return toRegistroMetricaCitas(metrica);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear métrica de citas: ${message}`);
    }
  }
/**
 * Obtiene el ID del registro de cita basado en el ID de la cita
 * @param citaId ID de la cita
 * @returns ID del registro o null si no se encuentra
 */
async getRegistroIdByCitaId(citaId: number): Promise<number | null> {
  try {
    const registro = await prisma.registroCita.findFirst({
      where: { cita_id: citaId },
      select: { id: true }
    });

    return registro ? registro.id : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al obtener ID de registro por ID de cita: ${message}`);
  }
}
  /**
   * Obtiene métricas de citas con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de métricas que coinciden con los filtros
   */
  async getMetricasCitas(
    options?: FilterMetricaCitasOptions
  ): Promise<RegistroMetricaCitas[]> {
    try {
      const metricas = await prisma.registroMetricaCitas.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return metricas.map(toRegistroMetricaCitas);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener métricas de citas: ${message}`);
    }
  }

  /**
   * Genera métricas de citas para un período específico
   * @param periodo "DIARIO", "SEMANAL" o "MENSUAL"
   * @param fecha Fecha de referencia para el período
   * @returns RegistroMetricaCitas generado
   */
  async generarMetricasPeriodo(
    periodo: "DIARIO" | "SEMANAL" | "MENSUAL",
    fecha: Date = new Date()
  ): Promise<RegistroMetricaCitas> {
    try {
      // Calcular fechas de inicio y fin según el período
      let fechaInicio: Date;
      let fechaFin: Date = new Date(fecha);

      if (periodo === "DIARIO") {
        fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
      } else if (periodo === "SEMANAL") {
        fechaInicio = new Date(fecha);
        fechaInicio.setDate(fecha.getDate() - fecha.getDay()); // Domingo de la semana
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6); // Sábado de la semana
        fechaFin.setHours(23, 59, 59, 999);
      } else { // MENSUAL
        fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        fechaFin.setHours(23, 59, 59, 999);
      }

      // Obtener citas en el período
      const citas = await prisma.registroCita.findMany({
        where: {
          fecha_cita: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      // Calcular métricas
      const citas_totales = citas.length;
      const citas_completadas = citas.filter(c => c.estado === "COMPLETADA").length;
      const citas_canceladas = citas.filter(c => c.estado === "CANCELADA").length;

      const citasConfirmadas = citas.filter(c => c.tiempo_confirmacion !== null);
      const tiempo_promedio_confirmacion = citasConfirmadas.length > 0 
        ? Math.round(citasConfirmadas.reduce((sum, c) => sum + (c.tiempo_confirmacion || 0), 0) / citasConfirmadas.length)
        : 0;

      const citasConDuracion = citas.filter(c => c.duracion_real !== null);
      const duracion_promedio = citasConDuracion.length > 0
        ? citasConDuracion.reduce((sum, c) => sum + (c.duracion_real || 0), 0) / citasConDuracion.length
        : 0;

      // Calcular tasa de confirmación
      const tasa_confirmacion = citas_totales > 0 
        ? parseFloat(((citas_totales - citas_canceladas) / citas_totales * 100).toFixed(2))
        : 0;

      // Agrupar por tipo de cita
      const tiposCita: Record<string, number> = {};
      citas.forEach(cita => {
        const tipo = cita.tipo_cita || "SIN_TIPO";
        tiposCita[tipo] = (tiposCita[tipo] || 0) + 1;
      });

      // Crear la métrica
      const metrica = await this.createMetricaCitas({
        periodo,
        citas_totales,
        citas_completadas,
        citas_canceladas,
        tasa_confirmacion,
        tiempo_promedio_confirmacion,
        duracion_promedio,
        tipos_cita: tiposCita,
      });

      return metrica;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al generar métricas del período: ${message}`);
    }
  }


  // Métodos auxiliares privados
  private buildWhereClause(options?: FilterMetricaCitasOptions): any {
    const where: any = {};

    // Filtros de fecha
    if (options?.fechaDesde || options?.fechaHasta) {
      where.fecha = {};
      if (options.fechaDesde) where.fecha.gte = options.fechaDesde;
      if (options.fechaHasta) where.fecha.lte = options.fechaHasta;
    }
    
    // Filtro de período
    if (options?.periodo) where.periodo = options.periodo;

    return where;
  }
  
}

export const registroCitaService = new RegistroCitaService();
export const registroMetricaCitasService = new RegistroMetricaCitasService();