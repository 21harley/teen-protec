import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";

const prisma = new PrismaClient()

enum TestStatus {
  NoIniciado = 'no_iniciado',
  EnProgreso = 'en_progreso',
  Completado = 'completado'
}

interface TestBase {
  id_psicologo?: number;
  id_usuario?: number;
  nombre?: string;
  estado?: TestStatus;
  progreso?: number;
  fecha_creacion?: Date | string;
  fecha_ultima_respuesta?: Date | string;
}

interface PreguntaData {
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionData[];
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

interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper mejorado para calcular progreso
async function calcularProgreso(testId: number, usuarioId?: number): Promise<number> {
  try {
    // Obtener todas las preguntas con sus tipos
    const preguntas = await prisma.pregunta.findMany({
      where: { id_test: testId },
      include: { tipo: true }
    });
    
    if (preguntas.length === 0) {
      console.log('[calcularProgreso] No hay preguntas para este test');
      return 0;
    }
    
    // Obtener todas las respuestas
    const whereClause = usuarioId ? 
      { id_test: testId, id_usuario: usuarioId } : 
      { id_test: testId };
    
    const respuestas = await prisma.respuesta.findMany({
      where: whereClause
    });

    console.log(`[calcularProgreso] Preguntas: ${preguntas.length}, Respuestas encontradas: ${respuestas.length}`);
    
    // Agrupar respuestas por pregunta
    const respuestasPorPregunta: Record<number, any[]> = {};
    respuestas.forEach(r => {
      if (!respuestasPorPregunta[r.id_pregunta]) {
        respuestasPorPregunta[r.id_pregunta] = [];
      }
      respuestasPorPregunta[r.id_pregunta].push(r);
    });

    console.log(`[calcularProgreso] Preguntas con respuestas: ${Object.keys(respuestasPorPregunta).length}`);
    
    // Contar preguntas válidamente respondidas
    let respondidas = 0;
    
    for (const pregunta of preguntas) {
      const respuestasPreg = respuestasPorPregunta[pregunta.id] || [];
      
      console.log(`[calcularProgreso] Procesando pregunta ${pregunta.id} (${pregunta.tipo.nombre}), respuestas: ${respuestasPreg.length}, obligatoria: ${pregunta.obligatoria}`);
      
      // Verificar si está respondida adecuadamente según el tipo
      let estaRespondida = false;
      
      switch (pregunta.tipo.nombre) {
        case 'radio':
        case 'select':
          estaRespondida = respuestasPreg.some(r => r.id_opcion !== null);
          break;
        
        case 'checkbox':
          // Para checkbox, con que haya al menos una opción seleccionada cuenta como respondida
          estaRespondida = respuestasPreg.length > 0;
          break;
        
        case 'text':
          estaRespondida = respuestasPreg.some(r => 
            r.texto_respuesta && r.texto_respuesta.trim() !== ''
          );
          break;
        
        case 'range':
          estaRespondida = respuestasPreg.some(r => r.valor_rango !== null);
          break;
        
        default:
          estaRespondida = true;
      }
      
      console.log(`[calcularProgreso] Pregunta ${pregunta.id} respondida: ${estaRespondida}`);
      
      // Si es obligatoria y no está respondida, no cuenta
      if (pregunta.obligatoria && !estaRespondida) {
        console.log(`[calcularProgreso] Pregunta obligatoria ${pregunta.id} no respondida - no cuenta`);
        continue;
      }
      
      if (estaRespondida) {
        respondidas++;
        console.log(`[calcularProgreso] Pregunta ${pregunta.id} cuenta como respondida`);
      }
    }
    
    const progreso = Math.round((respondidas / preguntas.length) * 100);
    console.log(`[calcularProgreso] Progreso calculado: ${respondidas}/${preguntas.length} = ${progreso}%`);
    return progreso;
  } catch (error) {
    console.error('[calcularProgreso] Error al calcular progreso:', error);
    return 0; // En caso de error, retornar 0 para no afectar el estado actual
  }
}

// Helper mejorado para verificar si todas las preguntas están respondidas
async function todasPreguntasRespondidas(testId: number, usuarioId: number): Promise<boolean> {
  // Obtener todas las preguntas obligatorias
  const preguntasObligatorias = await prisma.pregunta.findMany({
    where: { 
      id_test: testId,
      obligatoria: true 
    },
    include: {
      tipo: true
    }
  });

  if (preguntasObligatorias.length === 0) {
    console.log('[todasPreguntasRespondidas] No hay preguntas obligatorias - considerando como completado');
    return true;
  }

  // Obtener todas las respuestas válidas agrupadas por pregunta
  const respuestasValidas = await prisma.respuesta.groupBy({
    by: ['id_pregunta'],
    where: { 
      id_test: testId,
      id_usuario: usuarioId,
      OR: [
        { texto_respuesta: { not: null } },
        { valor_rango: { not: null } },
        { id_opcion: { not: null } }
      ]
    }
  });

  console.log('[todasPreguntasRespondidas] Preguntas obligatorias:', preguntasObligatorias.map(p => p.id));
  console.log('[todasPreguntasRespondidas] Preguntas respondidas:', respuestasValidas.map(r => r.id_pregunta));

  // Verificar que todas las preguntas obligatorias estén respondidas
  const todasObligatoriasRespondidas = preguntasObligatorias.every(pregunta => {
    const tieneRespuesta = respuestasValidas.some(respuesta => respuesta.id_pregunta === pregunta.id);
    
    if (!tieneRespuesta) {
      console.log(`[todasPreguntasRespondidas] Pregunta obligatoria ${pregunta.id} no tiene respuesta`);
    }
    
    return tieneRespuesta;
  });

  console.log(`[todasPreguntasRespondidas] Todas obligatorias respondidas: ${todasObligatoriasRespondidas}`);
  return todasObligatoriasRespondidas;
}

// Helper para determinar estado basado en progreso
// Función auxiliar para determinar estado
function determinarEstado(progreso: number, todasRespondidas: boolean): TestStatus {
  console.log(`[determinarEstado] Progreso: ${progreso}, TodasRespondidas: ${todasRespondidas}`);
  
  if (progreso === 100 || todasRespondidas) {
    return TestStatus.Completado;
  }
  if (progreso === 0) {
    return TestStatus.NoIniciado;
  }
  return TestStatus.EnProgreso;
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
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    
    // Si hay un ID específico, devolver ese test sin paginación
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
            orderBy: {
              orden: 'asc'
            }
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
        return NextResponse.json(
          { error: 'Test no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(test);
    }
    
    // Si hay un código de sesión específico, devolver ese test sin paginación
    if (nombre) {
      const test = await prisma.test.findFirst({
        where: { nombre },
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
            orderBy: {
              orden: 'asc'
            }
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
        return NextResponse.json(
          { error: 'Test no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(test);
    }
    
    // Lógica especial para psicólogas
    if (es_psicologa && id_usuario) {
      // Verificar que el usuario es realmente psicóloga
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id_usuario) },
        include: { psicologo: true }
      });

      if (!usuario || !usuario.psicologo) {
        return NextResponse.json(
          { error: 'El usuario no tiene permisos de psicóloga' },
          { status: 403 }
        );
      }

      // Construir cláusula WHERE para psicóloga
      let whereClause: any = {
        id_psicologo: usuario.psicologo.id_usuario
      };
      
      // Aplicar filtros adicionales
      if (estado) whereClause.estado = estado;
      if (search) {
        whereClause.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          {
            usuario: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        ];
      }
      
      // Filtro por rango de fechas
      if (fecha_inicio || fecha_fin) {
        whereClause.fecha_creacion = {};
        if (fecha_inicio) whereClause.fecha_creacion.gte = new Date(fecha_inicio);
        if (fecha_fin) whereClause.fecha_creacion.lte = new Date(fecha_fin);
      }

      // Obtener el total de tests para paginación
      const total = await prisma.test.count({ where: whereClause });
      const totalPages = Math.ceil(total / pageSize);

      // Obtener tests con relaciones completas
      const tests = await prisma.test.findMany({
        where: whereClause,
        include: {
          usuario: true,
          psicologo: {
            include: {
              usuario: true
            }
          },
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
        },
        orderBy: {
          fecha_creacion: 'desc'
        },
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
    }
    
    // Construir cláusula WHERE para los filtros normales
    let whereClause: any = {};
    
    // Filtros básicos
    if (id_usuario) whereClause.id_usuario = parseInt(id_usuario);
    if (id_psicologo) whereClause.id_psicologo = parseInt(id_psicologo);
    if (estado) whereClause.estado = estado;
    
    // Filtro por rango de fechas
    if (fecha_inicio || fecha_fin) {
      whereClause.fecha_creacion = {};
      if (fecha_inicio) whereClause.fecha_creacion.gte = new Date(fecha_inicio);
      if (fecha_fin) whereClause.fecha_creacion.lte = new Date(fecha_fin);
    }
    
    // Búsqueda textual
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        {
          usuario: {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { cedula: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          psicologo: {
            usuario: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cedula: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          preguntas: {
            some: {
              texto_pregunta: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          respuestas: {
            some: {
              OR: [
                { texto_respuesta: { contains: search, mode: 'insensitive' } },
                {
                  opcion: {
                    texto: { contains: search, mode: 'insensitive' }
                  }
                }
              ]
            }
          }
        }
      ];
    }

    // Obtener el total de tests que coinciden con los filtros
    const total = await prisma.test.count({
      where: whereClause
    });

    // Calcular el total de páginas
    const totalPages = Math.ceil(total / pageSize);

    // Obtener los tests paginados
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
            opcion: true
          }
        }
      },
      orderBy: {
        fecha_ultima_respuesta: 'desc'
      },
      skip,
      take: pageSize
    });

    // Construir respuesta paginada
    const paginatedResponse: PaginatedResponse = {
      data: tests,
      total,
      page,
      pageSize,
      totalPages
    };

    return NextResponse.json(paginatedResponse);
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
      progreso,
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

    // Validar progreso si se proporciona
    if (progreso !== undefined && (progreso < 0 || progreso > 100)) {
      return NextResponse.json(
        { error: 'El progreso debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    // Verificar que el psicólogo existe si se proporciona
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

    // Verificar código de sesión único si se proporciona
    if (nombre) {
      const codigoExistente = await prisma.test.findFirst({
        where: { nombre }
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: 'El código de sesión ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Crear transacción para asegurar la integridad de los datos
    const result = await prisma.$transaction(async (prisma) => {
      // Calcular progreso inicial si hay respuestas
      const progresoInicial = respuestas && respuestas.length > 0 ? 
        await calcularProgreso(0, id_usuario) : 0;
      
      // Determinar estado inicial
      const estadoInicial = estado || determinarEstado(progresoInicial, false);

      // Crear nuevo test
      const nuevoTest = await prisma.test.create({
        data: {
          id_psicologo,
          id_usuario,
          nombre,
          estado: estadoInicial,
          progreso: progreso || progresoInicial,
          fecha_creacion: fecha_creacion ? new Date(fecha_creacion) : new Date(),
          fecha_ultima_respuesta: fecha_ultima_respuesta ? new Date(fecha_ultima_respuesta) : new Date()
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

        // Actualizar progreso y estado después de agregar respuestas
        const nuevoProgreso = await calcularProgreso(nuevoTest.id, id_usuario);
        const completado = await todasPreguntasRespondidas(nuevoTest.id, id_usuario!);
        
        await prisma.test.update({
          where: { id: nuevoTest.id },
          data: {
            progreso: nuevoProgreso,
            estado: determinarEstado(nuevoProgreso, completado),
            fecha_ultima_respuesta: new Date()
          }
        });
      }

      return nuevoTest;
    });

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
        { error: 'Conflicto de datos únicos (código de sesión ya existe)' },
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

function delay(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      preguntas,
      respuestas
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

    // Usar transacción para operaciones atómicas
    const testActualizado = await prisma.$transaction(async (prisma) => {
      // Actualizar datos básicos del test
      const test = await prisma.test.update({
        where: { id: testId },
        data: {
          id_psicologo: id_psicologo !== undefined ? id_psicologo : testExistente.id_psicologo,
          id_usuario: id_usuario !== undefined ? id_usuario : testExistente.id_usuario,
          nombre: nombre !== undefined ? nombre : testExistente.nombre,
          estado: estado !== undefined ? estado : testExistente.estado
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
        
        console.log(`[calcularProgreso] Consulta`);
        delay(1000)
        // Calcular progreso y estado
        const nuevoProgreso = await calcularProgreso(testId, id_usuario);
        const completado = await todasPreguntasRespondidas(testId, id_usuario);
        
        await prisma.test.update({
          where: { id: testId },
          data: {
            progreso: nuevoProgreso,
            estado: determinarEstado(nuevoProgreso, completado),
            fecha_ultima_respuesta: new Date()
          }
        });
      }

      return test;
    });

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