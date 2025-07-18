import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

enum EstadoTestRegistro {
  NO_INICIADO = "NO_INICIADO",
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO", // Corregido el typo (antes "COMPLETAD")
  CANCELADO = "CANCELADO",
  EVALUADO = "EVALUADO"
}

enum PesoPreguntaTipo {
  SIN_VALOR = 'SIN_VALOR',
  IGUAL_VALOR = 'IGUAL_VALOR',
  BAREMO = 'BAREMO'
}

interface RegistroTestData {
  test_id: number;
  usuario_id: number;
  psicologo_id?: number | null;
  fecha_creacion?: Date | string;
  fecha_completado?: Date | string | null;
  estado: EstadoTestRegistro;
  nombre_test?: string | null;
  valor_total?: number | null;
  nota_psicologo?: number | null;
  evaluado?: boolean;
  fecha_evaluacion?: Date | string | null;
  ponderacion_usada?: PesoPreguntaTipo | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const testId = searchParams.get('testId');
    const usuarioId = searchParams.get('usuarioId');
    const psicologoId = searchParams.get('psicologoId');
    const estado = searchParams.get('estado') as EstadoTestRegistro | null;
    const evaluado = searchParams.get('evaluado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const registro = await prisma.registroTest.findUnique({
        where: { id: parseInt(id) },
        include: {
          metricas: {
            orderBy: { fecha: 'desc' }
          }
        }
      });

      if (!registro) {
        return NextResponse.json(
          { error: 'Registro de test no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: [registro],
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1
      });
    }

    let whereClause: any = {};

    if (testId) whereClause.test_id = parseInt(testId);
    if (usuarioId) whereClause.usuario_id = parseInt(usuarioId);
    if (psicologoId) whereClause.psicologo_id = parseInt(psicologoId);
    if (estado) whereClause.estado = estado;
    if (evaluado) whereClause.evaluado = evaluado === 'true';

    if (fechaDesde || fechaHasta) {
      whereClause.OR = [
        { fecha_creacion: {} },
        { fecha_completado: {} },
        { fecha_evaluacion: {} }
      ];
      
      if (fechaDesde) {
        whereClause.OR[0].fecha_creacion.gte = new Date(fechaDesde);
        whereClause.OR[1].fecha_completado.gte = new Date(fechaDesde);
        whereClause.OR[2].fecha_evaluacion.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereClause.OR[0].fecha_creacion.lte = new Date(fechaHasta);
        whereClause.OR[1].fecha_completado.lte = new Date(fechaHasta);
        whereClause.OR[2].fecha_evaluacion.lte = new Date(fechaHasta);
      }
    }

    if (search) {
      whereClause.OR = [
        { nombre_test: { contains: search, mode: 'insensitive' } },
        { estado: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.registroTest.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const registros = await prisma.registroTest.findMany({
      where: whereClause,
      include: {
        metricas: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      data: registros,
      total,
      page,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    console.error('Error fetching registros de tests:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener los registros de tests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const registroData: RegistroTestData = await request.json();

    // Validación de campos requeridos
    if (!registroData.test_id || !registroData.usuario_id || !registroData.estado) {
      return NextResponse.json(
        { error: 'test_id, usuario_id y estado son campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el test existe
    const testExistente = await prisma.test.findUnique({
      where: { id: registroData.test_id }
    });
    if (!testExistente) {
      return NextResponse.json(
        { error: 'Test no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: registroData.usuario_id }
    });
    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar psicologo si se proporciona
    if (registroData.psicologo_id) {
      const psicologoExistente = await prisma.psicologo.findUnique({
        where: { id_usuario: registroData.psicologo_id }
      });
      if (!psicologoExistente) {
        return NextResponse.json(
          { error: 'Psicólogo no encontrado' },
          { status: 404 }
        );
      }
    }

    // Preparar datos para creación
    const datosCreacion = {
      test_id: registroData.test_id,
      usuario_id: registroData.usuario_id,
      psicologo_id: registroData.psicologo_id || null,
      fecha_creacion: registroData.fecha_creacion ? new Date(registroData.fecha_creacion) : new Date(),
      fecha_completado: registroData.fecha_completado ? new Date(registroData.fecha_completado) : null,
      estado: registroData.estado,
      nombre_test: registroData.nombre_test || testExistente.nombre || null,
      valor_total: registroData.valor_total || null,
      nota_psicologo: registroData.nota_psicologo || null,
      evaluado: registroData.evaluado || false,
      fecha_evaluacion: registroData.fecha_evaluacion ? new Date(registroData.fecha_evaluacion) : null,
      ponderacion_usada: registroData.ponderacion_usada || testExistente.peso_preguntas || null
    };

    const nuevoRegistro = await prisma.registroTest.create({
      data: datosCreacion,
      include: {
        metricas: true
      }
    });

    return NextResponse.json(nuevoRegistro, { status: 201 });

  } catch (error: any) {
    console.error('Error creating registro de test:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear el registro de test',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...restoDatos }: { id: number } & Partial<RegistroTestData> = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de registro es requerido' }, { status: 400 });
    }

    const registroExistente = await prisma.registroTest.findUnique({ 
      where: { id },
      include: { metricas: true }
    });

    if (!registroExistente) {
      return NextResponse.json({ error: 'Registro de test no encontrado' }, { status: 404 });
    }

    // Preparar los datos de actualización según lo que espera Prisma
    const updateData: any = {};

    // Mapear los campos según sea necesario
    if (restoDatos.estado !== undefined) {
      if (!Object.values(EstadoTestRegistro).includes(restoDatos.estado)) {
        return NextResponse.json(
          { error: 'Estado de test no válido' },
          { status: 400 }
        );
      }
      updateData.estado = restoDatos.estado;
    }

    if (restoDatos.nota_psicologo !== undefined) {
      updateData.nota_psicologo = restoDatos.nota_psicologo;
    }

    if (restoDatos.evaluado !== undefined) {
      updateData.evaluado = restoDatos.evaluado;
      if (restoDatos.evaluado === true && !registroExistente.fecha_evaluacion) {
        updateData.fecha_evaluacion = new Date();
      }
    }

    if (restoDatos.ponderacion_usada !== undefined) {
      // Manejo especial para el enum
      updateData.ponderacion_usada = restoDatos.ponderacion_usada === null ? 
        null : 
        { set: restoDatos.ponderacion_usada };
    }

    // Manejo de fechas
    if (restoDatos.fecha_creacion !== undefined) {
      updateData.fecha_creacion = new Date(restoDatos.fecha_creacion);
    }

    if (restoDatos.fecha_completado !== undefined) {
      updateData.fecha_completado = restoDatos.fecha_completado === null ? 
        null : 
        new Date(restoDatos.fecha_completado);
    }

    if (restoDatos.fecha_evaluacion !== undefined) {
      updateData.fecha_evaluacion = restoDatos.fecha_evaluacion === null ? 
        null : 
        new Date(restoDatos.fecha_evaluacion);
    }

    // Si se está actualizando el estado a COMPLETADO, establecer la fecha de completado
    if (restoDatos.estado === EstadoTestRegistro.COMPLETADO && !registroExistente.fecha_completado) {
      updateData.fecha_completado = new Date();
    }

    const registroActualizado = await prisma.registroTest.update({
      where: { id },
      data: updateData,
      include: {
        metricas: true
      }
    });

    return NextResponse.json(registroActualizado);

  } catch (error: any) {
    console.error('Error updating registro de test:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Error de validación en los datos' }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error al actualizar el registro de test',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de registro es requerido' },
        { status: 400 }
      );
    }

    const registroId = parseInt(id);

    const registroExistente = await prisma.registroTest.findUnique({
      where: { id: registroId },
      include: {
        metricas: true
      }
    });

    if (!registroExistente) {
      return NextResponse.json(
        { error: 'Registro de test no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar en cascada las métricas
    await prisma.$transaction([
      prisma.registroMetricaTest.deleteMany({
        where: { registro_test_id: registroId }
      }),
      prisma.registroTest.delete({
        where: { id: registroId }
      })
    ]);

    return NextResponse.json(
      { 
        message: 'Registro de test y métricas relacionadas eliminados correctamente',
        deletedRecord: registroExistente
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting registro de test:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar el registro de test',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}