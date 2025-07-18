import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

interface RegistroReporteData {
  tipo: "general" | "psicologo" | "paciente"; // Más específico según el modelo
  parametros: object; // Más específico que 'any'
  generado_por_id?: number;
  formato: string;
  ruta_almacenamiento?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo') as "general" | "psicologo" | "paciente" | null;
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
        { tipo: { contains: search, mode: 'insensitive' } },
        { formato: { contains: search, mode: 'insensitive' } },
        { ruta_almacenamiento: { contains: search, mode: 'insensitive' } }
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

    // Validación más estricta según el modelo
    if (!reporteData.tipo || !reporteData.formato || !reporteData.parametros) {
      return NextResponse.json(
        { error: 'tipo, formato y parametros son campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el tipo sea uno de los valores permitidos
    const tiposPermitidos = ["general", "psicologo", "paciente"];
    if (!tiposPermitidos.includes(reporteData.tipo)) {
      return NextResponse.json(
        { error: 'Tipo de reporte no válido. Debe ser: general, psicologo o paciente' },
        { status: 400 }
      );
    }

    // Verificar usuario si se proporciona generado_por_id
    if (reporteData.generado_por_id) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: reporteData.generado_por_id }
      });
      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario generador no encontrado' },
          { status: 404 }
        );
      }
    }

    const nuevoReporte = await prisma.registroReporte.create({
      data: {
        tipo: reporteData.tipo,
        parametros: reporteData.parametros,
        generado_por_id: reporteData.generado_por_id || null,
        formato: reporteData.formato,
        ruta_almacenamiento: reporteData.ruta_almacenamiento || null,
        fecha_generacion: new Date() // Asegurar que tenga fecha actual
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

    // Validar tipo si se está actualizando
    if (restoDatos.tipo) {
      const tiposPermitidos = ["general", "psicologo", "paciente"];
      if (!tiposPermitidos.includes(restoDatos.tipo)) {
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        );
      }
    }

    // Verificar usuario si se actualiza generado_por_id
    if (restoDatos.generado_por_id) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: restoDatos.generado_por_id }
      });
      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario generador no encontrado' },
          { status: 404 }
        );
      }
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