import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";

const prisma = new PrismaClient()

enum TestStatus {
  NoIniciado = 'no_iniciado',
  EnProgreso = 'en_progreso',
  Completado = 'completado'
}

interface TestPlantillaBase {
  id_psicologo?: number;
  nombre?: string;
  estado?: TestStatus;
  fecha_creacion?: Date | string;
}

interface PreguntaPlantillaData {
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionPlantillaData[];
}

interface OpcionPlantillaData {
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

interface FullTestPlantillaData extends TestPlantillaBase {
  preguntas?: PreguntaPlantillaData[];
}

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
    const id_psicologo = searchParams.get('id_psicologo');
    const estado = searchParams.get('estado') as TestStatus | null;
    const search = searchParams.get('search');
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    
    // Si hay un ID específico, devolver esa plantilla sin paginación
    if (id) {
      const plantilla = await prisma.testPlantilla.findUnique({
        where: { id: parseInt(id) },
        include: {
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
          }
        }
      });

      if (!plantilla) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(plantilla);
    }
    
    // Si hay un nombre específico, devolver esa plantilla sin paginación
    if (nombre) {
      const plantilla = await prisma.testPlantilla.findFirst({
        where: { nombre },
        include: {
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
          }
        }
      });

      if (!plantilla) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(plantilla);
    }
    
    // Construir cláusula WHERE para los filtros
    let whereClause: any = {};
    
    // Filtros básicos
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
          psicologo: {
            usuario: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
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
        }
      ];
    }

    // Obtener el total de plantillas que coinciden con los filtros
    const total = await prisma.testPlantilla.count({
      where: whereClause
    });

    // Calcular el total de páginas
    const totalPages = Math.ceil(total / pageSize);

    // Obtener las plantillas paginadas
    const plantillas = await prisma.testPlantilla.findMany({
      where: whereClause,
      include: {
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
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      },
      skip,
      take: pageSize
    });

    // Construir respuesta paginada
    const paginatedResponse: PaginatedResponse = {
      data: plantillas,
      total,
      page,
      pageSize,
      totalPages
    };

    return NextResponse.json(paginatedResponse);
  } catch (error: any) {
    console.error('Error obteniendo plantillas:', error);
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
      nombre,
      estado,
      fecha_creacion,
      preguntas
    }: FullTestPlantillaData = await request.json();

    // Validación básica
    if (!id_psicologo) {
      return NextResponse.json(
        { error: 'Se requiere un psicólogo asociado a la plantilla' },
        { status: 400 }
      );
    }

    // Verificar que el psicólogo existe
    const psicologoExistente = await prisma.psicologo.findUnique({
      where: { id_usuario: id_psicologo }
    });

    if (!psicologoExistente) {
      return NextResponse.json(
        { error: 'Psicólogo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar nombre único si se proporciona
    if (nombre) {
      const nombreExistente = await prisma.testPlantilla.findFirst({
        where: { nombre, id_psicologo }
      });

      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Ya existe una plantilla con este nombre para este psicólogo' },
          { status: 409 }
        );
      }
    }

    // Crear transacción para asegurar la integridad de los datos
    const result = await prisma.$transaction(async (prisma) => {
      // Crear nueva plantilla
      const nuevaPlantilla = await prisma.testPlantilla.create({
        data: {
          id_psicologo,
          nombre: nombre ?? '',
          estado: estado || TestStatus.NoIniciado,
          fecha_creacion: fecha_creacion ? new Date(fecha_creacion) : new Date()
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

          const preguntaCreada = await prisma.preguntaPlantilla.create({
            data: {
              id_test: nuevaPlantilla.id,
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
              await prisma.opcionPlantilla.create({
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

      return nuevaPlantilla;
    });

    // Obtener la plantilla completa con sus relaciones para la respuesta
    const plantillaCompleta = await prisma.testPlantilla.findUnique({
      where: { id: result.id },
      include: {
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
        }
      }
    });

    return NextResponse.json(plantillaCompleta, { status: 201 });

  } catch (error: any) {
    console.error('Error creando plantilla:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto de datos únicos (nombre de plantilla ya existe)' },
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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de plantilla es requerido' },
        { status: 400 }
      );
    }

    const plantillaId = parseInt(id);
    const { 
      id_psicologo,
      nombre,
      estado,
      preguntas
    }: FullTestPlantillaData = await request.json();

    // Verificar si la plantilla existe
    const plantillaExistente = await prisma.testPlantilla.findUnique({
      where: { id: plantillaId },
      include: {
        preguntas: {
          include: {
            tipo: true,
            opciones: true
          }
        }
      }
    });

    if (!plantillaExistente) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
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

    // Validación de nombre único (si se cambia)
    if (nombre && nombre !== plantillaExistente.nombre) {
      const nombreExistente = await prisma.testPlantilla.findFirst({
        where: { 
          nombre, 
          id_psicologo: id_psicologo || plantillaExistente.id_psicologo,
          NOT: { id: plantillaId } 
        }
      });
      if (nombreExistente) {
        return NextResponse.json(
          { error: 'El nombre de la plantilla ya está en uso para este psicólogo' },
          { status: 409 }
        );
      }
    }

    // Usar transacción para operaciones atómicas
    const plantillaActualizada = await prisma.$transaction(async (prisma) => {
      // Actualizar datos básicos de la plantilla
      const plantilla = await prisma.testPlantilla.update({
        where: { id: plantillaId },
        data: {
          id_psicologo: id_psicologo !== undefined ? id_psicologo : plantillaExistente.id_psicologo,
          nombre: nombre !== undefined ? nombre : plantillaExistente.nombre,
          estado: estado !== undefined ? estado : plantillaExistente.estado
        }
      });

      // Procesar actualización de preguntas si se proporcionan
      if (preguntas) {
        // Primero eliminar opciones de preguntas existentes
        await prisma.opcionPlantilla.deleteMany({
          where: { 
            id_pregunta: { 
              in: plantillaExistente.preguntas.map(p => p.id) 
            } 
          }
        });
        
        // Luego eliminar las preguntas existentes
        await prisma.preguntaPlantilla.deleteMany({
          where: { id_test: plantillaId }
        });

        // Crear nuevas preguntas
        for (const preguntaData of preguntas) {
          const tipoPregunta = await prisma.tipoPregunta.findUnique({
            where: { id: preguntaData.id_tipo }
          });

          if (!tipoPregunta) {
            throw new Error(`Tipo de pregunta con ID ${preguntaData.id_tipo} no encontrado`);
          }

          const preguntaCreada = await prisma.preguntaPlantilla.create({
            data: {
              id_test: plantillaId,
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
              await prisma.opcionPlantilla.create({
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

      return plantilla;
    });

    // Obtener la plantilla actualizada con relaciones
    const plantillaCompleta = await prisma.testPlantilla.findUnique({
      where: { id: plantillaActualizada.id },
      include: {
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
        }
      }
    });

    return NextResponse.json(plantillaCompleta);

  } catch (error: any) {
    console.error('Error actualizando plantilla:', error);
    
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
        { error: 'ID de plantilla es requerido' },
        { status: 400 }
      );
    }

    const plantillaId = parseInt(id);

    // Verificar si la plantilla existe
    const plantillaExistente = await prisma.testPlantilla.findUnique({
      where: { id: plantillaId },
      include: {
        preguntas: {
          include: {
            opciones: true
          }
        }
      }
    });

    if (!plantillaExistente) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Usar transacción para eliminar relaciones primero
    await prisma.$transaction(async (prisma) => {
      // Eliminar opciones de preguntas asociadas
      const preguntaIds = plantillaExistente.preguntas.map(p => p.id);
      await prisma.opcionPlantilla.deleteMany({
        where: { id_pregunta: { in: preguntaIds } }
      });

      // Eliminar preguntas asociadas
      await prisma.preguntaPlantilla.deleteMany({
        where: { id_test: plantillaId }
      });

      // Finalmente eliminar la plantilla
      await prisma.testPlantilla.delete({
        where: { id: plantillaId }
      });
    });

    return NextResponse.json(
      { message: 'Plantilla eliminada correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando plantilla:', error);
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