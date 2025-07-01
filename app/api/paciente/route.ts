import { NextResponse } from 'next/server';
import { PrismaClient } from "../../../app/generated/prisma";
import { calcularProgreso } from '../../../app/api/helpers/testHelpers'
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// Tipos e interfaces
interface PacienteAsignacion {
  id_paciente: number;
  id_psicologo: number;
}

interface TestAsignacion {
  id_plantilla: number;
  id_paciente: number;
  id_psicologo: number;
  nombre?: string;
}

interface DatosPaciente {
  nombre?: string;
  email?: string;
  cedula?: string;
  fecha_nacimiento?: string;
  adolecente?: {
    id_tutor?: number;
    tutor?: {
      cedula_tutor?: string;
      nombre_tutor?: string;
      profesion_tutor?: string;
      telefono_contacto?: string;
      correo_contacto?: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const conTests = searchParams.get('conTests') === 'true';
    const disponibles = searchParams.get('disponibles') === 'true';

    // Validar autenticación
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      );
    }

    // Verificar usuario autenticado
    const usuarioAutenticado = await prisma.usuario.findFirst({
      where: { 
        authToken,
        authTokenExpiry: { gt: new Date() }
      },
      include: {
        psicologo: true,
        tipo_usuario: true
      }
    });

    if (!usuarioAutenticado) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    // Configuración de relaciones a incluir
    const includeOptions: any = {
      adolecente: {
        include: { tutor: true }
      },
      tipo_usuario: true
    };

    if (conTests) {
      includeOptions.tests = {
        include: {
          preguntas: true,
          respuestas: true
        }
      };
    }

    // Filtros base - EXCLUYE ADMINS Y PSICÓLOGOS
    const baseFilters: any = {
      // Excluir admins y psicólogos por tipo de usuario
      tipo_usuario: {
        nombre: { 
          in: ['adolecente', 'usuario'] // Solo estos tipos
        }
      },
      // Excluir usuarios que son psicólogos (por si acaso)
      psicologo: null
    };

    // Caso 1: Obtener pacientes disponibles (sin psicólogo asignado)
    if (disponibles) {
      baseFilters.id_psicologo = null;
    } 
    // Caso 2: Obtener pacientes asignados al psicólogo logueado
    else {
      // Verificar que el usuario autenticado es psicólogo
      if (usuarioAutenticado.tipo_usuario.nombre !== 'psicologo') {
        return NextResponse.json(
          { error: 'Solo los psicólogos pueden ver sus pacientes asignados' },
          { status: 403 }
        );
      }
      baseFilters.id_psicologo = usuarioAutenticado.id;
    }

    // Si se busca un paciente específico
    if (id_paciente) {
      baseFilters.id = parseInt(id_paciente);
    }

    // Obtener usuarios según los filtros
    const usuarios = await prisma.usuario.findMany({
      where: baseFilters,
      include: includeOptions
    });

    // Procesar datos para respuesta (eliminar información sensible)
    const usuariosProcesados = usuarios.map((usuario: any) => {
      const { 
        password, 
        password_iv, 
        authToken, 
        authTokenExpiry, 
        resetPasswordToken, 
        resetPasswordTokenExpiry, 
        ...usuarioSafe 
      } = usuario;
      
      return {
        ...usuarioSafe,
        esAdolescente: usuario.tipo_usuario.nombre === 'adolecente',
        esPsicologo: false, // Ya están filtrados
        tienePsicologo: !!usuario.id_psicologo,
        tests: conTests ? usuario.tests?.map((t: any) => ({
          ...t,
          progreso: calcularProgreso(t.id, t.id_usuario ?? undefined)
        })) : undefined
      };
    });

    return NextResponse.json(
      id_paciente ? usuariosProcesados[0] || null : usuariosProcesados
    );

  } catch (error: any) {
    console.error('Error obteniendo pacientes:', error);
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
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      );
    }

    // Verificar el usuario/psicólogo autenticado
    const usuarioAutenticado = await prisma.usuario.findFirst({
      where: { 
        authToken,
        authTokenExpiry: { gt: new Date() } // Token aún no expirado
      },
      include: {
        psicologo: true
      }
    });

    if (!usuarioAutenticado) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    // Verificar que el usuario es psicólogo
    if (!usuarioAutenticado.psicologo) {
      return NextResponse.json(
        { error: 'Solo los psicólogos pueden realizar estas acciones' },
        { status: 403 }
      );
    }

    const idPsicologo = usuarioAutenticado.id;
    const data = await request.json();

    // Validación básica de datos
    if (!data.id_paciente) {
      return NextResponse.json(
        { error: 'ID de paciente es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe y no es psicólogo
    const paciente = await prisma.usuario.findUnique({
      where: { id: data.id_paciente },
      include: { psicologo: true }
    });

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    if (paciente.psicologo) {
      return NextResponse.json(
        { error: 'El usuario es un psicólogo, no puede ser paciente' },
        { status: 400 }
      );
    }

    // Caso 1: Solo asignar paciente (sin id_plantilla)
    if (!data.id_plantilla) {
      // Verificar si ya está asignado
      if (paciente.id_psicologo === idPsicologo) {
        return NextResponse.json(
          { error: 'El paciente ya está asignado a este psicólogo' },
          { status: 400 }
        );
      }

      // Actualizar el campo id_psicologo en el usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: data.id_paciente },
        data: { id_psicologo: idPsicologo }
      });

      return NextResponse.json(
        { 
          message: 'Paciente asignado correctamente', 
          usuario: usuarioActualizado,
          testAsignado: false
        },
        { status: 200 }
      );
    }

    // Caso 2: Asignar test a paciente (con id_plantilla)
    // Verificar que el paciente está asignado a este psicólogo
    if (paciente.id_psicologo !== idPsicologo) {
      return NextResponse.json(
        { error: 'El paciente no está asignado a este psicólogo' },
        { status: 403 }
      );
    }

    // Verificar que la plantilla existe y pertenece al psicólogo
    const plantilla = await prisma.testPlantilla.findUnique({
      where: { id: data.id_plantilla },
      include: {
        preguntas: {
          include: {
            opciones: true,
            tipo: true
          },
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla de test no encontrada' },
        { status: 404 }
      );
    }

    if (plantilla.id_psicologo !== idPsicologo) {
      return NextResponse.json(
        { error: 'La plantilla no pertenece a este psicólogo' },
        { status: 403 }
      );
    }

    // Crear el nuevo test basado en la plantilla
    const nuevoTest = await prisma.test.create({
      data: {
        nombre: plantilla.nombre,
        id_psicologo: idPsicologo,
        id_usuario: data.id_paciente,
        estado: 'no_iniciado',
        progreso: 0,
        fecha_creacion: new Date(),
        preguntas: {
          create: plantilla.preguntas.map(preguntaPlantilla => ({
            id_tipo: preguntaPlantilla.id_tipo,
            texto_pregunta: preguntaPlantilla.texto_pregunta,
            orden: preguntaPlantilla.orden,
            obligatoria: preguntaPlantilla.obligatoria,
            placeholder: preguntaPlantilla.placeholder,
            min: preguntaPlantilla.min,
            max: preguntaPlantilla.max,
            paso: preguntaPlantilla.paso,
            opciones: {
              create: preguntaPlantilla.opciones.map(opcionPlantilla => ({
                texto: opcionPlantilla.texto,
                valor: opcionPlantilla.valor,
                orden: opcionPlantilla.orden,
                es_otro: opcionPlantilla.es_otro
              }))
            }
          }))
        }
      },
      include: {
        preguntas: {
          include: {
            opciones: true
          }
        }
      }
    });

    return NextResponse.json(
      { 
        message: 'Test asignado correctamente desde plantilla', 
        test: nuevoTest,
        totalPreguntas: plantilla.preguntas.length,
        testAsignado: true
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error en asignación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
// Actualizar datos de un paciente
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const id_psicologo = searchParams.get('id_psicologo');

    if (!id_paciente || !id_psicologo) {
      return NextResponse.json(
        { error: 'ID de paciente y psicólogo son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente está asignado al psicólogo
    const asignacionExistente = await prisma.test.findFirst({
      where: {
        id_usuario: parseInt(id_paciente),
        id_psicologo: parseInt(id_psicologo)
      }
    });

    if (!asignacionExistente) {
      return NextResponse.json(
        { error: 'El paciente no está asignado a este psicólogo' },
        { status: 403 }
      );
    }

    const data: DatosPaciente = await request.json();

    // Validar que no se intenten actualizar campos sensibles
    const camposProhibidos = ['password', 'password_iv', 'authToken', 'authTokenExpiry', 'resetPasswordToken', 'resetPasswordTokenExpiry', 'id_tipo_usuario'];
    for (const campo of camposProhibidos) {
      if (data[campo as keyof DatosPaciente] !== undefined) {
        return NextResponse.json(
          { error: `No puedes actualizar el campo ${campo}` },
          { status: 403 }
        );
      }
    }

    // Actualizar datos básicos del usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id_paciente) },
      data: {
        nombre: data.nombre,
        email: data.email,
        cedula: data.cedula,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined
      }
    });

    // Si es adolescente, actualizar tutor si viene en los datos
    if (data.adolecente) {
      await prisma.adolecente.upsert({
        where: { id_usuario: parseInt(id_paciente) },
        update: {
          id_tutor: data.adolecente.id_tutor
        },
        create: {
          id_usuario: parseInt(id_paciente),
          id_tutor: data.adolecente.id_tutor
        }
      });

      // Actualizar datos del tutor si vienen
      if (data.adolecente.tutor) {
        await prisma.tutor.upsert({
          where: { id: data.adolecente.id_tutor || -1 },
          update: {
            nombre_tutor: data.adolecente.tutor.nombre_tutor,
            profesion_tutor: data.adolecente.tutor.profesion_tutor,
            telefono_contacto: data.adolecente.tutor.telefono_contacto,
            correo_contacto: data.adolecente.tutor.correo_contacto
          },
          create: {
            cedula_tutor: data.adolecente.tutor.cedula_tutor || '',
            nombre_tutor: data.adolecente.tutor.nombre_tutor || '',
            profesion_tutor: data.adolecente.tutor.profesion_tutor,
            telefono_contacto: data.adolecente.tutor.telefono_contacto,
            correo_contacto: data.adolecente.tutor.correo_contacto
          }
        });
      }
    }

    return NextResponse.json(usuarioActualizado);
  } catch (error: any) {
    console.error('Error actualizando paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Desasignar paciente (eliminar relación con psicólogo pero mantener tests)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const id_psicologo = searchParams.get('id_psicologo');

    if (!id_paciente || !id_psicologo) {
      return NextResponse.json(
        { error: 'ID de paciente y psicólogo son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe y está asignado a este psicólogo
    const paciente = await prisma.usuario.findUnique({
      where: { 
        id: parseInt(id_paciente),
        id_psicologo: parseInt(id_psicologo)
      },
      include: {
        tipo_usuario: true
      }
    });

    if (!paciente) {
      return NextResponse.json(
        { error: 'No existe asignación entre este psicólogo y paciente' },
        { status: 404 }
      );
    }

    // Verificar que el paciente no sea un admin o psicólogo
    if (paciente.tipo_usuario.nombre === 'admin' || paciente.tipo_usuario.nombre === 'psicologo') {
      return NextResponse.json(
        { error: 'No se puede desasignar usuarios con rol admin o psicólogo' },
        { status: 403 }
      );
    }

    // Eliminar solo la relación (id_psicologo = null) manteniendo todos los tests
    await prisma.usuario.update({
      where: { id: parseInt(id_paciente) },
      data: { id_psicologo: null }
    });

    return NextResponse.json(
      { 
        message: 'Paciente desasignado correctamente',
        detail: 'Los tests asociados se mantienen en el sistema'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error desasignando paciente:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}