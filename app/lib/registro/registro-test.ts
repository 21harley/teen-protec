import { PrismaClient } from "../../generated/prisma";
import {
  RegistroTest,
  EstadoTestRegistro,
  PesoPreguntaTipo 
} from "../../types/registros";

const prisma = new PrismaClient();

// Tipos para inputs y filtros
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
};

export type UpdateRegistroTestInput = Partial<CreateRegistroTestInput>;

export type OrderByTestOptions = {
  fecha_creacion?: "asc" | "desc";
  fecha_completado?: "asc" | "desc";
  valor_total?: "asc" | "desc";
  nota_psicologo?: "asc" | "desc";
};

export type FilterRegistroTestOptions = {
  test_id?: number;
  usuario_id?: number;
  psicologo_id?: number | null;
  estado?: EstadoTestRegistro;
  evaluado?: boolean;
  minValorTotal?: number;
  maxValorTotal?: number;
  minNotaPsicologo?: number;
  maxNotaPsicologo?: number;
  fechaCreacionDesde?: Date;
  fechaCreacionHasta?: Date;
  fechaCompletadoDesde?: Date;
  fechaCompletadoHasta?: Date;
  fechaEvaluacionDesde?: Date;
  fechaEvaluacionHasta?: Date;
  skip?: number;
  take?: number;
  orderBy?: OrderByTestOptions;
};

// Función para transformar los datos de Prisma al tipo RegistroTest
function toRegistroTest(prismaData: any): RegistroTest {
  return {
    id: prismaData.id,
    test_id: prismaData.test_id,
    usuario_id: prismaData.usuario_id,
    psicologo_id: prismaData.psicologo_id ?? null,
    fecha_creacion: prismaData.fecha_creacion,
    fecha_completado: prismaData.fecha_completado ?? null,
    estado: prismaData.estado,
    nombre_test: prismaData.nombre_test ?? null,
    valor_total: prismaData.valor_total ?? null,
    nota_psicologo: prismaData.nota_psicologo ?? null,
    evaluado: prismaData.evaluado ?? false,
    fecha_evaluacion: prismaData.fecha_evaluacion ?? null,
  };
}


class RegistroTestService {
  /**
   * Crea un nuevo registro de test
   * @param data Datos del registro de test
   * @returns RegistroTest creado
   */
  async createRegistroTest(data: CreateRegistroTestInput): Promise<RegistroTest> {
    try {
      // Validar que el test existe
      const testExists = await prisma.test.findUnique({
        where: { id: data.test_id },
      });

      if (!testExists) {
        throw new Error("El test referenciado no existe");
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

      const registro = await prisma.registroTest.create({
        data: {
          test_id: data.test_id,
          usuario_id: data.usuario_id ?? null,
          psicologo_id: data.psicologo_id ?? null,
          fecha_creacion: data.fecha_creacion,
          fecha_completado: data.fecha_completado ?? null,
          estado: data.estado,
          nombre_test: data.nombre_test ?? null,
          valor_total: data.valor_total ?? null,
          nota_psicologo: data.nota_psicologo ?? null,
          evaluado: data.evaluado ?? false,
          fecha_evaluacion: data.fecha_evaluacion ?? null,
        },
      });

      return toRegistroTest(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear registro de test: ${message}`);
    }
  }

  /**
   * Obtiene un registro de test por su ID
   * @param id ID del registro
   * @param includeRelations Incluir relaciones (opcional)
   * @returns RegistroTest encontrado o null
   */
  async getRegistroTestById(
    id: number,
    includeRelations: boolean = true
  ): Promise<RegistroTest | null> {
    try {
      const registro = await prisma.registroTest.findUnique({
        where: { id },
      });

      return registro ? toRegistroTest(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registro de test por ID: ${message}`);
    }
  }

  /**
   * Obtiene registros de test con filtros opcionales
   * @param options Opciones de filtrado
   * @returns Lista de RegistroTest que coinciden con los filtros
   */
  async getRegistrosTests(
    options?: FilterRegistroTestOptions
  ): Promise<RegistroTest[]> {
    try {
      const registros = await prisma.registroTest.findMany({
        where: this.buildWhereClause(options),
        orderBy: options?.orderBy || { fecha_creacion: "desc" },
        skip: options?.skip,
        take: options?.take,
        // include: {
        //   metricas: {
        //     orderBy: { fecha: "desc" },
        //     take: 5,
        //   },
        // },
      });

      return registros.map(toRegistroTest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener registros de test: ${message}`);
    }
  }

  /**
   * Actualiza un registro de test
   * @param id ID del registro a actualizar
   * @param data Datos a actualizar
   * @returns RegistroTest actualizado
   */
  async updateRegistroTest(
    id: number,
    data: UpdateRegistroTestInput
  ): Promise<RegistroTest> {
    try {
      // Validar que el registro existe
      const registroExists = await prisma.registroTest.findUnique({
        where: { id },
      });

      if (!registroExists) {
        throw new Error("Registro de test no encontrado");
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

      const registro = await prisma.registroTest.update({
        where: { id },
        data: {
          estado: data.estado,
          fecha_completado: data.fecha_completado === undefined ? undefined : data.fecha_completado,
          nombre_test: data.nombre_test === undefined ? undefined : data.nombre_test,
          valor_total: data.valor_total === undefined ? undefined : data.valor_total,
          nota_psicologo: data.nota_psicologo === undefined ? undefined : data.nota_psicologo,
          evaluado: data.evaluado === undefined ? undefined : data.evaluado,
          fecha_evaluacion: data.fecha_evaluacion === undefined ? undefined : data.fecha_evaluacion,
        },
      });

      return toRegistroTest(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al actualizar registro de test: ${message}`);
    }
  }

  /**
   * Elimina un registro de test y sus relaciones
   * @param id ID del registro a eliminar
   * @returns RegistroTest eliminado
   */
  async deleteRegistroTest(id: number): Promise<RegistroTest> {
    try {
      
      const registro = await prisma.registroTest.delete({
        where: { id },
      });

      return toRegistroTest(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al eliminar registro de test: ${message}`);
    }
  }


  /**
   * Obtiene los tests de un usuario
   * @param usuarioId ID del usuario
   * @param options Opciones de filtrado
   * @returns Lista de RegistroTest del usuario
   */
  async getTestsByUsuarioId(
    usuarioId: number,
    options?: Omit<FilterRegistroTestOptions, 'usuario_id'>
  ): Promise<RegistroTest[]> {
    try {
      const registros = await prisma.registroTest.findMany({
        where: this.buildWhereClause({ ...options, usuario_id: usuarioId }),
        orderBy: options?.orderBy || { fecha_creacion: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return registros.map(toRegistroTest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener tests de usuario: ${message}`);
    }
  }

  /**
   * Obtiene los tests evaluados por un psicólogo
   * @param psicologoId ID del psicólogo
   * @param options Opciones de filtrado
   * @returns Lista de RegistroTest evaluados por el psicólogo
   */
  async getTestsByPsicologoId(
    psicologoId: number,
    options?: Omit<FilterRegistroTestOptions, 'psicologo_id' | 'evaluado'>
  ): Promise<RegistroTest[]> {
    try {
      const registros = await prisma.registroTest.findMany({
        where: this.buildWhereClause({ ...options, psicologo_id: psicologoId, evaluado: true }),
        orderBy: options?.orderBy || { fecha_evaluacion: "desc" },
        skip: options?.skip,
        take: options?.take,
      });

      return registros.map(toRegistroTest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener tests evaluados por psicólogo: ${message}`);
    }
  }

  /**
   * Obtiene el último registro de un test específico para un usuario
   * @param testId ID del test
   * @param usuarioId ID del usuario
   * @returns Último RegistroTest o null
   */
  async getUltimoRegistroTest(
    testId: number,
    usuarioId: number
  ): Promise<RegistroTest | null> {
    try {
      const [registro] = await prisma.registroTest.findMany({
        where: { test_id: testId, usuario_id: usuarioId },
        orderBy: { fecha_creacion: "desc" },
        take: 1,
      });

      return registro ? toRegistroTest(registro) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener último registro de test: ${message}`);
    }
  }

  /**
   * Marca un test como evaluado
   * @param testId ID del registro de test
   * @param notaPsicologo Nota asignada por el psicólogo
   * @param psicologoId ID del psicólogo que evalúa
   * @returns RegistroTest actualizado
   */
  async marcarComoEvaluado(
    testId: number,
    notaPsicologo: number,
    psicologoId: number
  ): Promise<RegistroTest> {
    try {
      // Validar que el registro existe
      const registroExists = await prisma.registroTest.findUnique({
        where: { id: testId },
      });

      if (!registroExists) {
        throw new Error("Registro de test no encontrado");
      }

      // Validar psicólogo
      const psicologoExists = await prisma.usuario.findUnique({
        where: { id: psicologoId },
      });

      if (!psicologoExists) {
        throw new Error("El psicólogo referenciado no existe");
      }

      const registro = await prisma.registroTest.update({
        where: { id: testId },
        data: {
          estado: EstadoTestRegistro.EVALUADO,
          nota_psicologo: notaPsicologo,
          evaluado: true,
          fecha_evaluacion: new Date(),
          psicologo_id: psicologoId,
        },
      });

      return toRegistroTest(registro);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al marcar test como evaluado: ${message}`);
    }
  }

  /**
 * Obtiene el ID del registro de un test específico
 * @param testId ID del test original
 * @returns ID del registro o null si no existe
 */
async getRegistroIdByTestId(testId: number): Promise<number | null> {
  try {
    const registro = await prisma.registroTest.findFirst({
      where: { test_id: testId },
      select: { id: true }
    });

    return registro ? registro.id : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al obtener ID de registro por test ID: ${message}`);
  }
}

/**
 * Actualiza un registro de test basado en el ID del test original
 * @param testId ID del test original
 * @param data Datos a actualizar
 * @returns RegistroTest actualizado
 */
async updateRegistroByTestId(
  testId: number,
  data: UpdateRegistroTestInput
): Promise<RegistroTest> {
  try {
    // Primero encontrar el registro por test_id
    const registro = await prisma.registroTest.findFirst({
      where: { test_id: testId }
    });

    if (!registro) {
      throw new Error("No se encontró un registro para este test");
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

    // Actualizar el registro encontrado
    const registroActualizado = await prisma.registroTest.update({
      where: { id: registro.id },
      data: {
        estado: data.estado,
        fecha_completado: data.fecha_completado === undefined ? undefined : data.fecha_completado,
        nombre_test: data.nombre_test === undefined ? undefined : data.nombre_test,
        valor_total: data.valor_total === undefined ? undefined : data.valor_total,
        nota_psicologo: data.nota_psicologo === undefined ? undefined : data.nota_psicologo,
        evaluado: data.evaluado === undefined ? undefined : data.evaluado,
        fecha_evaluacion: data.fecha_evaluacion === undefined ? undefined : data.fecha_evaluacion,
      },
    });

    return toRegistroTest(registroActualizado);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al actualizar registro por test ID: ${message}`);
  }
}

/**
 * Actualiza un registro de test basado en el ID del test original, o lo crea si no existe
 * @param testId ID del test original
 * @param data Datos para actualizar o crear el registro
 * @returns RegistroTest actualizado o creado
 */
async upsertRegistroByTestId(
  testId: number,
  data: CreateRegistroTestInput
): Promise<RegistroTest> {
  try {
    // Primero intentar encontrar el registro por test_id
    const registroExistente = await prisma.registroTest.findFirst({
      where: { test_id: testId }
    });

    if (registroExistente) {
      // Si existe, actualizarlo
      const registroActualizado = await prisma.registroTest.update({
        where: { id: registroExistente.id },
        data: {
          estado: data.estado,
          fecha_completado: data.fecha_completado ?? registroExistente.fecha_completado,
          nombre_test: data.nombre_test ?? registroExistente.nombre_test,
          valor_total: data.valor_total ?? registroExistente.valor_total,
          nota_psicologo: data.nota_psicologo ?? registroExistente.nota_psicologo,
          evaluado: data.evaluado ?? registroExistente.evaluado,
          fecha_evaluacion: data.fecha_evaluacion ?? registroExistente.fecha_evaluacion,
        },
      });
      return toRegistroTest(registroActualizado);
    } else {
      // Si no existe, crearlo
      // Validar que el test existe
      const testExists = await prisma.test.findUnique({
        where: { id: testId },
      });

      if (!testExists) {
        throw new Error("El test referenciado no existe");
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

      // Crear nuevo registro
      const nuevoRegistro = await prisma.registroTest.create({
        data: {
          test_id: testId,
          usuario_id: data.usuario_id ?? null,
          psicologo_id: data.psicologo_id ?? null,
          fecha_creacion: data.fecha_creacion ?? new Date(),
          fecha_completado: data.fecha_completado ?? null,
          estado: data.estado,
          nombre_test: data.nombre_test ?? null,
          valor_total: data.valor_total ?? null,
          nota_psicologo: data.nota_psicologo ?? null,
          evaluado: data.evaluado ?? false,
          fecha_evaluacion: data.fecha_evaluacion ?? null,
        },
      });
      return toRegistroTest(nuevoRegistro);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error en upsertRegistroByTestId: ${message}`);
  }
}


  private buildWhereClause(options?: FilterRegistroTestOptions): any {
    const where: any = {};

    if (options?.test_id) where.test_id = options.test_id;
    if (options?.usuario_id) where.usuario_id = options.usuario_id;
    if (options?.psicologo_id !== undefined) {
      where.psicologo_id = options.psicologo_id;
    }
    if (options?.estado) where.estado = options.estado;
    if (options?.evaluado !== undefined) where.evaluado = options.evaluado;
    
    // Filtros de rango
    if (options?.minValorTotal || options?.maxValorTotal) {
      where.valor_total = {};
      if (options.minValorTotal) where.valor_total.gte = options.minValorTotal;
      if (options.maxValorTotal) where.valor_total.lte = options.maxValorTotal;
    }
    
    if (options?.minNotaPsicologo || options?.maxNotaPsicologo) {
      where.nota_psicologo = {};
      if (options.minNotaPsicologo) where.nota_psicologo.gte = options.minNotaPsicologo;
      if (options.maxNotaPsicologo) where.nota_psicologo.lte = options.maxNotaPsicologo;
    }
    
    // Filtros de fecha
    if (options?.fechaCreacionDesde || options?.fechaCreacionHasta) {
      where.fecha_creacion = {};
      if (options.fechaCreacionDesde) where.fecha_creacion.gte = options.fechaCreacionDesde;
      if (options.fechaCreacionHasta) where.fecha_creacion.lte = options.fechaCreacionHasta;
    }
    
    if (options?.fechaCompletadoDesde || options?.fechaCompletadoHasta) {
      where.fecha_completado = {};
      if (options.fechaCompletadoDesde) where.fecha_completado.gte = options.fechaCompletadoDesde;
      if (options.fechaCompletadoHasta) where.fecha_completado.lte = options.fechaCompletadoHasta;
    }
    
    if (options?.fechaEvaluacionDesde || options?.fechaEvaluacionHasta) {
      where.fecha_evaluacion = {};
      if (options.fechaEvaluacionDesde) where.fecha_evaluacion.gte = options.fechaEvaluacionDesde;
      if (options.fechaEvaluacionHasta) where.fecha_evaluacion.lte = options.fechaEvaluacionHasta;
    }

    return where;
  }

}

export default new RegistroTestService();