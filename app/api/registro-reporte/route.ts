import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

interface RegistroReporteData {
  tipo: string;
  parametros: any;
  generado_por_id?: number;
  formato: string;
  ruta_almacenamiento?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo');
    const generadoPorId = searchParams.get('generadoPorId');
    const formato = searchParams.get('formato');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const reporte = await prisma.registroReporte.findUnique({
        where: { id: parseInt(id) }
      });

      if (!reporte) {
        return NextResponse.json(
          { error: 'Reporte no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: [reporte],
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1
      });
    }

    let whereClause: any = {};

    if (tipo) whereClause.tipo = tipo;
    if (generadoPorId) whereClause.generado_por_id = parseInt(generadoPorId);
    if (formato) whereClause.formato = formato;

    if (fechaDesde || fechaHasta) {
      whereClause.fecha_generacion = {};
      if (fechaDesde) whereClause.fecha_generacion.gte = new Date(fechaDesde);
      if (fechaHasta) whereClause.fecha_generacion.lte = new Date(fechaHasta);
    }

    if (search) {
      whereClause.OR = [
        { tipo: { contains: search } },
        { formato: { contains: search } },
        { ruta_almacenamiento: { contains: search } }
      ];
    }

    const total = await prisma.registroReporte.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const reportes = await prisma.registroReporte.findMany({
      where: whereClause,
      orderBy: {
        fecha_generacion: 'desc'
      },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      data: reportes,
      total,
      page,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    console.error('Error fetching reportes:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener los reportes',
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
    const reporteData: RegistroReporteData = await request.json();

    if (!reporteData.tipo || !reporteData.parametros || !reporteData.formato) {
      return NextResponse.json(
        { error: 'tipo, parametros y formato son requeridos' },
        { status: 400 }
      );
    }

    const nuevoReporte = await prisma.registroReporte.create({
      data: {
        tipo: reporteData.tipo,
        parametros: reporteData.parametros,
        generado_por_id: reporteData.generado_por_id || null,
        formato: reporteData.formato,
        ruta_almacenamiento: reporteData.ruta_almacenamiento || null
      }
    });

    return NextResponse.json(nuevoReporte, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reporte:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear el reporte',
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
    const { id, ...restoDatos }: { id: number } & Partial<RegistroReporteData> = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de reporte es requerido' }, { status: 400 });
    }

    const reporteExistente = await prisma.registroReporte.findUnique({ where: { id } });

    if (!reporteExistente) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    const reporteActualizado = await prisma.registroReporte.update({
      where: { id },
      data: restoDatos
    });

    return NextResponse.json(reporteActualizado);

  } catch (error: any) {
    console.error('Error updating reporte:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Error de validación en los datos' }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error al actualizar el reporte',
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
        { error: 'ID de reporte es requerido' },
        { status: 400 }
      );
    }

    const reporteId = parseInt(id);

    const reporteExistente = await prisma.registroReporte.findUnique({
      where: { id: reporteId }
    });

    if (!reporteExistente) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    await prisma.registroReporte.delete({
      where: { id: reporteId }
    });

    return NextResponse.json(
      { message: 'Reporte eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting reporte:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar el reporte',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}