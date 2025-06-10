import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";

const prisma = new PrismaClient();

interface AlarmaData {
  tipo: string;
  id_usuario?: number;
  mensaje: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const usuarioId = searchParams.get('usuarioId');
    
    if (id) {
      // Obtener una alarma específica
      const alarma = await prisma.alarma.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: {
            include: {
              tipo_usuario: true
            }
          }
        }
      });

      if (!alarma) {
        return NextResponse.json(
          { error: 'Alarma no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(alarma);
    } else if (usuarioId) {
      // Obtener alarmas de un usuario específico
      const alarmas = await prisma.alarma.findMany({
        where: { id_usuario: parseInt(usuarioId) },
        include: {
          usuario: {
            include: {
              tipo_usuario: true
            }
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      return NextResponse.json(alarmas);
    } else {
      // Obtener todas las alarmas
      const alarmas = await prisma.alarma.findMany({
        include: {
          usuario: {
            include: {
              tipo_usuario: true
            }
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      return NextResponse.json(alarmas);
    }
  } catch (error: any) {
    console.error('Error obteniendo alarmas:', error);
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
    const alarmaData: AlarmaData = await request.json();

    // Validación básica
    if (!alarmaData.tipo || !alarmaData.mensaje) {
      return NextResponse.json(
        { error: 'Tipo y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe si se proporciona id_usuario
    if (alarmaData.id_usuario) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: alarmaData.id_usuario }
      });

      if (!usuarioExistente) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
    }

    // Crear nueva alarma
    const nuevaAlarma = await prisma.alarma.create({
      data: {
        tipo: alarmaData.tipo,
        id_usuario: alarmaData.id_usuario,
        mensaje: alarmaData.mensaje
      },
      include: {
        usuario: {
          include: {
            tipo_usuario: true
          }
        }
      }
    });

    return NextResponse.json(nuevaAlarma, { status: 201 });

  } catch (error: any) {
    console.error('Error creando alarma:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
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
    const { id, ...alarmaData }: { id: number } & Partial<AlarmaData> = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de alarma es requerido' },
        { status: 400 }
      );
    }

    // Verificar si la alarma existe
    const alarmaExistente = await prisma.alarma.findUnique({
      where: { id }
    });

    if (!alarmaExistente) {
      return NextResponse.json(
        { error: 'Alarma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el usuario existe si se proporciona id_usuario
    if (alarmaData.id_usuario) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: alarmaData.id_usuario }
      });

      if (!usuarioExistente) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
    }

    // Actualizar alarma
    const alarmaActualizada = await prisma.alarma.update({
      where: { id },
      data: alarmaData,
      include: {
        usuario: {
          include: {
            tipo_usuario: true
          }
        }
      }
    });

    return NextResponse.json(alarmaActualizada);

  } catch (error: any) {
    console.error('Error actualizando alarma:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
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
        { error: 'ID de alarma es requerido' },
        { status: 400 }
      );
    }

    const alarmaId = parseInt(id);

    // Verificar si la alarma existe
    const alarmaExistente = await prisma.alarma.findUnique({
      where: { id: alarmaId }
    });

    if (!alarmaExistente) {
      return NextResponse.json(
        { error: 'Alarma no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la alarma
    await prisma.alarma.delete({
      where: { id: alarmaId }
    });

    return NextResponse.json(
      { message: 'Alarma eliminada correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando alarma:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}