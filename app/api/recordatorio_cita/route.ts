import { NextResponse } from 'next/server';
import { PrismaClient } from "../../generated/prisma";

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface RecordatorioData {
  id_cita: number;
  metodo: string;
  fecha_envio: Date;
  estado: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const citaId = searchParams.get('citaId');
    
    if (id) {
      // Obtener un recordatorio específico por ID
      const recordatorio = await prisma.recordatorioCita.findUnique({
        where: { id: parseInt(id) },
        include: {
          cita: {
            include: {
              psicologo: true,
              paciente: true
            }
          }
        }
      });

      if (!recordatorio) {
        return NextResponse.json(
          { error: 'Recordatorio no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(recordatorio);
    } else if (citaId) {
      // Obtener todos los recordatorios de una cita
      const recordatorios = await prisma.recordatorioCita.findMany({
        where: { id_cita: parseInt(citaId) },
        orderBy: {
          fecha_envio: 'asc'
        },
        include: {
          cita: true
        }
      });

      return NextResponse.json(recordatorios);
    } else {
      return NextResponse.json(
        { error: 'Se requiere ID o citaId para buscar recordatorios' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error obteniendo recordatorios:', error);
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
    const { id_cita, metodo, fecha_envio, estado }: RecordatorioData = await request.json();

    // Validación básica
    if (!id_cita) {
      return NextResponse.json(
        { error: 'ID de cita es requerido' },
        { status: 400 }
      );
    }

    if (!metodo || !['EMAIL', 'SMS', 'NOTIFICACION'].includes(metodo)) {
      return NextResponse.json(
        { error: 'Método inválido. Debe ser EMAIL, SMS o NOTIFICACION' },
        { status: 400 }
      );
    }

    if (!fecha_envio) {
      return NextResponse.json(
        { error: 'Fecha de envío es requerida' },
        { status: 400 }
      );
    }

    if (!estado || !['PENDIENTE', 'ENVIADO', 'FALLIDO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser PENDIENTE, ENVIADO o FALLIDO' },
        { status: 400 }
      );
    }

    // Verificar que la cita existe
    const cita = await prisma.cita.findUnique({
      where: { id: id_cita }
    });

    if (!cita) {
      return NextResponse.json(
        { error: 'La cita especificada no existe' },
        { status: 404 }
      );
    }

    // Crear nuevo recordatorio
    const nuevoRecordatorio = await prisma.recordatorioCita.create({
      data: {
        id_cita,
        metodo,
        fecha_envio: new Date(fecha_envio),
        estado
      },
      include: {
        cita: {
          include: {
            psicologo: true,
            paciente: true
          }
        }
      }
    });

    return NextResponse.json(nuevoRecordatorio, { status: 201 });

  } catch (error: any) {
    console.error('Error creando recordatorio:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al crear el recordatorio' },
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
    const { 
      id,
      id_cita,
      metodo,
      fecha_envio,
      estado
    }: RecordatorioData & { id: number } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de recordatorio es requerido' },
        { status: 400 }
      );
    }

    if (metodo && !['EMAIL', 'SMS', 'NOTIFICACION'].includes(metodo)) {
      return NextResponse.json(
        { error: 'Método inválido. Debe ser EMAIL, SMS o NOTIFICACION' },
        { status: 400 }
      );
    }

    if (estado && !['PENDIENTE', 'ENVIADO', 'FALLIDO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser PENDIENTE, ENVIADO o FALLIDO' },
        { status: 400 }
      );
    }

    // Verificar que el recordatorio existe
    const recordatorioExistente = await prisma.recordatorioCita.findUnique({
      where: { id }
    });

    if (!recordatorioExistente) {
      return NextResponse.json(
        { error: 'Recordatorio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la cita existe si se está actualizando
    if (id_cita && id_cita !== recordatorioExistente.id_cita) {
      const cita = await prisma.cita.findUnique({
        where: { id: id_cita }
      });

      if (!cita) {
        return NextResponse.json(
          { error: 'La cita especificada no existe' },
          { status: 404 }
        );
      }
    }

    // Actualizar el recordatorio
    const recordatorioActualizado = await prisma.recordatorioCita.update({
      where: { id },
      data: {
        id_cita,
        metodo,
        fecha_envio: fecha_envio ? new Date(fecha_envio) : undefined,
        estado
      },
      include: {
        cita: {
          include: {
            psicologo: true,
            paciente: true
          }
        }
      }
    });

    return NextResponse.json(recordatorioActualizado);

  } catch (error: any) {
    console.error('Error actualizando recordatorio:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al actualizar el recordatorio' },
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
        { error: 'ID de recordatorio es requerido' },
        { status: 400 }
      );
    }

    const recordatorioId = parseInt(id);

    // Verificar si el recordatorio existe
    const recordatorioExistente = await prisma.recordatorioCita.findUnique({
      where: { id: recordatorioId }
    });

    if (!recordatorioExistente) {
      return NextResponse.json(
        { error: 'Recordatorio no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el recordatorio
    await prisma.recordatorioCita.delete({
      where: { id: recordatorioId }
    });

    return NextResponse.json(
      { message: 'Recordatorio eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando recordatorio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}