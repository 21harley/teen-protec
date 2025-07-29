import { PrismaClient } from "../../generated/prisma";
import { RegistroReporte } from "../../types/registros/index";

const prisma = new PrismaClient();

// Tipos para inputs y filtros
export type CreateRegistroReporteInput = {
  tipo: string;
  parametros: any; // Objeto JSON con los parámetros del reporte
  generado_por_id?: number | null;
  formato: string;
  ruta_almacenamiento?: string | null;
};

export type UpdateRegistroReporteInput = Partial<CreateRegistroReporteInput>;

export type OrderByOptions = {
  fecha_generacion?: "asc" | "desc";
};

export type FilterRegistroReporteOptions = {
  tipo?: string;
  formato?: string;
  generado_por_id?: number | null;
  fechaDesde?: Date;
  fechaHasta?: Date;
  skip?: number;
  take?: number;
  orderBy?: OrderByOptions;
};

// Función para transformar los datos de Prisma al tipo RegistroReporte
function toRegistroReporte(prismaData: any): RegistroReporte {
  return {
    id: prismaData.id,
    tipo: prismaData.tipo,
    parametros: prismaData.parametros,
    fecha_generacion: prismaData.fecha_generacion,
    generado_por_id: prismaData.generado_por_id ?? null,
    formato: prismaData.formato,
    ruta_almacenamiento: prismaData.ruta_almacenamiento ?? null,
  };
}

class RegistroReporteService {
  /**
   * Crea un nuevo registro de reporte
   * @param data Datos del reporte
   * @returns RegistroReporte creado
   */
  async createRegistroReporte(data: CreateRegistroReporteInput): Promise<RegistroReporte> {
    try {
      // Validar que el usuario existe si se proporciona generado_por_id
      if (data.generado_por_id) {
        const usuarioExists = await prisma.usuario.findUnique({
          where: { id: data.generado_por_id },
        });

        if (!usuarioExists) {
          throw new Error("El usuario referenciado no existe");
        }
      }

      // Validar tipos de reporte permitidos
      const tiposPermitidos = ["general", "psicologo", "paciente"];
      if (!tiposPermitidos.includes(data.tipo)) {
        throw new Error(`Tipo de reporte no válido. Debe ser uno de: ${tiposPermitidos.join(", ")}`);
      }

      // Validar formatos permitidos
      const formatosPermitidos = ["pdf", "csv", "xlsx", "html"];
      if (!formatosPermitidos.includes(data.formato)) {
        throw new Error(`Formato no válido. Debe ser uno de: ${formatosPermitidos.join(", ")}`);
      }

      const reporte = await prisma.registroReporte.create({
        data: {
          tipo: data.tipo,
          parametros: data.parametros,
          generado_por_id: data.generado_por_id ?? null,
          formato: data.formato,
          ruta_almacenamiento: data.ruta_almacenamiento ?? null,
        },
      });

      return toRegistroReporte(reporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear registro de reporte: ${message}`);
    }
  }

  /**
   * Obtiene un registro de reporte por su ID
   * @param id ID del reporte
   * @returns RegistroReporte encontrado o null
   */
  async getRegistroReporteById(id: number): Promise<RegistroReporte | null> {
    try {
      const reporte = await prisma.registroReporte.findUnique({
        where: { id },
      });

      return reporte ? toRegistroReporte(reporte) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registro de reporte por ID: ${message}`);
    }
  }

  /**
   * Obtiene registros de reportes con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de RegistroReporte que coinciden con los filtros
   */
  async getRegistrosReportes(
    options?: FilterRegistroReporteOptions
  ): Promise<RegistroReporte[]> {
    try {
      const reportes = await prisma.registroReporte.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha_generacion: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return reportes.map(toRegistroReporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registros de reportes: ${message}`);
    }
  }

  /**
   * Actualiza un registro de reporte
   * @param id ID del reporte a actualizar
   * @param data Datos a actualizar
   * @returns RegistroReporte actualizado
   */
  async updateRegistroReporte(
    id: number,
    data: UpdateRegistroReporteInput
  ): Promise<RegistroReporte> {
    try {
      // Validar que el reporte existe
      const reporteExists = await prisma.registroReporte.findUnique({
        where: { id },
      });

      if (!reporteExists) {
        throw new Error("Registro de reporte no encontrado");
      }

      // Validaciones adicionales si se actualizan estos campos
      if (data.generado_por_id !== undefined) {
        if (data.generado_por_id !== null) {
          const usuarioExists = await prisma.usuario.findUnique({
            where: { id: data.generado_por_id },
          });
          if (!usuarioExists) {
            throw new Error("El usuario referenciado no existe");
          }
        }
      }

      if (data.tipo !== undefined) {
        const tiposPermitidos = ["general", "psicologo", "paciente"];
        if (!tiposPermitidos.includes(data.tipo)) {
          throw new Error(`Tipo de reporte no válido. Debe ser uno de: ${tiposPermitidos.join(", ")}`);
        }
      }

      if (data.formato !== undefined) {
        const formatosPermitidos = ["pdf", "csv", "xlsx", "html"];
        if (!formatosPermitidos.includes(data.formato)) {
          throw new Error(`Formato no válido. Debe ser uno de: ${formatosPermitidos.join(", ")}`);
        }
      }

      const reporte = await prisma.registroReporte.update({
        where: { id },
        data: {
          tipo: data.tipo,
          parametros: data.parametros,
          generado_por_id: data.generado_por_id === undefined ? undefined : data.generado_por_id,
          formato: data.formato,
          ruta_almacenamiento: data.ruta_almacenamiento === undefined ? undefined : data.ruta_almacenamiento,
        },
      });

      return toRegistroReporte(reporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de reporte: ${message}`);
    }
  }

  /**
   * Elimina un registro de reporte
   * @param id ID del reporte a eliminar
   * @returns RegistroReporte eliminado
   */
  async deleteRegistroReporte(id: number): Promise<RegistroReporte> {
    try {
      const reporte = await prisma.registroReporte.delete({
        where: { id },
      });

      return toRegistroReporte(reporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar registro de reporte: ${message}`);
    }
  }

  /**
   * Obtiene los reportes generados por un usuario específico
   * @param usuarioId ID del usuario
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de reportes ordenados por fecha
   */
  async getReportesByUsuario(
    usuarioId: number,
    limit: number = 10
  ): Promise<RegistroReporte[]> {
    try {
      const reportes = await prisma.registroReporte.findMany({
        where: { generado_por_id: usuarioId },
        orderBy: { fecha_generacion: "desc" },
        take: limit,
      });

      return reportes.map(toRegistroReporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener reportes por usuario: ${message}`);
    }
  }

  /**
   * Obtiene los reportes de un tipo específico
   * @param tipo Tipo de reporte ("general", "psicologo", "paciente")
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de reportes ordenados por fecha
   */
  async getReportesByTipo(
    tipo: string,
    limit: number = 10
  ): Promise<RegistroReporte[]> {
    try {
      const tiposPermitidos = ["general", "psicologo", "paciente"];
      if (!tiposPermitidos.includes(tipo)) {
        throw new Error(`Tipo de reporte no válido. Debe ser uno de: ${tiposPermitidos.join(", ")}`);
      }

      const reportes = await prisma.registroReporte.findMany({
        where: { tipo },
        orderBy: { fecha_generacion: "desc" },
        take: limit,
      });

      return reportes.map(toRegistroReporte);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener reportes por tipo: ${message}`);
    }
  }

  // Métodos auxiliares privados
  private buildWhereClause(options?: FilterRegistroReporteOptions): any {
    const where: any = {};

    if (options?.tipo) where.tipo = options.tipo;
    if (options?.formato) where.formato = options.formato;
    
    // Filtro para generado_por_id (incluye null si se especifica)
    if (options?.generado_por_id !== undefined) {
      where.generado_por_id = options.generado_por_id;
    }
    
    // Filtros de fecha
    if (options?.fechaDesde || options?.fechaHasta) {
      where.fecha_generacion = {};
      if (options.fechaDesde) where.fecha_generacion.gte = options.fechaDesde;
      if (options.fechaHasta) where.fecha_generacion.lte = options.fechaHasta;
    }

    return where;
  }
}

export default new RegistroReporteService();