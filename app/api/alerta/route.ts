import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";
import { emitNotification } from '@/app/lib/utils';

const prisma = new PrismaClient();

interface AlarmaData {
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  vista?: boolean;
  correo_enviado?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const usuarioId = searchParams.get('usuarioId');
    const tipoAlertaId = searchParams.get('tipoAlertaId');
    const noVistas = searchParams.get('noVistas') === 'true';
    const correoNoEnviado = searchParams.get('correoNoEnviado') === 'true';
    const search = searchParams.get('search');
    const countOnly = searchParams.get('countOnly') === 'true'; // Nueva opción

    // Si solo se solicita el contador
    if (countOnly && usuarioId) {
      const count = await prisma.alarma.count({
        where: {
          id_usuario: parseInt(usuarioId),
          vista: false
        }
      });
      return NextResponse.json({ count });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const alarma = await prisma.alarma.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: {
            include: { tipo_usuario: true }
          },
          tipo_alerta: true
        }
      });

      if (!alarma) {
        return NextResponse.json(
          { error: 'Alarma no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: [alarma],
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1
      });
    }

    let whereClause: any = {};

    if (usuarioId) whereClause.id_usuario = parseInt(usuarioId);
    if (tipoAlertaId) whereClause.id_tipo_alerta = parseInt(tipoAlertaId);
    if (noVistas) whereClause.vista = false;
    if (correoNoEnviado) whereClause.correo_enviado = false;

    if (search) {
      const [usuariosConNombre, tiposConNombre] = await Promise.all([
        prisma.usuario.findMany({
          where: { 
            OR: [
              { nombre: { contains: search} },
              { email: { contains: search } }
            ]
          },
          select: { id: true }
        }),
        prisma.tipoAlerta.findMany({
          where: { nombre: { contains: search} },
          select: { id: true }
        })
      ]);

      const orConditions: any[] = [];
      orConditions.push({ mensaje: { contains: search } });

      if (usuariosConNombre.length > 0) {
        orConditions.push({ id_usuario: { in: usuariosConNombre.map(u => u.id) } });
      }

      if (tiposConNombre.length > 0) {
        orConditions.push({ id_tipo_alerta: { in: tiposConNombre.map(t => t.id) } });
      }

      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      } else {
        whereClause.OR = [{ id: -1 }];
      }
    }

    const total = await prisma.alarma.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const alarmas = await prisma.alarma.findMany({
      where: whereClause,
      include: {
        usuario: {
          include: {
            tipo_usuario: true
          }
        },
        tipo_alerta: true
      },
      orderBy: {
        fecha_creacion: 'desc'
      },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      data: alarmas,
      total,
      page,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    console.error('Error fetching alarmas:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener las alarmas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Función auxiliar para obtener el contador de no leídas
async function getUnreadCount(usuarioId: number): Promise<number> {
  return await prisma.alarma.count({
    where: {
      id_usuario: usuarioId,
      vista: false
    }
  });
}

export async function POST(request: Request) {
  try {
    const alarmaData: AlarmaData = await request.json();

    if (!alarmaData.mensaje) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

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

    if (alarmaData.id_tipo_alerta) {
      const tipoAlertaExistente = await prisma.tipoAlerta.findUnique({
        where: { id: alarmaData.id_tipo_alerta }
      });

      if (!tipoAlertaExistente) {
        return NextResponse.json(
          { error: 'Tipo de alerta no encontrado' },
          { status: 404 }
        );
      }
    }

    const nuevaAlarma = await prisma.alarma.create({
      data: {
        id_usuario: alarmaData.id_usuario || null,
        id_tipo_alerta: alarmaData.id_tipo_alerta || null,
        mensaje: alarmaData.mensaje,
        vista: alarmaData.vista || false,
        correo_enviado: alarmaData.correo_enviado || false
      },
      include: {
        usuario: {
          include: {
            tipo_usuario: true
          }
        },
        tipo_alerta: true
      }
    });

    // Si la alarma está asociada a un usuario, emitir notificación
    if (alarmaData.id_usuario) {
      const unreadCount = await getUnreadCount(alarmaData.id_usuario);
      emitNotification(alarmaData.id_usuario.toString(), unreadCount);
    }

    return NextResponse.json(nuevaAlarma, { status: 201 });

  } catch (error: any) {
    console.error('Error creating alarma:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear la alarma',
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
    const { id, id_usuario, id_tipo_alerta, ...restoDatos }: { id: number } & Partial<AlarmaData> = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de alarma es requerido' }, { status: 400 });
    }

    const alarmaExistente = await prisma.alarma.findUnique({ where: { id } });

    if (!alarmaExistente) {
      return NextResponse.json({ error: 'Alarma no encontrada' }, { status: 404 });
    }

    const data: any = { 
      ...restoDatos,
      correo_enviado: restoDatos.correo_enviado !== undefined ? restoDatos.correo_enviado : undefined
    };

    if (id_usuario) {
      const usuarioExistente = await prisma.usuario.findUnique({ where: { id: id_usuario } });
      if (!usuarioExistente) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      data.usuario = { connect: { id: id_usuario } };
    }

    if (id_tipo_alerta) {
      const tipoAlertaExistente = await prisma.tipoAlerta.findUnique({ where: { id: id_tipo_alerta } });
      if (!tipoAlertaExistente) {
        return NextResponse.json({ error: 'Tipo de alerta no encontrado' }, { status: 404 });
      }
      data.tipo_alerta = { connect: { id: id_tipo_alerta } };
    }

    const alarmaActualizada = await prisma.alarma.update({
      where: { id },
      data,
      include: {
        usuario: {
          include: {
            tipo_usuario: true
          }
        },
        tipo_alerta: true
      }
    });

    // Si se marcó como leída o se cambió el usuario, emitir actualización
    if (restoDatos.vista !== undefined || id_usuario) {
      const userId = id_usuario || alarmaExistente.id_usuario;
      if (userId) {
        const unreadCount = await getUnreadCount(userId);
        emitNotification(userId.toString(), unreadCount);
      }
    }

    return NextResponse.json(alarmaActualizada);

  } catch (error: any) {
    console.error('Error updating alarma:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Error de validación en los datos' }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error al actualizar la alarma',
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
        { error: 'ID de alarma es requerido' },
        { status: 400 }
      );
    }

    const alarmaId = parseInt(id);

    const alarmaExistente = await prisma.alarma.findUnique({
      where: { id: alarmaId }
    });

    if (!alarmaExistente) {
      return NextResponse.json(
        { error: 'Alarma no encontrada' },
        { status: 404 }
      );
    }

    await prisma.alarma.delete({
      where: { id: alarmaId }
    });

    return NextResponse.json(
      { message: 'Alarma eliminada correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting alarma:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar la alarma',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}