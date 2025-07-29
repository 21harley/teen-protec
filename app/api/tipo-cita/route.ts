import { NextResponse } from 'next/server';
import { PrismaClient } from "../../generated/prisma";

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface TipoCitaData {
  nombre: string;
  descripcion?: string;
  duracion?: number;
  color_calendario?: string;
}

// Tipos para la paginación
interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const nombre = searchParams.get('nombre');
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    if (id) {
      // Obtener un tipo de cita específico por ID (sin paginación)
      const tipoCita = await prisma.tipoCita.findUnique({
        where: { id: parseInt(id) },
        include: {
          citas: {
            include: {
              psicologo: true,
              paciente: true
            }
          }
        }
      });

      if (!tipoCita) {
        return NextResponse.json(
          { error: 'Tipo de cita no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(tipoCita);
    } else if (nombre) {
      // Obtener tipo de cita por nombre (sin paginación)
      const tipoCita = await prisma.tipoCita.findUnique({
        where: { nombre },
        include: {
          citas: {
            include: {
              psicologo: true,
              paciente: true
            }
          }
        }
      });

      if (!tipoCita) {
        return NextResponse.json(
          { error: 'Tipo de cita no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(tipoCita);
    } else {
      // Obtener tipos de cita paginados según filtros
      let whereClause: any = {};
      
      if (nombre) {
        whereClause.nombre = { contains: nombre, mode: 'insensitive' };
      }

      // Obtener el total de tipos de cita que coinciden con los filtros
      const total = await prisma.tipoCita.count({
        where: whereClause
      });

      // Calcular el total de páginas
      const totalPages = Math.ceil(total / pageSize);

      // Obtener los tipos de cita paginados
      const tiposCita = await prisma.tipoCita.findMany({
        where: whereClause,
        include: {
          citas: {
            include: {
              psicologo: true,
              paciente: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      // Construir respuesta paginada
      const paginatedResponse: PaginatedResponse = {
        data: tiposCita,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(paginatedResponse);
    }
  } catch (error: any) {
    console.error('Error obteniendo tipos de cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, descripcion, duracion, color_calendario }: TipoCitaData = await request.json();

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de cita es requerido' },
        { status: 400 }
      );
    }

    // Validar duración si se proporciona
    if (duracion && (duracion <= 0 || duracion > 1440)) {
      return NextResponse.json(
        { error: 'La duración debe ser entre 1 y 1440 minutos (24 horas)' },
        { status: 400 }
      );
    }

    // Validar formato de color si se proporciona
    if (color_calendario && !/^#[0-9A-F]{6}$/i.test(color_calendario)) {
      return NextResponse.json(
        { error: 'El color debe estar en formato hexadecimal (ej. #FF5733)' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de cita ya existe
    const tipoExistente = await prisma.tipoCita.findUnique({
      where: { nombre }
    });

    if (tipoExistente) {
      return NextResponse.json(
        { error: 'Este tipo de cita ya existe' },
        { status: 409 }
      );
    }

    // Crear nuevo tipo de cita
    const nuevoTipoCita = await prisma.tipoCita.create({
      data: {
        nombre,
        descripcion,
        duracion: duracion || 30, // Valor por defecto 30 minutos
        color_calendario: color_calendario || '#3b82f6' // Azul por defecto
      }
    });

    return NextResponse.json(nuevoTipoCita, { status: 201 });

  } catch (error: any) {
    console.error('Error creando tipo de cita:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este tipo de cita ya existe' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nombre, descripcion, duracion, color_calendario }: TipoCitaData & { id: number } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de tipo de cita es requerido' },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de cita es requerido' },
        { status: 400 }
      );
    }

    // Validar duración si se proporciona
    if (duracion && (duracion <= 0 || duracion > 1440)) {
      return NextResponse.json(
        { error: 'La duración debe ser entre 1 y 1440 minutos (24 horas)' },
        { status: 400 }
      );
    }

    // Validar formato de color si se proporciona
    if (color_calendario && !/^#[0-9A-F]{6}$/i.test(color_calendario)) {
      return NextResponse.json(
        { error: 'El color debe estar en formato hexadecimal (ej. #FF5733)' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de cita existe
    const tipoExistente = await prisma.tipoCita.findUnique({
      where: { id }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de cita no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el nuevo nombre ya está en uso
    if (nombre !== tipoExistente.nombre) {
      const nombreExistente = await prisma.tipoCita.findFirst({
        where: { 
          nombre,
          NOT: { id }
        }
      });

      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Este nombre de tipo de cita ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Actualizar tipo de cita
    const tipoActualizado = await prisma.tipoCita.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        duracion,
        color_calendario
      },
      include: {
        citas: {
          include: {
            psicologo: true,
            paciente: true
          }
        }
      }
    });

    return NextResponse.json(tipoActualizado);

  } catch (error: any) {
    console.error('Error actualizando tipo de cita:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este nombre de tipo de cita ya está en uso' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
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
        { error: 'ID de tipo de cita es requerido' },
        { status: 400 }
      );
    }

    const tipoCitaId = parseInt(id);

    // Verificar si el tipo de cita existe
    const tipoExistente = await prisma.tipoCita.findUnique({
      where: { id: tipoCitaId },
      include: {
        citas: true
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de cita no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay citas asociadas
    if (tipoExistente.citas && tipoExistente.citas.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar este tipo de cita porque tiene citas asociadas',
          citasAsociadas: tipoExistente.citas.length
        },
        { status: 400 }
      );
    }

    // Eliminar el tipo de cita
    await prisma.tipoCita.delete({
      where: { id: tipoCitaId }
    });

    return NextResponse.json(
      { message: 'Tipo de cita eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando tipo de cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}