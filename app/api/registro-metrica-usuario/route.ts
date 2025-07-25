import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

interface RegistroMetricaUsuarioData {
  registro_usuario_id: number;
  tests_asignados: number;
  tests_completados: number;
  tests_evaluados: number;       
  avg_notas?: number | null; 
  sesiones_totales: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const registroUsuarioId = searchParams.get('registroUsuarioId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const metrica = await prisma.registroMetricaUsuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: true
        }
      });

      if (!metrica) {
        return NextResponse.json(
          { error: 'Métrica no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: [metrica],
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1
      });
    }

    let whereClause: any = {};

    if (registroUsuarioId) whereClause.registro_usuario_id = parseInt(registroUsuarioId);

    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) whereClause.fecha.lte = new Date(fechaHasta);
    }

    const total = await prisma.registroMetricaUsuario.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const metricas = await prisma.registroMetricaUsuario.findMany({
      where: whereClause,
      include: {
        usuario: true
      },
      orderBy: {
        fecha: 'desc'
      },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      data: metricas,
      total,
      page,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    console.error('Error fetching métricas de usuario:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener las métricas de usuario',
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
    const metricaData: RegistroMetricaUsuarioData = await request.json();

    // Validación de campos requeridos
    if (!metricaData.registro_usuario_id || 
        metricaData.tests_asignados === undefined || 
        metricaData.tests_completados === undefined || 
        metricaData.tests_evaluados === undefined || 
        metricaData.sesiones_totales === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el registro de usuario existe
    const registroUsuario = await prisma.registroUsuario.findUnique({
      where: { id: metricaData.registro_usuario_id }
    });

    if (!registroUsuario) {
      return NextResponse.json(
        { error: 'Registro de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Crear la nueva métrica con los campos actualizados
    const nuevaMetrica = await prisma.registroMetricaUsuario.create({
      data: {
        registro_usuario_id: metricaData.registro_usuario_id,
        fecha: new Date(),
        tests_asignados: metricaData.tests_asignados,
        tests_completados: metricaData.tests_completados,
        tests_evaluados: metricaData.tests_evaluados,
        avg_notas: metricaData.avg_notas || null,
        sesiones_totales: metricaData.sesiones_totales
      },
      include: {
        usuario: true
      }
    });

    return NextResponse.json(nuevaMetrica, { status: 201 });

  } catch (error: any) {
    console.error('Error creating métrica de usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear la métrica de usuario',
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
    const { id, ...restoDatos }: { id: number } & Partial<RegistroMetricaUsuarioData> = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de métrica es requerido' }, { status: 400 });
    }

    const metricaExistente = await prisma.registroMetricaUsuario.findUnique({ where: { id } });

    if (!metricaExistente) {
      return NextResponse.json({ error: 'Métrica no encontrada' }, { status: 404 });
    }

    // Validar que los datos a actualizar sean válidos
    if (restoDatos.registro_usuario_id) {
      const registroUsuario = await prisma.registroUsuario.findUnique({
        where: { id: restoDatos.registro_usuario_id }
      });
      if (!registroUsuario) {
        return NextResponse.json(
          { error: 'Registro de usuario no encontrado' },
          { status: 404 }
        );
      }
    }

    const metricaActualizada = await prisma.registroMetricaUsuario.update({
      where: { id },
      data: restoDatos,
      include: {
        usuario: true
      }
    });

    return NextResponse.json(metricaActualizada);

  } catch (error: any) {
    console.error('Error updating métrica de usuario:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Error de validación en los datos' }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error al actualizar la métrica de usuario',
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
        { error: 'ID de métrica es requerido' },
        { status: 400 }
      );
    }

    const metricaId = parseInt(id);

    const metricaExistente = await prisma.registroMetricaUsuario.findUnique({
      where: { id: metricaId }
    });

    if (!metricaExistente) {
      return NextResponse.json(
        { error: 'Métrica no encontrada' },
        { status: 404 }
      );
    }

    await prisma.registroMetricaUsuario.delete({
      where: { id: metricaId }
    });

    return NextResponse.json(
      { message: 'Métrica eliminada correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting métrica de usuario:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar la métrica de usuario',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}