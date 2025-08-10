import { PrismaClient } from "../../generated/prisma";
import {
  RegistroUsuario,
  RegistroTrazabilidad,
  RegistroMetricaUsuario,
  RegistroSesion,
  RegistroTest,
  Sexo,
  EstadoTestRegistro
} from "../../types/registros/index";

const prisma = new PrismaClient();

// Tipos para inputs y filtros (actualizados)
export type CreateRegistroSesionInput = {
  registro_usuario_id?: number;
  usuario_id?: number;  
  ip_address?: string;
  user_agent?: string;
};

export type UpdateRegistroSesionInput = {
  fecha_fin?: Date;
  duracion?: number;
};

// Función transformadora actualizada para RegistroSesion
function toRegistroSesion(prismaData: any): RegistroSesion {
  return {
    id: prismaData.id,
    registro_usuario_id: prismaData.registro_usuario_id,
    fecha_inicio: prismaData.fecha_inicio,
    fecha_fin: prismaData.fecha_fin ?? undefined,
    duracion: prismaData.duracion ?? undefined,
    ip_address: prismaData.ip_address ?? undefined,
    user_agent: prismaData.user_agent ?? undefined,
    usuario: prismaData.usuario ?? undefined
  };
}

class RegistroSesionService {
  /**
   * Crea un nuevo registro de sesión
   * @param data Datos de la sesión
   * @returns RegistroSesion creado
   */
async createRegistroSesion(data: CreateRegistroSesionInput): Promise<RegistroSesion> {
  try {
    // Validación básica
    if (!data.registro_usuario_id && !data.usuario_id) {
      throw new Error("Se requiere registro_usuario_id o usuario_id");
    }

    let registroUsuarioId: number;

    // Caso 1: Si se proporciona registro_usuario_id directamente
    if (data.registro_usuario_id) {
      const registroExistente = await prisma.registroUsuario.findUnique({
        where: { id: data.registro_usuario_id },
      });

      if (!registroExistente) {
        throw new Error("El registro de usuario referenciado no existe");
      }
      registroUsuarioId = data.registro_usuario_id;
    } 
    // Caso 2: Buscar/crear registro basado en usuario_id
    else if (data.usuario_id) {
      // Buscar si ya existe un registro para este usuario
      const registroExistente = await prisma.registroUsuario.findFirst({
        where: { usuario_id: data.usuario_id },
      });

      if (registroExistente) {
        registroUsuarioId = registroExistente.id;
      } else {
        // Crear nuevo registro de usuario
        const usuario = await prisma.usuario.findUnique({
          where: { id: data.usuario_id },
          include: {
            tipo_usuario: true,
            psicologoPacientes: true
          }
        });

        if (!usuario) {
          throw new Error("El usuario referenciado no existe");
        }

        const nuevoRegistro = await prisma.registroUsuario.create({
          data: {
            usuario_id: usuario.id,
            sexo: usuario.sexo || "OTRO",
            fecha_nacimiento: usuario.fecha_nacimiento,
            tipo_usuario: usuario.tipo_usuario.nombre,
            psicologo_id: usuario.id_psicologo || null,
            total_tests: 0 // Valor por defecto
          }
        });

        registroUsuarioId = nuevoRegistro.id;
      }
    } else {
      throw new Error("No se pudo determinar el registro de usuario");
    }

    // Crear la sesión con el ID obtenido
    const registro = await prisma.registroSesion.create({
      data: {
        registro_usuario_id: registroUsuarioId,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        fecha_inicio: new Date()
      },
      include: {
        usuario: true
      }
    });

    return toRegistroSesion(registro);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al crear registro de sesión: ${message}`);
  }
}

  /**
   * Actualiza un registro de sesión (normalmente al cerrar sesión)
   * @param id ID de la sesión
   * @param data Datos a actualizar
   * @returns RegistroSesion actualizado
   */
  async updateRegistroSesion(
    id: number,
    data: UpdateRegistroSesionInput
  ): Promise<RegistroSesion> {
    try {
      // Si no se proporciona fecha_fin, usar la actual
      const fechaFin = data.fecha_fin || new Date();
      
      // Obtener la sesión para calcular la duración
      const sesion = await prisma.registroSesion.findUnique({
        where: { id }
      });

      if (!sesion) {
        throw new Error("Sesión no encontrada");
      }

      // Calcular duración en minutos
      const duracionMs = fechaFin.getTime() - sesion.fecha_inicio.getTime();
      const duracionMinutos = Math.floor(duracionMs / (1000 * 60));

      const registro = await prisma.registroSesion.update({
        where: { id },
        data: {
          fecha_fin: fechaFin,
          duracion: duracionMinutos,
          ...data
        },
        include: {
          usuario: true
        }
      });

      return toRegistroSesion(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de sesión: ${message}`);
    }
  }

  /**
   * Cierra todas las sesiones activas de un usuario
   * @param usuarioId ID dele usuario
   * @returns Número de sesiones cerradas
   */
async cerrarSesionesActivas(usuarioId: number): Promise<number> {
    try {
      const registro_usuario = await prisma.registroUsuario.findMany({
        where: {
          usuario_id: usuarioId,
        }
      });
      
      // 1. Buscar sesiones activas
      const sesionesActivas = await prisma.registroSesion.findMany({
        where: {
          registro_usuario_id: { in: registro_usuario.map(r => r.id) },
          fecha_fin: null
        }
      });
      if (sesionesActivas.length === 0) {
        return 0; // No hay sesiones activas para cerrar
      }

      // 2. Preparar fecha actual para el cierre
      const ahora = new Date();

      // 3. Actualizar cada sesión con fecha_fin y duración calculada
      const resultados = await Promise.all(
        sesionesActivas.map(sesion => {
          // Calcular duración en minutos
          const fechaInicio = new Date(sesion.fecha_inicio);
          const duracionMs = ahora.getTime() - fechaInicio.getTime();
          const duracionMinutos = Math.floor(duracionMs / (1000 * 60));

          return prisma.registroSesion.update({
            where: { id: sesion.id },
            data: {
              fecha_fin: ahora,
              duracion: duracionMinutos
            }
          });
        })
      );

      return resultados.length;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al cerrar sesiones activas: ${message}`);
    }
}

  /**
   * Obtiene las sesiones de un usuario
   * @param registroUsuarioId ID del registro de usuario
   * @param limit Límite de resultados
   * @returns Lista de sesiones ordenadas por fecha
   */
  async getSesionesByUsuario(
    registroUsuarioId: number,
    limit: number = 10
  ): Promise<RegistroSesion[]> {
    try {
      const sesiones = await prisma.registroSesion.findMany({
        where: { registro_usuario_id: registroUsuarioId },
        orderBy: { fecha_inicio: "desc" },
        take: limit,
        include: {
          usuario: true
        }
      });

      return sesiones.map(toRegistroSesion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener sesiones de usuario: ${message}`);
    }
  }

  /**
   * Obtiene la última sesión activa de un usuario
   * @param registroUsuarioId ID del registro de usuario
   * @returns Última RegistroSesion activa o null
   */
  async getUltimaSesionActiva(
    registroUsuarioId: number
  ): Promise<RegistroSesion | null> {
    try {
      const sesion = await prisma.registroSesion.findFirst({
        where: {
          registro_usuario_id: registroUsuarioId,
          fecha_fin: null
        },
        orderBy: { fecha_inicio: "desc" },
        include: {
          usuario: true
        }
      });

      return sesion ? toRegistroSesion(sesion) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener última sesión activa: ${message}`);
    }
  }

  /**
   * Obtiene estadísticas de sesiones para un usuario
   * @param registroUsuarioId ID del registro de usuario
   * @returns Estadísticas de sesiones
   */
  async getEstadisticasSesiones(
    registroUsuarioId: number
  ): Promise<{
    totalSesiones: number;
    tiempoPromedio: number;
  }> {
    try {
      const [sesiones] = await Promise.all([
        prisma.registroSesion.findMany({
          where: { registro_usuario_id: registroUsuarioId }
        }),

      ]);

      const totalSesiones = sesiones.length;
      const sesionesConDuracion = sesiones.filter(s => s.duracion !== null);
      const tiempoPromedio = sesionesConDuracion.length > 0 
        ? sesionesConDuracion.reduce((sum, s) => sum + (s.duracion || 0), 0) / sesionesConDuracion.length
        : 0;

      return {
        totalSesiones,
        tiempoPromedio: Math.round(tiempoPromedio),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener estadísticas de sesiones: ${message}`);
    }
  }
}

export default new RegistroSesionService();