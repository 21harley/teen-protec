import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";
import { create_alarma_email,create_alarma } from '@/app/lib/alertas';

const prisma = new PrismaClient()

enum TestStatus {
  NO_INICIADO = 'NO_INICIADO',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
  EVALUADO = 'EVALUADO'
}

enum PesoPreguntaTipo {
  SIN_VALOR = 'SIN_VALOR',
  IGUAL_VALOR = 'IGUAL_VALOR',
  BAREMO = 'BAREMO'
}

enum TipoPreguntaNombre {
  OPCION_UNICA= 'radio',
  OPCION_MULTIPLE = 'checkbox',
  RESPUESTA_CORTA = 'text',
  SELECT = 'select',
  RANGO = 'range'
}

interface TipoPregunta {
  id: number;
  nombre: TipoPreguntaNombre;
  descripcion?: string | null;
  tipo_respuesta: string;
}

interface TestBase {
  id_psicologo?: number;
  id_usuario?: number;
  nombre?: string;
  estado?: TestStatus;
  peso_preguntas?: PesoPreguntaTipo;
  config_baremo?: any;
  valor_total?: number;
  fecha_creacion?: Date | string;
  fecha_ultima_respuesta?: Date | string;
  evaluado?:            boolean;          
  fecha_evaluacion?:    Date;
  ponderacion_final?:      number;           
  comentarios_psicologo?: string;  
}

interface PreguntaData {
  id?: number;
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  peso?: number;
  baremo_detalle?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionData[];
  tipo?: TipoPregunta;
}

interface OpcionData {
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

interface RespuestaData {
  id_pregunta: number;
  id_opcion?: number;
  texto_respuesta?: string;
  valor_rango?: number;
}

interface FullTestData extends TestBase {
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
}

// Helper para verificar si todas las preguntas están respondidas
async function todasPreguntasRespondidas(
  testId: number | null | undefined,
  usuarioId: number | null | undefined,
  preguntas: PreguntaData[] | undefined,
  respuestas: RespuestaData[] | undefined
): Promise<boolean> {
  if (!testId || !usuarioId || !preguntas || !respuestas) {
    return false;
  }

  const preguntasObligatorias = preguntas.filter(p => p.obligatoria);

  if (preguntasObligatorias.length === 0) {
    return true;
  }

  const todasObligatoriasRespondidas = preguntasObligatorias.every(pregunta => {
    const respuestasPreg = respuestas.filter(r => r.id_pregunta === pregunta.id);
    
    let tieneRespuesta = false;
    
    switch (pregunta.id_tipo) {
      case 1: // radio
      case 4: // select
        tieneRespuesta = respuestasPreg.some(r => r.id_opcion !== null);
        break;
      case 2: // select (tratado como multi-opción)
        tieneRespuesta = respuestasPreg.some(r => r.id_opcion !== null);
        break;
      case 3: // text
        tieneRespuesta = respuestasPreg.some(r => r.texto_respuesta && r.texto_respuesta.trim() !== '');
        break;
      case 5: // range
        tieneRespuesta = respuestasPreg.some(r => r.valor_rango !== null);
        break;
    }
    
    return tieneRespuesta;
  });

  return todasObligatoriasRespondidas;
}

// Función auxiliar para determinar estado
function determinarEstado(todasRespondidas: boolean): TestStatus {
  if (todasRespondidas) {
    return TestStatus.COMPLETADO;
  }
  return TestStatus.EN_PROGRESO;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const nombre = searchParams.get('nombre');
    const id_usuario = searchParams.get('id_usuario');
    const id_psicologo = searchParams.get('id_psicologo');
    const estado = searchParams.get('estado') as TestStatus | null;
    const search = searchParams.get('search');
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');
    const es_psicologa = searchParams.get('es_psicologa') === 'true';

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    if (id) {
      const test = await prisma.test.findUnique({
        where: { id: parseInt(id) },
        include: {
          psicologo: {
            include: {
              usuario: true,
              redes_sociales: true
            }
          },
          usuario: true,
          preguntas: {
            include: {
              tipo: true,
              opciones: true
            },
            orderBy: { orden: 'asc' }
          },
          respuestas: {
            include: {
              pregunta: true,
              usuario: true,
              opcion: true
            }
          }
        }
      });

      if (!test) {
        return NextResponse.json({ error: 'Test no encontrado' }, { status: 404 });
      }

      return NextResponse.json(test);
    }

    if (nombre) {
      const tests = await prisma.test.findMany({
        where: {
          nombre: {
            contains: nombre
          }
        },
        include: {
          psicologo: {
            include: {
              usuario: true,
              redes_sociales: true
            }
          },
          usuario: true,
          preguntas: {
            include: {
              tipo: true,
              opciones: true
            },
            orderBy: { orden: 'asc' }
          },
          respuestas: {
            include: {
              pregunta: true,
              usuario: true,
              opcion: true
            }
          }
        }
      });

      if (!tests || tests.length === 0) {
        return NextResponse.json({ error: 'Test no encontrado' }, { status: 404 });
      }

      return NextResponse.json(tests);
    }

    if (es_psicologa && id_usuario) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id_usuario) },
        include: { psicologo: true }
      });

      if (!usuario || !usuario.psicologo) {
        return NextResponse.json({ error: 'El usuario no tiene permisos de psicóloga' }, { status: 403 });
      }

      let whereClause: any = {
        id_psicologo: usuario.psicologo.id_usuario
      };

      if (estado) whereClause.estado = estado;

      if (search) {
        whereClause.OR = [
          { nombre: { contains: search } },
          {
            usuario: {
              OR: [
                { nombre: { contains: search } },
                { email: { contains: search } }
              ]
            }
          }
        ];
      }

      if (fecha_inicio || fecha_fin) {
        whereClause.fecha_creacion = {};
        if (fecha_inicio) whereClause.fecha_creacion.gte = new Date(fecha_inicio);
        if (fecha_fin) whereClause.fecha_creacion.lte = new Date(fecha_fin);
      }

      const total = await prisma.test.count({ where: whereClause });
      const totalPages = Math.ceil(total / pageSize);

      const tests = await prisma.test.findMany({
        where: whereClause,
        include: {
          usuario: true,
          psicologo: { include: { usuario: true } },
          preguntas: {
            include: {
              tipo: true,
              opciones: { orderBy: { orden: 'asc' } }
            },
            orderBy: { orden: 'asc' }
          },
          respuestas: {
            include: {
              pregunta: true,
              opcion: true,
              usuario: true
            }
          }
        },
        orderBy: { fecha_creacion: 'desc' },
        skip,
        take: pageSize
      });

      return NextResponse.json({ data: tests, total, page, pageSize, totalPages });
    }

    let whereClause: any = {};

    if (id_usuario) whereClause.id_usuario = parseInt(id_usuario);
    if (id_psicologo) whereClause.id_psicologo = parseInt(id_psicologo);
    if (estado) whereClause.estado = estado;
    if (nombre) whereClause.nombre = { contains: nombre };

    if (fecha_inicio || fecha_fin) {
      whereClause.fecha_creacion = {};
      if (fecha_inicio) whereClause.fecha_creacion.gte = new Date(fecha_inicio);
      if (fecha_fin) whereClause.fecha_creacion.lte = new Date(fecha_fin);
    }

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search } },
        {
          usuario: {
            OR: [
              { nombre: { contains: search } },
              { email: { contains: search } },
              { cedula: { contains: search } }
            ]
          }
        },
        {
          psicologo: {
            usuario: {
              OR: [
                { nombre: { contains: search } },
                { email: { contains: search } },
                { cedula: { contains: search } }
              ]
            }
          }
        },
        {
          preguntas: {
            some: {
              texto_pregunta: { contains: search }
            }
          }
        },
        {
          respuestas: {
            some: {
              OR: [
                { texto_respuesta: { contains: search } },
                {
                  opcion: {
                    texto: { contains: search }
                  }
                }
              ]
            }
          }
        }
      ];
    }

    const total = await prisma.test.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        psicologo: {
          include: {
            usuario: true,
            redes_sociales: true
          }
        },
        usuario: true,
        preguntas: {
          include: {
            tipo: true,
            opciones: { orderBy: { orden: 'asc' } }
          },
          orderBy: { orden: 'asc' }
        },
        respuestas: {
          include: {
            pregunta: true,
            opcion: true
          }
        }
      },
      orderBy: { fecha_ultima_respuesta: 'desc' },
      skip,
      take: pageSize
    });

    return NextResponse.json({
      data: tests,
      total,
      page,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    console.error('Error obteniendo tests:', error);
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

export async function POST(request: Request) {
  try {
    const { 
      id_psicologo,
      id_usuario,
      nombre,
      estado,
      peso_preguntas,
      config_baremo,
      valor_total,
      fecha_creacion,
      fecha_ultima_respuesta,
      preguntas,
      respuestas
    }: FullTestData = await request.json();

    // Validación básica
    if (!id_psicologo && !id_usuario) {
      return NextResponse.json(
        { error: 'Se requiere al menos un psicólogo o usuario asociado al test' },
        { status: 400 }
      );
    }

    // Validar peso_preguntas
    if (peso_preguntas && !Object.values(PesoPreguntaTipo).includes(peso_preguntas)) {
      return NextResponse.json(
        { error: 'Tipo de peso de pregunta no válido' },
        { status: 400 }
      );
    }

    // Verificar que el psicólogo existe si se proporciona
    if (id_usuario) {
    const psicologoExistente = await prisma.psicologo.findUnique({
      where: { id_usuario: id_psicologo }
    });
    if (!psicologoExistente) {
      return NextResponse.json(
        { error: 'Psicólogo no encontrado' },
        { status: 404 }
      );
    }
  }

    // Verificar que el usuario existe si se proporciona
    if (id_usuario) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: id_usuario }
      });

      if (!usuarioExistente) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar nombre único si se proporciona
    if (nombre) {
      const codigoExistente = await prisma.test.findFirst({
        where: { nombre }
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: 'El nombre de test ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Crear transacción para asegurar la integridad de los datos
    const result = await prisma.$transaction(async (prisma) => {
      // Determinar estado inicial
      const estadoInicial = estado || TestStatus.NO_INICIADO;

      // Crear nuevo test
      const nuevoTest = await prisma.test.create({
        data: {
          id_psicologo,
          id_usuario,
          nombre,
          estado: estadoInicial,
          peso_preguntas: peso_preguntas || PesoPreguntaTipo.SIN_VALOR,
          config_baremo,
          valor_total,
          fecha_creacion: fecha_creacion ? new Date(fecha_creacion) : new Date(),
          fecha_ultima_respuesta: fecha_ultima_respuesta ? new Date(fecha_ultima_respuesta) : null
        }
      });

      // Procesar preguntas si existen
      if (preguntas && preguntas.length > 0) {
        for (const preguntaData of preguntas) {
          // Verificar que el tipo de pregunta existe
          const tipoPregunta = await prisma.tipoPregunta.findUnique({
            where: { id: preguntaData.id_tipo }
          });

          if (!tipoPregunta) {
            throw new Error(`Tipo de pregunta con ID ${preguntaData.id_tipo} no encontrado`);
          }

          const preguntaCreada = await prisma.pregunta.create({
            data: {
              id_test: nuevoTest.id,
              id_tipo: preguntaData.id_tipo,
              texto_pregunta: preguntaData.texto_pregunta,
              orden: preguntaData.orden,
              obligatoria: preguntaData.obligatoria || false,
              peso: preguntaData.peso,
              baremo_detalle: preguntaData.baremo_detalle,
              placeholder: preguntaData.placeholder,
              min: preguntaData.min,
              max: preguntaData.max,
              paso: preguntaData.paso
            }
          });

          // Procesar opciones si existen
          if (preguntaData.opciones && preguntaData.opciones.length > 0) {
            for (const opcionData of preguntaData.opciones) {
              await prisma.opcion.create({
                data: {
                  id_pregunta: preguntaCreada.id,
                  texto: opcionData.texto,
                  valor: opcionData.valor,
                  orden: opcionData.orden,
                  es_otro: opcionData.es_otro || false
                }
              });
            }
          }
        }
      }

      // Procesar respuestas si existen
      if (respuestas && respuestas.length > 0) {
        for (const respuestaData of respuestas) {
          await prisma.respuesta.create({
            data: {
              id_test: nuevoTest.id,
              id_pregunta: respuestaData.id_pregunta,
              id_usuario: id_usuario!,
              id_opcion: respuestaData.id_opcion,
              texto_respuesta: respuestaData.texto_respuesta,
              valor_rango: respuestaData.valor_rango,
              fecha: new Date()
            }
          });
        }
        
        // Verificar si todas las preguntas están respondidas
        const completado = await todasPreguntasRespondidas(
          nuevoTest.id,
          id_usuario,
          preguntas,
          respuestas
        );
        
        // Actualizar estado y fecha de última respuesta
        await prisma.test.update({
          where: { id: nuevoTest.id },
          data: {
            estado: determinarEstado(completado),
            fecha_ultima_respuesta: new Date()
          }
        });
      }

      return nuevoTest;
    });

    if(result){
    console.log("crear test",id_psicologo,id_usuario);
    if (id_usuario && id_psicologo) {
        console.log("consulta usuario");
        const psicologoExistente = await prisma.usuario.findUnique({
          where: { id: id_psicologo }
        });
        const usuarioExistente = await prisma.usuario.findUnique({
           where: { id: id_usuario }
        });
        if(usuarioExistente && psicologoExistente){
        console.log("crea alarma de test");
        const result_email = await  create_alarma_email({
        id_usuario: id_usuario ,
        id_tipo_alerta: 1,
        mensaje: `Tiene asignado un test.`,
        vista: false,
        correo_enviado: true,
        emailParams: {
          to: usuarioExistente.email,
          subject: "Tienes una nueva alerta",
          template: "test_asignado",
          props: {
            name: usuarioExistente.nombre,
            psicologo_name:psicologoExistente.nombre,
            alertMessage: `El psicologo ${psicologoExistente.nombre}, te a enviado un test.`
          }
        }
      });
      
      if (!result_email.emailSent) console.error('Error al enviar email, test.',result_email); 
      }
    }
    }
    // Obtener el test completo con sus relaciones para la respuesta
    const testCompleto = await prisma.test.findUnique({
      where: { id: result.id },
      include: {
        psicologo: {
          include: {
            usuario: true,
            redes_sociales: true
          }
        },
        usuario: true,
        preguntas: {
          include: {
            tipo: true,
            opciones: {
              orderBy: {
                orden: 'asc'
              }
            }
          },
          orderBy: {
            orden: 'asc'
          }
        },
        respuestas: {
          include: {
            pregunta: true,
            opcion: true,
            usuario: true
          }
        }
      }
    });

    return NextResponse.json(testCompleto, { status: 201 });

  } catch (error: any) {
    console.error('Error creando test:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto de datos únicos (nombre de test ya existe)' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handleEvaluacionPsicologo(
  prisma: PrismaClient,
  testId: number,
  evaluado: boolean,
  fecha_evaluacion: Date | string | undefined,
  ponderacion_final: number | undefined,
  comentarios_psicologo: string | undefined,
  id_usuario?: number
): Promise<{test: any; notificacionEnviada: boolean}> {
  return await prisma.$transaction(async (tx) => {
    // Verificar datos de evaluación
    if (!evaluado || ponderacion_final === undefined) {
      throw new Error('Datos de evaluación incompletos');
    }

    // Obtener test con relaciones necesarias
    const test = await tx.test.findUnique({
      where: { id: testId },
      include: {
        usuario: true,
        psicologo: { include: { usuario: true } }
      }
    });

    if (!test) throw new Error('Test no encontrado');
    if (test.estado !== 'COMPLETADO') throw new Error('El test debe estar COMPLETADO para ser evaluado');

    // Actualizar test
    const testActualizado = await tx.test.update({
      where: { id: testId },
      data: {
        estado: 'EVALUADO',
        evaluado: true,
        fecha_evaluacion: fecha_evaluacion ? new Date(fecha_evaluacion) : new Date(),
        ponderacion_final,
        comentarios_psicologo: comentarios_psicologo || null
      }
    });

    // Notificaciones (si aplica)
    let notificacionEnviada = false;
    if (id_usuario && test.usuario) {
      try {
        const psicologoNombre = test.psicologo?.usuario?.nombre || 'el psicólogo';
        
        const result_email = await create_alarma_email({
          id_usuario: id_usuario,
          id_tipo_alerta: 3,
          mensaje: `${psicologoNombre} ha evaluado tu test.`,
          vista: false,
          correo_enviado: true,
          emailParams: {
            to: test.usuario.email,
            subject: "Tu test ha sido evaluado",
            template: "test_evaluado",
            props: {
              name: test.usuario.nombre,
              psicologo_name: psicologoNombre,
              alertMessage: `${psicologoNombre} ha evaluado tu test.`
            }
          }
        });

        notificacionEnviada = result_email.emailSent;

        await create_alarma({
          id_usuario: id_usuario,
          id_tipo_alerta: 3,
          mensaje: `${psicologoNombre} ha evaluado tu test.`,
          vista: false,
          correo_enviado: true
        });

      } catch (error) {
        console.error('Error enviando notificación de evaluación:', error);
      }
    }

    return {
      test: testActualizado,
      notificacionEnviada
    };
  });
}

async function obtenerTestCompleto(testId: number, id_usuario?: number) {
  return await prisma.test.findUnique({
    where: { id: testId },
    include: {
      psicologo: { include: { usuario: true, redes_sociales: true } },
      usuario: true,
      preguntas: {
        include: { tipo: true, opciones: { orderBy: { orden: 'asc' } } },
        orderBy: { orden: 'asc' }
      },
      respuestas: {
        where: id_usuario ? { id_usuario } : undefined,
        include: { pregunta: true, opcion: true, usuario: true }
      }
    }
  });
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de test es requerido' },
        { status: 400 }
      );
    }

    const testId = parseInt(id);
    const { 
      id_psicologo,
      id_usuario,
      nombre,
      estado,
      peso_preguntas,
      config_baremo,
      valor_total,
      preguntas,
      respuestas,
      evaluado,
      fecha_evaluacion,
      ponderacion_final,
      comentarios_psicologo
    }: FullTestData = await request.json();

    // Verificar si el test existe
    const testExistente = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        preguntas: {
          include: {
            tipo: true,
            opciones: true
          }
        }
      }
    });

    if (!testExistente) {
      return NextResponse.json(
        { error: 'Test no encontrado' },
        { status: 404 }
      );
    }

    // Validación de psicólogo (si se proporciona)
    if (id_psicologo) {
      const psicologoExistente = await prisma.psicologo.findUnique({
        where: { id_usuario: id_psicologo }
      });
      if (!psicologoExistente) {
        return NextResponse.json(
          { error: 'Psicólogo no encontrado' },
          { status: 404 }
        );
      }
    }

    // Validación de usuario (si se proporciona)
    if (id_usuario !== undefined) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: id_usuario }
      });
      if (!usuarioExistente) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
    }

    // Validación de nombre único (si se cambia)
    if (nombre && nombre !== testExistente.nombre) {
      const nombreExistente = await prisma.test.findFirst({
        where: { nombre, NOT: { id: testId } }
      });
      if (nombreExistente) {
        return NextResponse.json(
          { error: 'El nombre del test ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Validar peso_preguntas si se proporciona
    if (peso_preguntas && !Object.values(PesoPreguntaTipo).includes(peso_preguntas)) {
      return NextResponse.json(
        { error: 'Tipo de peso de pregunta no válido' },
        { status: 400 }
      );
    }

    if(evaluado && fecha_evaluacion ){
      console.log("EVALUANDO");  
      const { test: testEvaluado } = await handleEvaluacionPsicologo(
        prisma,
        testId,
        evaluado,
        fecha_evaluacion,
        ponderacion_final,
        comentarios_psicologo,
        id_usuario
      );

      return NextResponse.json(await obtenerTestCompleto(testId, id_usuario));
    }

    // Usar transacción para operaciones atómicas
    const testActualizado = await prisma.$transaction(async (prisma) => {
      // Actualizar datos básicos del test
      const test = await prisma.test.update({
        where: { id: testId },
        data: {
          id_psicologo: id_psicologo !== undefined ? id_psicologo : testExistente.id_psicologo,
          id_usuario: id_usuario !== undefined ? id_usuario : testExistente.id_usuario,
          nombre: nombre !== undefined ? nombre : testExistente.nombre,
          estado: estado !== undefined ? estado : testExistente.estado,
          peso_preguntas: peso_preguntas !== undefined ? peso_preguntas : testExistente.peso_preguntas,
          config_baremo: config_baremo !== undefined ? config_baremo : testExistente.config_baremo,
          valor_total: valor_total !== undefined ? valor_total : testExistente.valor_total
        }
      });

      // Procesar actualización de preguntas si se proporcionan
      if (preguntas) {
        // Primero eliminar respuestas asociadas a las preguntas existentes
        await prisma.respuesta.deleteMany({
          where: { 
            id_pregunta: { 
              in: testExistente.preguntas.map(p => p.id) 
            } 
          }
        });

        // Luego eliminar opciones de preguntas existentes
        await prisma.opcion.deleteMany({
          where: { 
            id_pregunta: { 
              in: testExistente.preguntas.map(p => p.id) 
            } 
          }
        });
        
        // Finalmente eliminar las preguntas existentes
        await prisma.pregunta.deleteMany({
          where: { id_test: testId }
        });

        // Crear nuevas preguntas
        for (const preguntaData of preguntas) {
          const tipoPregunta = await prisma.tipoPregunta.findUnique({
            where: { id: preguntaData.id_tipo }
          });

          if (!tipoPregunta) {
            throw new Error(`Tipo de pregunta con ID ${preguntaData.id_tipo} no encontrado`);
          }

          const preguntaCreada = await prisma.pregunta.create({
            data: {
              id_test: testId,
              id_tipo: preguntaData.id_tipo,
              texto_pregunta: preguntaData.texto_pregunta,
              orden: preguntaData.orden,
              obligatoria: preguntaData.obligatoria || false,
              peso: preguntaData.peso,
              baremo_detalle: preguntaData.baremo_detalle,
              placeholder: preguntaData.placeholder,
              min: preguntaData.min,
              max: preguntaData.max,
              paso: preguntaData.paso
            }
          });

          // Crear opciones si existen
          if (preguntaData.opciones && preguntaData.opciones.length > 0) {
            for (const opcionData of preguntaData.opciones) {
              await prisma.opcion.create({
                data: {
                  id_pregunta: preguntaCreada.id,
                  texto: opcionData.texto,
                  valor: opcionData.valor,
                  orden: opcionData.orden,
                  es_otro: opcionData.es_otro || false
                }
              });
            }
          }
        }
      }

      // Procesar respuestas si se proporcionan y hay un usuario asociado
      if (respuestas && id_usuario) {
        // Eliminar respuestas existentes de este usuario
        await prisma.respuesta.deleteMany({
          where: { 
            id_test: testId,
            id_usuario: id_usuario
          }
        });

        // Crear nuevas respuestas
        for (const respuestaData of respuestas) {
          await prisma.respuesta.create({
            data: {
              id_test: testId,
              id_pregunta: respuestaData.id_pregunta,
              id_usuario: id_usuario,
              id_opcion: respuestaData.id_opcion,
              texto_respuesta: respuestaData.texto_respuesta,
              valor_rango: respuestaData.valor_rango,
              fecha: new Date()
            }
          });
        }

        // Obtener preguntas actuales si no se enviaron en la solicitud
        let preguntasActuales = preguntas;
        if (!preguntasActuales) {
          const preguntasFromDB = await prisma.pregunta.findMany({
            where: { id_test: testId },
            include: { tipo: true }
          });
          
          preguntasActuales = preguntasFromDB.map(p => ({
            id: p.id,
            texto_pregunta: p.texto_pregunta,
            id_tipo: p.id_tipo,
            orden: p.orden,
            obligatoria: p.obligatoria,
            peso: p.peso || undefined,
            baremo_detalle: p.baremo_detalle || undefined,
            placeholder: p.placeholder || undefined,
            min: p.min || undefined,
            max: p.max || undefined,
            paso: p.paso || undefined
          }));
        }

        // Verificar si todas las preguntas están respondidas
        const completado = await todasPreguntasRespondidas(
          testId,
          id_usuario,
          preguntasActuales,
          respuestas
        );
        
        // Actualizar estado y fecha de última respuesta
        await prisma.test.update({
          where: { id: testId },
          data: {
            estado: determinarEstado(completado),
            fecha_ultima_respuesta: new Date()
          }
        });

      }

      return test;
    });
            
    if(testActualizado.estado=="COMPLETADO" &&  id_usuario){
              const usuarioExistente = await prisma.usuario.findUnique({
                where: { id: id_usuario }
              });
              if(usuarioExistente?.id_psicologo){
               const psicologoExistente = await prisma.usuario.findUnique({
                 where: { id: usuarioExistente?.id_psicologo }
               });
               if(psicologoExistente && usuarioExistente){
               const result_email = await  create_alarma_email({
                  id_usuario: psicologoExistente.id,
                  id_tipo_alerta: 2,
                  mensaje: `El paciente ${usuarioExistente.nombre}, completo el test.`,
                  vista: false,
                  correo_enviado: true,
                  emailParams: {
                    to: psicologoExistente.email,
                    subject: "Tienes una nueva alerta",
                    template: "test_completado",
                    props: {
                      name: psicologoExistente.nombre,
                      user_name:usuarioExistente.nombre,
                      alertMessage: `El paciente ${usuarioExistente.nombre}, completo el test.`
                    }
                  }
                });
                
                if (!result_email.emailSent) console.error('Error al enviar email, test.',result_email); 
               }else{
                console.log("No se envio correo, el usuario no tiene.");
               }
              }
    }

    // Obtener el test actualizado con relaciones
    const testCompleto = await prisma.test.findUnique({
      where: { id: testActualizado.id },
      include: {
        psicologo: {
          include: {
            usuario: true,
            redes_sociales: true
          }
        },
        usuario: true,
        preguntas: {
          include: {
            tipo: true,
            opciones: {
              orderBy: {
                orden: 'asc'
              }
            }
          },
          orderBy: {
            orden: 'asc'
          }
        },
        respuestas: {
          where: id_usuario ? { id_usuario } : undefined,
          include: {
            pregunta: true,
            opcion: true,
            usuario: true
          }
        }
      }
    });

    return NextResponse.json(testCompleto);

  } catch (error: any) {
    console.error('Error actualizando test:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto de datos únicos' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
        { error: 'ID de test es requerido' },
        { status: 400 }
      );
    }

    const testId = parseInt(id);

    // Verificar si el test existe
    const testExistente = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        preguntas: {
          include: {
            opciones: true
          }
        },
        respuestas: true
      }
    });

    if (!testExistente) {
      return NextResponse.json(
        { error: 'Test no encontrado' },
        { status: 404 }
      );
    }

    // Usar transacción para eliminar relaciones primero
    await prisma.$transaction(async (prisma) => {
      // Eliminar opciones de preguntas asociadas
      const preguntaIds = testExistente.preguntas.map(p => p.id);
      await prisma.opcion.deleteMany({
        where: { id_pregunta: { in: preguntaIds } }
      });

      // Eliminar respuestas asociadas
      await prisma.respuesta.deleteMany({
        where: { id_test: testId }
      });

      // Eliminar preguntas asociadas
      await prisma.pregunta.deleteMany({
        where: { id_test: testId }
      });

      // Finalmente eliminar el test
      await prisma.test.delete({
        where: { id: testId }
      });
    });

    return NextResponse.json(
      { message: 'Test eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando test:', error);
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

