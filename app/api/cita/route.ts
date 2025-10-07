import { NextResponse } from 'next/server';
import { PrismaClient,EstadoCita } from "../../generated/prisma";
import { setImmediate } from 'timers/promises';
import { registroCitaService,CreateRegistroCitaInput } from "../../lib/registro/registro-cita"
import { create_alarma_email } from '@/app/lib/alertas';

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface CitaData {
  titulo: string;
  descripcion?: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: EstadoCita | string;
  id_psicologo: number;
  id_paciente?: number | null;
  id_tipo_cita?: number | null;
  duracion_real?: number | null;
  notas_psicologo?: string | null;
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
    const psicologoId = searchParams.get('psicologoId');
    const pacienteId = searchParams.get('pacienteId');
    const estado = searchParams.get('estado');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const tipoCitaId = searchParams.get('tipoCitaId');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true'; // Nuevo parámetro para obtener todos los resultados
    
    // Parámetros de paginación (solo se usan si all es false)
    const page = all ? 1 : parseInt(searchParams.get('page') || '1');
    const pageSize = all ? Number.MAX_SAFE_INTEGER : parseInt(searchParams.get('pageSize') || '10');
    
    if (id) {
      // Obtener una cita específica por ID (sin paginación)
      const cita = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
        include: {
          psicologo: true,
          paciente: true,
          tipo: true,
          recordatorios: true
        }
      });

      if (!cita) {
        return NextResponse.json(
          { error: 'Cita no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(cita);
    } else if (search) {
      // Búsqueda por nombre o cédula del paciente o psicólogo
      // Primero obtenemos los IDs de usuarios que coincidan con la búsqueda
      const usuariosCoincidentes = await prisma.usuario.findMany({
        where: {
          OR: [
            { nombre: { contains: search } },
            { cedula: { contains: search } }
          ]
        },
        select: { id: true }
      });

      const idsUsuarios = usuariosCoincidentes.map(u => u.id);

      // Construimos el where clause base para la búsqueda
      let whereClause: any = {
        OR: [
          { id_psicologo: { in: idsUsuarios } },
          { id_paciente: { in: idsUsuarios } }
        ]
      };

      // Añadimos el filtro de psicologoId si está presente
      if (psicologoId) {
        whereClause.id_psicologo = parseInt(psicologoId);
        // Eliminamos el OR para id_psicologo ya que ahora es un filtro exacto
        whereClause.OR = whereClause.OR.filter((condition: any) => !('id_psicologo' in condition));
        // Mantenemos solo el OR para pacientes que coincidan con la búsqueda
        whereClause.OR = [
          { id_paciente: { in: idsUsuarios } }
        ];
      }

      // Buscamos citas con los filtros combinados
      const citas = await prisma.cita.findMany({
        where: whereClause,
        include: {
          psicologo: true,
          paciente: true,
          tipo: true,
          recordatorios: true
        },
        orderBy: {
          fecha_inicio: 'asc'
        }
      });

      if (all) {
        // Si all es true, devolvemos todos los resultados sin paginación
        return NextResponse.json({
          data: citas,
          total: citas.length
        });
      }

      // Obtener el total de citas que coinciden con la búsqueda
      const total = citas.length;

      // Aplicar paginación manualmente
      const paginatedCitas = citas.slice((page - 1) * pageSize, page * pageSize);

      // Calcular el total de páginas
      const totalPages = Math.ceil(total / pageSize);

      // Construir respuesta paginada
      const paginatedResponse: PaginatedResponse = {
        data: paginatedCitas,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(paginatedResponse);
    } else {
      // Resto del código original con soporte para all
      let whereClause: any = {};
      
      if (psicologoId) {
        whereClause.id_psicologo = parseInt(psicologoId);
      }
      
      if (pacienteId) {
        whereClause.id_paciente = parseInt(pacienteId);
      }
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (fechaInicio && fechaFin) {
        whereClause.fecha_inicio = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      } else if (fechaInicio) {
        whereClause.fecha_inicio = {
          gte: new Date(fechaInicio)
        };
      } else if (fechaFin) {
        whereClause.fecha_inicio = {
          lte: new Date(fechaFin)
        };
      }
      
      if (tipoCitaId) {
        whereClause.id_tipo_cita = parseInt(tipoCitaId);
      }

      const total = await prisma.cita.count({
        where: whereClause
      });

      const citas = await prisma.cita.findMany({
        where: whereClause,
        include: {
          psicologo: true,
          paciente: true,
          tipo: true,
          recordatorios: true
        },
        orderBy: {
          fecha_inicio: 'asc'
        },
        skip: all ? 0 : (page - 1) * pageSize,
        take: all ? undefined : pageSize
      });

      if (all) {
        // Si all es true, devolvemos todos los resultados sin paginación
        return NextResponse.json({
          data: citas,
          total
        });
      }

      const totalPages = Math.ceil(total / pageSize);

      const paginatedResponse: PaginatedResponse = {
        data: citas,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(paginatedResponse);
    }
  } catch (error: any) {
    console.error('Error obteniendo citas:', error);
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
    let { 
      titulo, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      estado, 
      id_psicologo, 
      id_paciente, 
      id_tipo_cita,
      duracion_real,
      notas_psicologo
    }: CitaData = await request.json();

    // Validación básica
    if (!titulo) {
      return NextResponse.json(
        { error: 'El título de la cita es requerido' },
        { status: 400 }
      );
    }

    if (!fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: 'Las fechas de inicio y fin son requeridas' },
        { status: 400 }
      );
    }

    if (new Date(fecha_inicio).toDateString() !== new Date().toDateString()) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser del día de hoy' },
        { status: 400 }
      );
    }

    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    if (!id_psicologo) {
      return NextResponse.json(
        { error: 'El ID del psicólogo es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el psicólogo existe
    const psicologo = await prisma.usuario.findUnique({
      where: { id: id_psicologo }
    });

    if (!psicologo) {
      return NextResponse.json(
        { error: 'El psicólogo especificado no existe' },
        { status: 404 }
      );
    }

    // Verificar que el paciente existe si se proporciona
    if (id_paciente) {
      const paciente = await prisma.usuario.findUnique({
        where: { id: id_paciente }
      });

      if (!paciente) {
        return NextResponse.json(
          { error: 'El paciente especificado no existe' },
          { status: 404 }
        );
      }
    }

    // Verificar que el tipo de cita existe si se proporciona
    if (id_tipo_cita) {
      const tipoCita = await prisma.tipoCita.findUnique({
        where: { id: id_tipo_cita }
      });

      if (!tipoCita) {
        return NextResponse.json(
          { error: 'El tipo de cita especificado no existe' },
          { status: 404 }
        );
      }
    }

    // Verificar disponibilidad del psicólogo
    const citasSolapadas = await prisma.cita.findFirst({
      where: {
        id_psicologo,
        OR: [
          {
            fecha_inicio: { lt: new Date(fecha_fin) },
            fecha_fin: { gt: new Date(fecha_inicio) }
          }
        ],
        NOT: {
          estado: 'CANCELADA'
        }
      }
    });

    if (citasSolapadas) {
      return NextResponse.json(
        { 
          error: 'El psicólogo ya tiene una cita programada en ese horario',
          citaExistente: citasSolapadas
        },
        { status: 409 }
      );
    }

    // Crear nueva cita
    const nuevaCita = await prisma.cita.create({
      data: {
        titulo,
        descripcion,
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        estado: estado as EstadoCita,
        id_psicologo,
        id_paciente,
        id_tipo_cita,
        duracion_real,
        notas_psicologo
      },
      include: {
        psicologo: true,
        paciente: true,
        tipo: true
      }
    });
    setImmediate().then(async () => {
      if(!id_paciente) return
      const paciente = await prisma.usuario.findUnique({
        where: { id: id_paciente }
      });
      try {
        const nuevaCitaObj:CreateRegistroCitaInput = {
          cita_id: nuevaCita.id,
          id_psicologo: nuevaCita.id_psicologo,
          nombre_psicologo: psicologo.nombre,
          id_paciente: nuevaCita.id_paciente,
          nombre_paciente: paciente?.nombre,
          fecha_cita: nuevaCita.fecha_inicio,
          duracion_planeada: nuevaCita.duracion_real ?? 1,
          duracion_real: nuevaCita.duracion_real,
          estado: nuevaCita.estado, // EstadoCita enum
          tipo_cita: nuevaCita.tipo?.nombre ?? null,
          color_calendario: nuevaCita.tipo?.color_calendario,
          tiempo_confirmacion:  null,
          cancelado_por:  null,
          motivo_cancelacion:  null,
          registro_usuario_id: null
        }
        const cita = await registroCitaService.createRegistroCita(nuevaCitaObj) 
        //enviar email de cita.
        console.log(paciente,"PACIENTE-REGISTRAR-CITA");
        if(paciente){
        const result_email = await create_alarma_email({
          emailParams: {
            to: paciente.email,
            subject: "Tiene una nueva cita registrada.",
            template: "cita_asignada",
            props: {
              name: paciente.nombre,
              psicologo_name: psicologo.nombre,
              alertMessage: `Se a registrado una cita con el psicologo: ${psicologo.nombre}, para la fecha ${nuevaCita.fecha_inicio}.`
            }
          }  
        }) 
        }  
        console.log('Registro cita creada:', cita);
      } catch (error) {
        console.error('Error al crear registro test:', error);
      }
    })


    return NextResponse.json(nuevaCita, { status: 201 });

  } catch (error: any) {
    console.error('Error creando cita:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al crear la cita' },
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
    let { 
      id,
      titulo, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      estado, 
      id_psicologo, 
      id_paciente, 
      id_tipo_cita,
      duracion_real,
      notas_psicologo
    }: CitaData & { id: number } = await request.json();
    
    if(typeof duracion_real == "string"){
      duracion_real = parseInt(duracion_real);
    }

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de cita es requerido' },
        { status: 400 }
      );
    }

    if (!titulo) {
      return NextResponse.json(
        { error: 'El título de la cita es requerido' },
        { status: 400 }
      );
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // Verificar que la cita existe
    const citaExistente = await prisma.cita.findUnique({
      where: { id }
    });

    if (!citaExistente) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el psicólogo existe si se está actualizando
    if (id_psicologo && id_psicologo !== citaExistente.id_psicologo) {
      const psicologo = await prisma.usuario.findUnique({
        where: { id: id_psicologo }
      });

      if (!psicologo) {
        return NextResponse.json(
          { error: 'El psicólogo especificado no existe' },
          { status: 404 }
        );
      }
    }

    // Verificar que el paciente existe si se está actualizando
    if (id_paciente !== undefined && id_paciente !== citaExistente.id_paciente) {
      if (id_paciente !== null) {
        const paciente = await prisma.usuario.findUnique({
          where: { id: id_paciente }
        });

        if (!paciente) {
          return NextResponse.json(
            { error: 'El paciente especificado no existe' },
            { status: 404 }
          );
        }
      }
    }

    // Verificar que el tipo de cita existe si se está actualizando
    if (id_tipo_cita !== undefined && id_tipo_cita !== citaExistente.id_tipo_cita) {
      if (id_tipo_cita !== null) {
        const tipoCita = await prisma.tipoCita.findUnique({
          where: { id: id_tipo_cita }
        });

        if (!tipoCita) {
          return NextResponse.json(
            { error: 'El tipo de cita especificado no existe' },
            { status: 404 }
          );
        }
      }
    }

    // Verificar disponibilidad del psicólogo si se cambia la fecha o el psicólogo
    if ((fecha_inicio || fecha_fin || id_psicologo) && estado !== 'CANCELADA') {
      const psicologoId = id_psicologo || citaExistente.id_psicologo;
      const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : citaExistente.fecha_inicio;
      const fechaFin = fecha_fin ? new Date(fecha_fin) : citaExistente.fecha_fin;

      const citasSolapadas = await prisma.cita.findFirst({
        where: {
          id_psicologo: psicologoId,
          id: { not: id }, // Excluir la cita actual
          OR: [
            {
              fecha_inicio: { lt: fechaFin },
              fecha_fin: { gt: fechaInicio }
            }
          ],
          NOT: {
            estado: 'CANCELADA'
          }
        }
      });

      if (citasSolapadas) {
        return NextResponse.json(
          { 
            error: 'El psicólogo ya tiene una cita programada en ese horario',
            citaExistente: citasSolapadas
          },
          { status: 409 }
        );
      }
    }

    // Actualizar la cita
    const citaActualizada = await prisma.cita.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined,
        estado: estado as EstadoCita,
        id_psicologo,
        id_paciente,
        id_tipo_cita,
        duracion_real,
        notas_psicologo
      },
      include: {
        psicologo: true,
        paciente: true,
        tipo: true,
        recordatorios: true
      }
    });

    setImmediate().then(async () => {
      if(!id_paciente){console.log("No existe id_paciente"); return}
      const paciente = await prisma.usuario.findUnique({
        where: { id: id_paciente }
      });
        if(!id_psicologo){console.log("No existe id_psicologo"); return}
      const psicologo = await prisma.usuario.findUnique({
        where: { id: id_psicologo }
      });
      if(!psicologo){console.log("No existe paciente"); return}
      if(!paciente){console.log("No existe psicologo"); return}

      try {
        const nuevaCitaObj:CreateRegistroCitaInput = {
          cita_id: citaActualizada.id,
          id_psicologo: citaActualizada.id_psicologo,
          nombre_psicologo: psicologo.nombre,
          id_paciente: citaActualizada .id_paciente,
          nombre_paciente: paciente?.nombre,
          fecha_cita: citaActualizada .fecha_inicio,
          duracion_planeada: citaActualizada .duracion_real ?? 1,
          duracion_real: citaActualizada .duracion_real,
          estado: citaActualizada .estado, // EstadoCita enum
          tipo_cita: citaActualizada .tipo?.nombre ?? null,
          color_calendario: citaActualizada.tipo?.color_calendario,
          tiempo_confirmacion:  null,
          cancelado_por:  null,
          motivo_cancelacion:  null,
          registro_usuario_id: null
        }
        const cita = await registroCitaService.upsertRegistroByCitaId(citaActualizada.id,nuevaCitaObj);    
        console.log('Registro cita creada:', cita);
      } catch (error) {
        console.error('Error al crear registro test:', error);
      }
    })

    return NextResponse.json(citaActualizada);

  } catch (error: any) {
    console.error('Error actualizando cita:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al actualizar la cita' },
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
        { error: 'ID de cita es requerido' },
        { status: 400 }
      );
    }

    const citaId = parseInt(id);

    // Verificar si la cita existe
    const citaExistente = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        recordatorios: true
      }
    });

    if (!citaExistente) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar los recordatorios asociados primero
    if (citaExistente.recordatorios && citaExistente.recordatorios.length > 0) {
      await prisma.recordatorioCita.deleteMany({
        where: { id_cita: citaId }
      });
    }

    // Eliminar la cita
    await prisma.cita.delete({
      where: { id: citaId }
    });

    return NextResponse.json(
      { message: 'Cita eliminada correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}