import { PrismaClient } from "../../generated/prisma";
import { RegistroSesion } from "../../types/registros/index";

const prisma = new PrismaClient();

// Tipos para inputs y filtros
export type CreateRegistroSesionInput = {
  registro_usuario_id: number;
  psicologo_id: number;
  fecha: Date;
  duracion?: number | null;
  tests_revisados?: string | null;
};

export type UpdateRegistroSesionInput = Partial<CreateRegistroSesionInput>;

export type OrderByOptions = {
  fecha?: "asc" | "desc";
  duracion?: "asc" | "desc";
};

export type FilterRegistroSesionOptions = {
  registro_usuario_id?: number;
  psicologo_id?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  minDuracion?: number;
  maxDuracion?: number;
  skip?: number;
  take?: number;
  orderBy?: OrderByOptions;
};

// Función para transformar los datos de Prisma al tipo RegistroSesion
function toRegistroSesion(prismaData: any): RegistroSesion {
  return {
    id: prismaData.id,
    registro_usuario_id: prismaData.registro_usuario_id,
    psicologo_id: prismaData.psicologo_id,
    fecha: prismaData.fecha,
    duracion: prismaData.duracion ?? null,
    tests_revisados: prismaData.tests_revisados ?? null,
    usuario: prismaData.usuario ? toRegistroUsuario(prismaData.usuario) : undefined
  };
}

// Función auxiliar para transformar usuario si es necesario
function toRegistroUsuario(prismaData: any): any {
  return {
    id: prismaData.id,
    usuario_id: prismaData.usuario_id,
    // ... otras propiedades del usuario si son necesarias
  };
}

class RegistroSesionService {
  /**
   * Crea un nuevo registro de sesión
   * @param data Datos del registro de sesión
   * @returns RegistroSesion creado
   */
  async createRegistroSesion(data: CreateRegistroSesionInput): Promise<RegistroSesion> {
    try {
      // Validar que el registro de usuario existe
      const registroUsuarioExists = await prisma.registroUsuario.findUnique({
        where: { id: data.registro_usuario_id },
      });

      if (!registroUsuarioExists) {
        throw new Error("El registro de usuario referenciado no existe");
      }

      // Validar que el psicólogo existe
      const psicologoExists = await prisma.usuario.findUnique({
        where: { id: data.psicologo_id },
      });

      if (!psicologoExists) {
        throw new Error("El psicólogo referenciado no existe");
      }

      const registro = await prisma.registroSesion.create({
        data: {
          registro_usuario_id: data.registro_usuario_id,
          psicologo_id: data.psicologo_id,
          fecha: data.fecha,
          duracion: data.duracion ?? null,
          tests_revisados: data.tests_revisados ?? null,
        },
      });

      return toRegistroSesion(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear registro de sesión: ${message}`);
    }
  }

  /**
   * Obtiene un registro de sesión por su ID
   * @param id ID del registro
   * @param includeUsuario Incluir datos del usuario (opcional)
   * @returns RegistroSesion encontrado o null
   */
  async getRegistroSesionById(
    id: number,
    includeUsuario: boolean = false
  ): Promise<RegistroSesion | null> {
    try {
      const registro = await prisma.registroSesion.findUnique({
        where: { id },
        include: includeUsuario ? { usuario: true } : undefined,
      });

      return registro ? toRegistroSesion(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registro de sesión por ID: ${message}`);
    }
  }

  /**
   * Obtiene registros de sesión con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de RegistroSesion que coinciden con los filtros
   */
  async getRegistrosSesiones(
    options?: FilterRegistroSesionOptions
  ): Promise<RegistroSesion[]> {
    try {
      const registros = await prisma.registroSesion.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha: "desc" },
        skip: options?.skip,
        take: options?.take,
        include: {
          usuario: options?.registro_usuario_id ? true : false,
        },
      });

      return registros.map(toRegistroSesion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registros de sesión: ${message}`);
    }
  }

  /**
   * Actualiza un registro de sesión
   * @param id ID del registro a actualizar
   * @param data Datos a actualizar
   * @returns RegistroSesion actualizado
   */
  async updateRegistroSesion(
    id: number,
    data: UpdateRegistroSesionInput
  ): Promise<RegistroSesion> {
    try {
      // Validar que el registro existe
      const registroExists = await prisma.registroSesion.findUnique({
        where: { id },
      });

      if (!registroExists) {
        throw new Error("Registro de sesión no encontrado");
      }

      // Validaciones adicionales si se actualizan estos campos
      if (data.registro_usuario_id !== undefined) {
        const registroUsuarioExists = await prisma.registroUsuario.findUnique({
          where: { id: data.registro_usuario_id },
        });
        if (!registroUsuarioExists) {
          throw new Error("El registro de usuario referenciado no existe");
        }
      }

      if (data.psicologo_id !== undefined) {
        const psicologoExists = await prisma.usuario.findUnique({
          where: { id: data.psicologo_id },
        });
        if (!psicologoExists) {
          throw new Error("El psicólogo referenciado no existe");
        }
      }

      const registro = await prisma.registroSesion.update({
        where: { id },
        data: {
          registro_usuario_id: data.registro_usuario_id,
          psicologo_id: data.psicologo_id,
          fecha: data.fecha,
          duracion: data.duracion === undefined ? undefined : data.duracion,
          tests_revisados: data.tests_revisados === undefined ? undefined : data.tests_revisados,
        },
      });

      return toRegistroSesion(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de sesión: ${message}`);
    }
  }

  /**
   * Elimina un registro de sesión
   * @param id ID del registro a eliminar
   * @returns RegistroSesion eliminado
   */
  async deleteRegistroSesion(id: number): Promise<RegistroSesion> {
    try {
      const registro = await prisma.registroSesion.delete({
        where: { id },
      });

      return toRegistroSesion(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar registro de sesión: ${message}`);
    }
  }

  /**
   * Obtiene las sesiones de un usuario específico
   * @param registroUsuarioId ID del registro de usuario
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de sesiones ordenadas por fecha
   */
  async getSesionesByUsuario(
    registroUsuarioId: number,
    limit: number = 10
  ): Promise<RegistroSesion[]> {
    try {
      const sesiones = await prisma.registroSesion.findMany({
        where: { registro_usuario_id: registroUsuarioId },
        orderBy: { fecha: "desc" },
        take: limit,
      });

      return sesiones.map(toRegistroSesion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener sesiones por usuario: ${message}`);
    }
  }

  /**
   * Obtiene las sesiones realizadas por un psicólogo específico
   * @param psicologoId ID del psicólogo
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de sesiones ordenadas por fecha
   */
  async getSesionesByPsicologo(
    psicologoId: number,
    limit: number = 10
  ): Promise<RegistroSesion[]> {
    try {
      const sesiones = await prisma.registroSesion.findMany({
        where: { psicologo_id: psicologoId },
        orderBy: { fecha: "desc" },
        take: limit,
      });

      return sesiones.map(toRegistroSesion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener sesiones por psicólogo: ${message}`);
    }
  }

  // Métodos auxiliares privados
  private buildWhereClause(options?: FilterRegistroSesionOptions): any {
    const where: any = {};

    if (options?.registro_usuario_id) where.registro_usuario_id = options.registro_usuario_id;
    if (options?.psicologo_id) where.psicologo_id = options.psicologo_id;
    
    // Filtros de fecha
    if (options?.fechaDesde || options?.fechaHasta) {
      where.fecha = {};
      if (options.fechaDesde) where.fecha.gte = options.fechaDesde;
      if (options.fechaHasta) where.fecha.lte = options.fechaHasta;
    }
    
    // Filtros de duración
    if (options?.minDuracion || options?.maxDuracion) {
      where.duracion = {};
      if (options.minDuracion) where.duracion.gte = options.minDuracion;
      if (options.maxDuracion) where.duracion.lte = options.maxDuracion;
    }

    return where;
  }
}

export default new RegistroSesionService();