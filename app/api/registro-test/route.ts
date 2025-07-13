import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

interface RegistroTestData {
  test_id: number;
  usuario_id: number;
  psicologo_id?: number;
  fecha_creacion?: Date;
  fecha_completado?: Date;
  estado: EstadoTestRegistro;
  nombre_test?: string;
  valor_total?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const testId = searchParams.get('testId');
    const usuarioId = searchParams.get('usuarioId');
    const psicologoId = searchParams.get('psicologoId');
    const estado = searchParams.get('estado');
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
          metricas: true
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

    if (fechaDesde || fechaHasta) {
      whereClause.fecha_creacion = {};
      if (fechaDesde) whereClause.fecha_creacion.gte = new Date(fechaDesde);
      if (fechaHasta) whereClause.fecha_creacion.lte = new Date(fechaHasta);
    }

    if (search) {
      whereClause.OR = [
        { nombre_test: { contains: search } },
        { estado: { contains: search } }
      ];
    }

    const total = await prisma.registroTest.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const registros = await prisma.registroTest.findMany({
      where: whereClause,
      include: {
        metricas: {
          orderBy: {
            fecha: 'desc'
          },
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

    if (!registroData.test_id || !registroData.usuario_id || !registroData.estado) {
      return NextResponse.json(
        { error: 'test_id, usuario_id y estado son requeridos' },
        { status: 400 }
      );
    }

    const nuevoRegistro = await prisma.registroTest.create({
      data: {
        test_id: registroData.test_id,
        usuario_id: registroData.usuario_id,
        psicologo_id: registroData.psicologo_id || null,
        fecha_creacion: registroData.fecha_creacion || new Date(),
        fecha_completado: registroData.fecha_completado || null,
        estado: registroData.estado,
        nombre_test: registroData.nombre_test || null,
        valor_total: registroData.valor_total || null
      },
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

    const registroExistente = await prisma.registroTest.findUnique({ where: { id } });

    if (!registroExistente) {
      return NextResponse.json({ error: 'Registro de test no encontrado' }, { status: 404 });
    }

    // Si se está actualizando el estado a COMPLETADO, establecer la fecha de completado
    if (restoDatos.estado === 'COMPLETADO' && !registroExistente.fecha_completado) {
      restoDatos.fecha_completado = new Date();
    }

    const registroActualizado = await prisma.registroTest.update({
      where: { id },
      data: restoDatos,
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
      { message: 'Registro de test y métricas relacionadas eliminados correctamente' },
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