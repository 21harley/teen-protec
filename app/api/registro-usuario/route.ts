import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

enum Sexo {
  MASCULINO = "MASCULINO",
  FEMENINO = "FEMENINO",
  OTRO = "OTRO"
}

interface TestEvaluado {
  testId: number;
  nota: number;
  fecha: string; // ISO 8601 format
}

interface RegistroUsuarioData {
  usuario_id: number;
  sexo?: Sexo | null;
  edad?: number | null;
  tipo_usuario: string;
  psicologo_id?: number | null;
  tests_ids?: number[] | null;
  tests_evaluados?: TestEvaluado[] | null;
  total_tests?: number;
  avg_notas?: number | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const usuarioId = searchParams.get('usuarioId');
    const psicologoId = searchParams.get('psicologoId');
    const tipoUsuario = searchParams.get('tipoUsuario');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const registro = await prisma.registroUsuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          trazabilidades: true,
          metricas: {
            orderBy: { fecha: 'desc' },
            take: 5
          },
          sesiones: {
            orderBy: { fecha: 'desc' },
            take: 5
          }
        }
      });

      if (!registro) {
        return NextResponse.json(
          { error: 'Registro no encontrado' },
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

    if (usuarioId) whereClause.usuario_id = parseInt(usuarioId);
    if (psicologoId) whereClause.psicologo_id = parseInt(psicologoId);
    if (tipoUsuario) whereClause.tipo_usuario = tipoUsuario;

    if (fechaDesde || fechaHasta) {
      whereClause.fecha_registro = {};
      if (fechaDesde) whereClause.fecha_registro.gte = new Date(fechaDesde);
      if (fechaHasta) whereClause.fecha_registro.lte = new Date(fechaHasta);
    }

    if (search) {
      whereClause.OR = [
        { tipo_usuario: { contains: search, mode: 'insensitive' } },
        { sexo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.registroUsuario.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const registros = await prisma.registroUsuario.findMany({
      where: whereClause,
      include: {
        trazabilidades: true,
        metricas: {
          orderBy: { fecha: 'desc' },
          take: 5
        },
        sesiones: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      },
      orderBy: {
        fecha_registro: 'desc'
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
    console.error('Error fetching registros:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener los registros',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

interface TestEvaluado {
  testId: number;
  nota: number;
  fecha: string;
}

interface RegistroUsuarioData {
  usuario_id: number;
  sexo?: Sexo | null;
  edad?: number | null;
  tipo_usuario: string;
  psicologo_id?: number | null;
  tests_ids?: number[] | null;
  tests_evaluados?: TestEvaluado[] | null;
  total_tests?: number;
  avg_notas?: number | null;
}

export async function POST(request: Request) {
  try {
    const registroData: RegistroUsuarioData = await request.json();

    // Validación de campos requeridos
    if (!registroData.usuario_id || !registroData.tipo_usuario) {
      return NextResponse.json(
        { error: 'usuario_id y tipo_usuario son campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: registroData.usuario_id }
    });
    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar psicólogo si se proporciona
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

    // Verificar si ya existe un registro para este usuario hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registroExistente = await prisma.registroUsuario.findFirst({
      where: {
        usuario_id: registroData.usuario_id,
        fecha_registro: {
          gte: hoy
        }
      }
    });

    if (registroExistente) {
      return NextResponse.json(
        { error: 'Ya existe un registro para este usuario hoy' },
        { status: 400 }
      );
    }

    // Preparar datos para creación con el tipo correcto para campos JSON
    const datosCreacion = {
      usuario_id: registroData.usuario_id,
      sexo: registroData.sexo ?? null,
      edad: registroData.edad ?? null,
      tipo_usuario: registroData.tipo_usuario,
      psicologo_id: registroData.psicologo_id ?? null,
      tests_ids: registroData.tests_ids ,
      tests_evaluados: registroData.tests_evaluados,
      total_tests: registroData.total_tests ?? 0,
      avg_notas: registroData.avg_notas ?? null,
      fecha_registro: new Date()
    };

    const nuevoRegistro = await prisma.registroUsuario.create({
      data: datosCreacion,
      include: {
        trazabilidades: true,
        metricas: true,
        sesiones: true
      }
    });

    return NextResponse.json(nuevoRegistro, { status: 201 });

  } catch (error: any) {
    console.error('Error creating registro:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Error de validación en los datos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear el registro',
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
    const { id, ...restoDatos }: { id: number } & Partial<RegistroUsuarioData> = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de registro es requerido' }, { status: 400 });
    }

    const registroExistente = await prisma.registroUsuario.findUnique({ 
      where: { id },
      include: {
        trazabilidades: true,
        metricas: true,
        sesiones: true
      }
    });

    if (!registroExistente) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {};

    // Campos básicos
    if (restoDatos.sexo !== undefined) {
      updateData.sexo = restoDatos.sexo;
    }
    if (restoDatos.edad !== undefined) {
      updateData.edad = restoDatos.edad;
    }
    if (restoDatos.tipo_usuario !== undefined) {
      updateData.tipo_usuario = restoDatos.tipo_usuario;
    }
    if (restoDatos.psicologo_id !== undefined) {
      updateData.psicologo_id = restoDatos.psicologo_id;
    }

    // Campos JSON
    if (restoDatos.tests_ids !== undefined) {
      updateData.tests_ids = restoDatos.tests_ids ? JSON.stringify(restoDatos.tests_ids) : null;
    }
    if (restoDatos.tests_evaluados !== undefined) {
      updateData.tests_evaluados = restoDatos.tests_evaluados ? JSON.stringify(restoDatos.tests_evaluados) : null;
    }

    // Campos numéricos
    if (restoDatos.total_tests !== undefined) {
      updateData.total_tests = restoDatos.total_tests;
    }
    if (restoDatos.avg_notas !== undefined) {
      updateData.avg_notas = restoDatos.avg_notas;
    }

    const registroActualizado = await prisma.registroUsuario.update({
      where: { id },
      data: updateData,
      include: {
        trazabilidades: true,
        metricas: true,
        sesiones: true
      }
    });

    return NextResponse.json(registroActualizado);

  } catch (error: any) {
    console.error('Error updating registro:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Error de validación en los datos' }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error al actualizar el registro',
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

    const registroExistente = await prisma.registroUsuario.findUnique({
      where: { id: registroId },
      include: {
        trazabilidades: true,
        metricas: true,
        sesiones: true
      }
    });

    if (!registroExistente) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar en cascada las relaciones
    await prisma.$transaction([
      prisma.registroTrazabilidad.deleteMany({
        where: { registro_usuario_id: registroId }
      }),
      prisma.registroMetricaUsuario.deleteMany({
        where: { registro_usuario_id: registroId }
      }),
      prisma.registroSesion.deleteMany({
        where: { registro_usuario_id: registroId }
      }),
      prisma.registroUsuario.delete({
        where: { id: registroId }
      })
    ]);

    return NextResponse.json(
      { 
        message: 'Registro y datos relacionados eliminados correctamente',
        deletedRecord: registroExistente
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting registro:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar el registro',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}