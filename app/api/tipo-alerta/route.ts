import { NextResponse } from 'next/server';
import { PrismaClient } from "../../generated/prisma";

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface TipoAlertaData {
  nombre: string;
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
      // Obtener un tipo de alerta específico por ID (sin paginación)
      const tipoAlerta = await prisma.tipoAlerta.findUnique({
        where: { id: parseInt(id) },
        include: {
          alarmas: {
            include: {
              usuario: true
            }
          }
        }
      });

      if (!tipoAlerta) {
        return NextResponse.json(
          { error: 'Tipo de alerta no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(tipoAlerta);
    } else if (nombre) {
      // Obtener tipo de alerta por nombre (sin paginación)
      const tipoAlerta = await prisma.tipoAlerta.findUnique({
        where: { nombre },
        include: {
          alarmas: {
            include: {
              usuario: true
            }
          }
        }
      });

      if (!tipoAlerta) {
        return NextResponse.json(
          { error: 'Tipo de alerta no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(tipoAlerta);
    } else {
      // Obtener tipos de alerta paginados según filtros
      let whereClause: any = {};
      
      if (nombre) {
        whereClause.nombre = { contains: nombre, mode: 'insensitive' };
      }

      // Obtener el total de tipos de alerta que coinciden con los filtros
      const total = await prisma.tipoAlerta.count({
        where: whereClause
      });

      // Calcular el total de páginas
      const totalPages = Math.ceil(total / pageSize);

      // Obtener los tipos de alerta paginados
      const tiposAlerta = await prisma.tipoAlerta.findMany({
        where: whereClause,
        include: {
          alarmas: {
            include: {
              usuario: true
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
        data: tiposAlerta,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(paginatedResponse);
    }
  } catch (error: any) {
    console.error('Error obteniendo tipos de alerta:', error);
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
    const { nombre }: TipoAlertaData = await request.json();

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de alerta es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de alerta ya existe
    const tipoExistente = await prisma.tipoAlerta.findUnique({
      where: { nombre }
    });

    if (tipoExistente) {
      return NextResponse.json(
        { error: 'Este tipo de alerta ya existe' },
        { status: 409 }
      );
    }

    // Crear nuevo tipo de alerta
    const nuevoTipoAlerta = await prisma.tipoAlerta.create({
      data: {
        nombre
      }
    });

    return NextResponse.json(nuevoTipoAlerta, { status: 201 });

  } catch (error: any) {
    console.error('Error creando tipo de alerta:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este tipo de alerta ya existe' },
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
    const { id, nombre }: TipoAlertaData & { id: number } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de tipo de alerta es requerido' },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de alerta es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de alerta existe
    const tipoExistente = await prisma.tipoAlerta.findUnique({
      where: { id }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de alerta no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el nuevo nombre ya está en uso
    if (nombre !== tipoExistente.nombre) {
      const nombreExistente = await prisma.tipoAlerta.findFirst({
        where: { 
          nombre,
          NOT: { id }
        }
      });

      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Este nombre de tipo de alerta ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Actualizar tipo de alerta
    const tipoActualizado = await prisma.tipoAlerta.update({
      where: { id },
      data: {
        nombre
      },
      include: {
        alarmas: {
          include: {
            usuario: true
          }
        }
      }
    });

    return NextResponse.json(tipoActualizado);

  } catch (error: any) {
    console.error('Error actualizando tipo de alerta:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este nombre de tipo de alerta ya está en uso' },
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
        { error: 'ID de tipo de alerta es requerido' },
        { status: 400 }
      );
    }

    const tipoAlertaId = parseInt(id);

    // Verificar si el tipo de alerta existe
    const tipoExistente = await prisma.tipoAlerta.findUnique({
      where: { id: tipoAlertaId },
      include: {
        alarmas: true
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de alerta no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay alarmas asociadas
    if (tipoExistente.alarmas && tipoExistente.alarmas.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar este tipo de alerta porque tiene alarmas asociadas',
          alarmasAsociadas: tipoExistente.alarmas.length
        },
        { status: 400 }
      );
    }

    // Eliminar el tipo de alerta
    await prisma.tipoAlerta.delete({
      where: { id: tipoAlertaId }
    });

    return NextResponse.json(
      { message: 'Tipo de alerta eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando tipo de alerta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}