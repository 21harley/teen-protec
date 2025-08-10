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

// Tipos para inputs y filtros
export type CreateRegistroUsuarioInput = {
  usuario_id: number;
  sexo: string;
  fecha_nacimiento?: Date | null;
  tipo_usuario: string;
  psicologo_id?: number | null;
  tests_ids?: number[];
  total_tests?: number;
};

export type UpdateRegistroUsuarioInput = Partial<CreateRegistroUsuarioInput> & {
  tests_ids?: number[];
};

export type OrderByOptions = {
  fecha_registro?: "asc" | "desc";
  edad?: "asc" | "desc";
  total_tests?: "asc" | "desc";
};

export type FilterRegistroUsuarioOptions = {
  usuario_id?: number;
  psicologo_id?: number | null;
  tipo_usuario?: string;
  sexo?: Sexo;
  minEdad?: number;
  maxEdad?: number;
  minTests?: number;
  maxTests?: number;
  minAvgNotas?: number;
  maxAvgNotas?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  skip?: number;
  take?: number;
  orderBy?: OrderByOptions;
};

// Función para transformar los datos de Prisma al tipo RegistroUsuario
function toRegistroUsuario(prismaData: any): RegistroUsuario {
  return {
    id: prismaData.id,
    usuario_id: prismaData.usuario_id,
    fecha_registro: prismaData.fecha_registro,
    sexo: prismaData.sexo ?? Sexo.OTRO,
    fecha_nacimiento: prismaData.fecha_nacimiento ?? null,
    tipo_usuario: prismaData.tipo_usuario,
    psicologo_id: prismaData.psicologo_id ?? null,
    tests_ids: prismaData.tests_ids ?? [],
    total_tests: prismaData.total_tests ?? 0,
    trazabilidades: prismaData.trazabilidades?.map((t: any) => toRegistroTrazabilidad(t)) ?? [],
    metricas: prismaData.metricas?.map((m: any) => toRegistroMetricaUsuario(m)) ?? [],
    sesiones: prismaData.sesiones?.map((s: any) => toRegistroSesion(s)) ?? []
  };
}

function toRegistroTrazabilidad(prismaData: any): RegistroTrazabilidad {
  return {
    id: prismaData.id,
    registro_usuario_id: prismaData.registro_usuario_id,
    psicologo_id: prismaData.psicologo_id,
    fecha_inicio: prismaData.fecha_inicio,
    fecha_fin: prismaData.fecha_fin ?? null,
    secuencia: prismaData.secuencia
  };
}

function toRegistroMetricaUsuario(prismaData: any): RegistroMetricaUsuario {
  return {
    id: prismaData.id,
    registro_usuario_id: prismaData.registro_usuario_id,
    fecha: prismaData.fecha,
    tests_asignados: prismaData.tests_asignados,
    tests_completados: prismaData.tests_completados,
    tests_evaluados: prismaData.tests_evaluados,
    sesiones_totales: prismaData.sesiones_totales
  };
}

function toRegistroSesion(prismaData: any): RegistroSesion {
  return {
    id: prismaData.id,
    registro_usuario_id: prismaData.registro_usuario_id,
    fecha_inicio: prismaData.fecha_inicio,
    fecha_fin: prismaData.fecha_fin ?? undefined,
    duracion: prismaData.duracion ?? undefined,
    ip_address: prismaData.ip_address ?? undefined,
    user_agent: prismaData.user_agent ?? undefined,
    usuario: prismaData.usuario ? toRegistroUsuario(prismaData.usuario) : undefined
  };
}

class RegistroUsuarioService {
  /**
   * Crea un nuevo registro de usuario
   * @param data Datos del registro de usuario
   * @returns RegistroUsuario creado
   */
  async createRegistroUsuario(data: CreateRegistroUsuarioInput): Promise<RegistroUsuario> {
    try {
      // Validar que el usuario existe
      const usuarioExists = await prisma.usuario.findUnique({
        where: { id: data.usuario_id },
      });

      if (!usuarioExists) {
        throw new Error("El usuario referenciado no existe");
      }

      // Validar psicólogo si se proporciona
      if (data.psicologo_id) {
        const psicologoExists = await prisma.usuario.findUnique({
          where: { id: data.psicologo_id },
        });

        if (!psicologoExists) {
          throw new Error("El psicólogo referenciado no existe");
        }
      }

      const registro = await prisma.registroUsuario.create({
        data: {
          usuario_id: data.usuario_id,
          sexo: data.sexo,
          fecha_nacimiento: data.fecha_nacimiento ?? null,
          tipo_usuario: data.tipo_usuario,
          psicologo_id: data.psicologo_id ?? null,
          tests_ids: data.tests_ids ?? [],
          total_tests: data.total_tests ?? 0,
        },
      });

      return toRegistroUsuario(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear registro de usuario: ${message}`);
    }
  }

  /**
   * Obtiene un registro de usuario por su ID
   * @param id ID del registro
   * @param includeRelations Incluir relaciones (opcional)
   * @returns RegistroUsuario encontrado o null
   */
  async getRegistroUsuarioById(
    id: number,
    includeRelations: boolean = true
  ): Promise<RegistroUsuario | null> {
    try {
      const registro = await prisma.registroUsuario.findUnique({
        where: { id },
        include: includeRelations ? {
          trazabilidades: true,
          metricas: true,
          sesiones: true,
        } : undefined,
      });

      return registro ? toRegistroUsuario(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registro de usuario por ID: ${message}`);
    }
  }

  /**
   * Obtiene registros de usuario con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de RegistroUsuario que coinciden con los filtros
   */
  async getRegistrosUsuarios(
    options?: FilterRegistroUsuarioOptions
  ): Promise<RegistroUsuario[]> {
    try {
      const registros = await prisma.registroUsuario.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha_registro: "desc" },
        skip: options?.skip,
        take: options?.take,
        include: {
          trazabilidades: true,
          metricas: {
            orderBy: { fecha: "desc" },
            take: 5,
          },
          sesiones: {
            orderBy: { fecha_inicio: "desc" },
            take: 10,
          },
        },
      });

      return registros.map(toRegistroUsuario);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registros de usuario: ${message}`);
    }
  }

  /**
   * Actualiza un registro de usuario
   * @param id ID del registro a actualizar
   * @param data Datos a actualizar
   * @returns RegistroUsuario actualizado
   */
  async updateRegistroUsuario(
    id: number,
    data: UpdateRegistroUsuarioInput
  ): Promise<RegistroUsuario> {
    try {
      // Validar que el registro existe
      const registroExists = await prisma.registroUsuario.findUnique({
        where: { id },
      });

      if (!registroExists) {
        throw new Error("Registro de usuario no encontrado");
      }

      // Validar psicólogo si se proporciona
      if (data.psicologo_id !== undefined && data.psicologo_id !== null) {
        const psicologoExists = await prisma.usuario.findUnique({
          where: { id: data.psicologo_id },
        });

        if (!psicologoExists) {
          throw new Error("El psicólogo referenciado no existe");
        }
      }

      const registro = await prisma.registroUsuario.update({
        where: { id },
        data: {
          sexo: data.sexo,
          fecha_nacimiento: data.fecha_nacimiento === undefined ? undefined : data.fecha_nacimiento,
          tipo_usuario: data.tipo_usuario,
          psicologo_id: data.psicologo_id === undefined ? undefined : data.psicologo_id,
          tests_ids: data.tests_ids,
          total_tests: data.total_tests,
        },
      });

      return toRegistroUsuario(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de usuario: ${message}`);
    }
  }

  /**
   * Elimina un registro de usuario y sus relaciones
   * @param id ID del registro a eliminar
   * @returns RegistroUsuario eliminado
   */
  async deleteRegistroUsuario(id: number): Promise<RegistroUsuario> {
    try {
      // Eliminar relaciones primero
      await this.deleteRelatedRecords(id);
      
      const registro = await prisma.registroUsuario.delete({
        where: { id },
      });

      return toRegistroUsuario(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar registro de usuario: ${message}`);
    }
  }

  /**
   * Obtiene las métricas históricas de un usuario
   * @param usuarioId ID del usuario
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de métricas ordenadas por fecha
   */
  async getMetricasUsuario(
    usuarioId: number,
    limit: number = 10
  ): Promise<RegistroMetricaUsuario[]> {
    try {
      const registros = await prisma.registroUsuario.findMany({
        where: { usuario_id: usuarioId },
        select: {
          metricas: {
            orderBy: { fecha: "desc" },
            take: limit,
          },
        },
      });

      return registros.flatMap(r => r.metricas.map(toRegistroMetricaUsuario));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener métricas de usuario: ${message}`);
    }
  }

  /**
   * Obtiene el historial de sesiones de un usuario
   * @param usuarioId ID del usuario
   * @param limit Límite de resultados (default: 10)
   * @returns Lista de sesiones ordenadas por fecha
   */
  async getSesionesUsuario(
    usuarioId: number,
    limit: number = 10
  ): Promise<RegistroSesion[]> {
    try {
      const registros = await prisma.registroSesion.findMany({
        where: { registro_usuario_id: usuarioId },
        orderBy: { fecha_inicio: "desc" },
        take: limit,
      });

      return registros.map(toRegistroSesion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener sesiones de usuario: ${message}`);
    }
  }

  /**
   * Obtiene el historial de trazabilidad de un usuario
   * @param usuarioId ID del usuario
   * @returns Lista de trazabilidades ordenadas por secuencia
   */
  async getTrazabilidadUsuario(usuarioId: number): Promise<RegistroTrazabilidad[]> {
    try {
      const registros = await prisma.registroUsuario.findMany({
        where: { usuario_id: usuarioId },
        select: {
          trazabilidades: {
            orderBy: { secuencia: "asc" },
          },
        },
      });

      return registros.flatMap(r => r.trazabilidades.map(toRegistroTrazabilidad));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener trazabilidad de usuario: ${message}`);
    }
  }

  /**
   * Obtiene el último registro de un usuario
   * @param usuarioId ID del usuario
   * @returns Último RegistroUsuario o null
   */
  async getUltimoRegistroUsuario(
    usuarioId: number
  ): Promise<RegistroUsuario | null> {
    try {
      const [registro] = await prisma.registroUsuario.findMany({
        where: { usuario_id: usuarioId },
        orderBy: { fecha_registro: "desc" },
        take: 1,
      });

      return registro ? toRegistroUsuario(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener último registro de usuario: ${message}`);
    }
  }

  /**
   * Crea un snapshot del estado actual de un usuario
   * @param usuarioId ID del usuario
   * @returns Nuevo RegistroUsuario creado
   */
  async createSnapshotUsuario(usuarioId: number): Promise<RegistroUsuario> {
    try {
      // Obtener datos del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          tipo_usuario: true,
          psicologoPacientes: true,
          tests: true,
        },
      });

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      // Calcular datos para el snapshot
      const snapshotData = await this.prepareSnapshotData(usuario);

      return this.createRegistroUsuario(snapshotData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear snapshot de usuario: ${message}`);
    }
  }

  /**
 * Obtiene el ID del registro asociado a un usuario
 * @param usuarioId ID del usuario
 * @returns ID del registro o null si no existe
 */
async getRegistroIdByUsuarioId(usuarioId: number): Promise<number | null> {
  try {
    const registro = await prisma.registroUsuario.findFirst({
      where: { usuario_id: usuarioId },
      select: { id: true },
      orderBy: { fecha_registro: 'desc' }
    });

    return registro?.id ?? null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al obtener ID de registro por usuario: ${message}`);
  }
}

/**
 * Actualiza o crea un registro basado en el ID de usuario
 * @param usuarioId ID del usuario
 * @param data Datos para actualizar/crear
 * @returns RegistroUsuario actualizado o creado
 */
async upsertRegistroByUsuarioId(
  usuarioId: number,
  data: UpdateRegistroUsuarioInput
): Promise<RegistroUsuario> {
  try {
    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        tipo_usuario: true,
        psicologoPacientes: true,
        tests: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Buscar el último registro del usuario
    const ultimoRegistro = await this.getUltimoRegistroUsuario(usuarioId);

    if (ultimoRegistro) {
      // Actualizar registro existente
      return this.updateRegistroUsuario(ultimoRegistro.id, {
        ...data,
        usuario_id: usuarioId, // Asegurar que el usuario_id no cambie
      });
    } else {
      // Crear nuevo registro
      const snapshotData = await this.prepareSnapshotData(usuario);
      return this.createRegistroUsuario({
        ...snapshotData,
        ...data,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error en upsert de registro por usuario: ${message}`);
  }
}

/**
 * Agrega un test a la lista de tests_ids del registro de un usuario
 * @param usuarioId ID del usuario
 * @param testId ID del test a agregar
 * @returns RegistroUsuario actualizado
 */
async agregarTestARegistroUsuario(
  usuarioId: number,
  testId: number
): Promise<RegistroUsuario> {
  try {
    // Verificar que el test existe
    const testExists = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!testExists) {
      throw new Error('El test referenciado no existe');
    }

    // Obtener o crear el registro del usuario
    const registro = await this.upsertRegistroByUsuarioId(usuarioId, {});

    // Verificar si el test ya está en la lista
    const currentTests = registro.tests_ids as number[] || [];
    if (currentTests.includes(testId)) {
      return registro; // No hacer nada si ya existe
    }

    // Actualizar el registro agregando el test
    const updatedRegistro = await prisma.registroUsuario.update({
      where: { id: registro.id },
      data: {
        tests_ids: [...currentTests, testId],
        total_tests: currentTests.length + 1,
      },
    });

    return toRegistroUsuario(updatedRegistro);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al agregar test a registro: ${message}`);
  }
}

/**
 * Remueve un test de la lista de tests_ids del registro de un usuario
 * @param usuarioId ID del usuario
 * @param testId ID del test a remover
 * @returns RegistroUsuario actualizado
 */
async removerTestDeRegistroUsuario(
  usuarioId: number,
  testId: number
): Promise<RegistroUsuario> {
  try {
    // Obtener el registro del usuario
    const registro = await this.getUltimoRegistroUsuario(usuarioId);

    if (!registro) {
      throw new Error('No se encontró registro para este usuario');
    }

    // Verificar si el test está en la lista
    const currentTests = registro.tests_ids as number[] || [];
    if (!currentTests.includes(testId)) {
      return registro; // No hacer nada si no existe
    }

    // Actualizar el registro removiendo el test
    const updatedTests = currentTests.filter(id => id !== testId);
    const updatedRegistro = await prisma.registroUsuario.update({
      where: { id: registro.id },
      data: {
        tests_ids: updatedTests,
        total_tests: updatedTests.length,
      },
    });

    return toRegistroUsuario(updatedRegistro);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al remover test de registro: ${message}`);
  }
}

/**
 * Gestiona el cambio de psicólogo registrando solo en trazabilidad
 * @param usuarioId ID del usuario paciente
 * @param nuevoPsicologoId ID del nuevo psicólogo (null para desasignar)
 * @returns RegistroTrazabilidad creado o null si no hubo cambio
 */
async cambiarPsicologo(
  usuarioId: number,
  nuevoPsicologoId: number | null,
): Promise<RegistroTrazabilidad | null> {
  // Validar que el usuario paciente existe
  const paciente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { tipo_usuario: true }
  });
  
  if (!paciente) {
    throw new Error('El usuario paciente no existe');
  }

  // 1. Validar psicólogo si se está asignando uno nuevo
  let psicologoValido = null;
  if (nuevoPsicologoId !== null) {
    // Buscar primero en la tabla principal Usuario
    psicologoValido = await prisma.usuario.findUnique({
      where: { 
        id: nuevoPsicologoId,
        tipo_usuario: { nombre: 'PSICOLOGO' }
      },
      include: { 
        psicologo: true,
        tipo_usuario: true 
      }
    });
    
    if (psicologoValido?.id_psicologo) {
      throw new Error('El ID no corresponde a un psicólogo válido');
    }
  }

  // Usar transacción para asegurar atomicidad
  return await prisma.$transaction(async (tx) => {
    // 2. Obtener o crear RegistroUsuario para el paciente
    let registroUsuario = await tx.registroUsuario.findFirst({
      where: { usuario_id: usuarioId }
    });

    if (!registroUsuario) {
      registroUsuario = await tx.registroUsuario.create({
        data: {
          usuario_id: usuarioId,
          sexo: paciente.sexo || 'OTRO',
          fecha_nacimiento: paciente.fecha_nacimiento,
          tipo_usuario: paciente.tipo_usuario.nombre,
          psicologo_id: nuevoPsicologoId
        }
      });
    }

    // 3. Si hay nuevo psicólogo, verificar/crear su RegistroUsuario
    if (psicologoValido) {
      const registroPsicologo = await tx.registroUsuario.findFirst({
        where: nuevoPsicologoId !== null ? { usuario_id: nuevoPsicologoId } : undefined
      });

      if (!registroPsicologo) {
        await tx.registroUsuario.create({
          data: {
            usuario_id: psicologoValido.id,
            sexo: psicologoValido.sexo || 'OTRO',
            fecha_nacimiento: psicologoValido.fecha_nacimiento,
            tipo_usuario: psicologoValido.tipo_usuario.nombre,
            psicologo_id: null
          }
        });
      }
    }

    // 4. Obtener el registro de trazabilidad activo actual (si existe)
    const trazabilidadActual = await tx.registroTrazabilidad.findFirst({
      where: {
        registro_usuario_id: registroUsuario.id,
        fecha_fin: null
      },
      orderBy: { secuencia: 'desc' }
    });

    // 5. Si no hay cambio (mismo psicólogo o ambos son null), retornar null
    const mismoPsicologo = trazabilidadActual?.psicologo_id === nuevoPsicologoId;
    const ambosNull = trazabilidadActual?.psicologo_id === null && nuevoPsicologoId === null;
    
    if (mismoPsicologo || ambosNull) {
      return null;
    }

    // 6. Cerrar trazabilidad actual si existe
    if (trazabilidadActual) {
      await tx.registroTrazabilidad.update({
        where: { id: trazabilidadActual.id },
        data: { fecha_fin: new Date() }
      });
    }

    // 7. Actualizar RegistroUsuario con el nuevo psicólogo (puede ser null)
    await tx.registroUsuario.update({
      where: { id: registroUsuario.id },
      data: { psicologo_id: nuevoPsicologoId }
    });

    // 8. Crear nueva trazabilidad solo si se asigna un psicólogo (no null)
    if (nuevoPsicologoId !== null) {
      const ultimaTrazabilidad = await tx.registroTrazabilidad.findFirst({
        where: { registro_usuario_id: registroUsuario.id },
        orderBy: { secuencia: 'desc' },
        take: 1
      });
      
      const secuencia = (ultimaTrazabilidad?.secuencia || 0) + 1;
      
      const nuevaTrazabilidad = await tx.registroTrazabilidad.create({
        data: {
          registro_usuario_id: registroUsuario.id,
          psicologo_id: nuevoPsicologoId,
          fecha_inicio: new Date(),
          secuencia: secuencia
        }
      });

      return toRegistroTrazabilidad(nuevaTrazabilidad);
    }

    return null;
  });
}
  // Métodos auxiliares privados
  private async deleteRelatedRecords(registroId: number): Promise<void> {
    await Promise.all([
      prisma.registroTrazabilidad.deleteMany({
        where: { registro_usuario_id: registroId },
      }),
      prisma.registroMetricaUsuario.deleteMany({
        where: { registro_usuario_id: registroId },
      }),
      prisma.registroSesion.deleteMany({
        where: { registro_usuario_id: registroId },
      }),
    ]);
  }

  private buildWhereClause(options?: FilterRegistroUsuarioOptions): any {
    const where: any = {};

    if (options?.usuario_id) where.usuario_id = options.usuario_id;
    if (options?.psicologo_id !== undefined) {
      where.psicologo_id = options.psicologo_id;
    }
    if (options?.tipo_usuario) where.tipo_usuario = { contains: options.tipo_usuario };
    if (options?.sexo) where.sexo = options.sexo;
    
    // Filtros de rango
    if (options?.minEdad || options?.maxEdad) {
      where.edag = {};
      if (options.maxEdad) where.edad.lte = options.maxEdad;
    }
    
    if (options?.minTests || options?.maxTests) {
      where.total_tests = {};
      if (options.minTests) where.total_tests.gte = options.minTests;
      if (options.maxTests) where.total_tests.lte = options.maxTests;
    }
    
    if (options?.fechaDesde || options?.fechaHasta) {
      where.fecha_registro = {};
      if (options.fechaDesde) where.fecha_registro.gte = options.fechaDesde;
      if (options.fechaHasta) where.fecha_registro.lte = options.fechaHasta;
    }

    return where;
  }

  private async prepareSnapshotData(usuario: any): Promise<CreateRegistroUsuarioInput> {
    const edad = this.calculateAge(usuario.fecha_nacimiento);
    const tests = usuario.tests || [];

    return {
      usuario_id: usuario.id,
      sexo: usuario.sexo || Sexo.OTRO,
      fecha_nacimiento: usuario.fecha_nacimiento,
      tipo_usuario: usuario.tipo_usuario.nombre,
      psicologo_id: usuario.id_psicologo || null,
      tests_ids: tests.map((t: any) => t.id),
      total_tests: tests.length,
    };
  }

  private calculateAge(fechaNacimiento?: Date): number | null {
    if (!fechaNacimiento) return null;
    
    const diff = Date.now() - fechaNacimiento.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  private calculateAverageNotes(tests: any[]): number | null {
    const testsEvaluados = tests.filter((t) => t.evaluado);
    if (testsEvaluados.length === 0) return null;

    const sumaNotas = testsEvaluados.reduce(
      (sum, test) => sum + (test.ponderacion_final || 0),
      0
    );
    return sumaNotas / testsEvaluados.length;
  }
}

export default new RegistroUsuarioService();