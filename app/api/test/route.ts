import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface TestBase {
  id_psicologo?: number;
  id_usuario?: number;
  codigo_sesion?: string;
}

interface PreguntaData {
  texto_pregunta: string;
  id_tipo_input?: number;
  tipo_input_nombre?: string;
}

interface RespuestaData {
  id_pregunta: number;
  respuesta: string;
}

interface FullTestData extends TestBase {
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const codigo_sesion = searchParams.get('codigo_sesion');
    const id_usuario = searchParams.get('id_usuario');
    const id_psicologo = searchParams.get('id_psicologo');
    
    if (id) {
      // Obtener un test específico por ID
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
              tipo_input: true
            }
          },
          respuestas: {
            include: {
              pregunta: true,
              usuario: true
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
    } else if (codigo_sesion) {
      // Obtener test por código de sesión
      const test = await prisma.test.findUnique({
        where: { codigo_sesion },
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
              tipo_input: true
            }
          },
          respuestas: {
            include: {
              pregunta: true,
              usuario: true
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
    } else {
      // Obtener tests según filtros
      let whereClause: any = {};
      
      if (id_usuario) {
        whereClause.id_usuario = parseInt(id_usuario);
      }
      
      if (id_psicologo) {
        whereClause.id_psicologo = parseInt(id_psicologo);
      }

      const tests = await prisma.test.findMany({
        where: whereClause,
        include: {
          psicologo: {
            include: {
              usuario: true
            }
          },
          usuario: true,
          preguntas: {
            include: {
              tipo_input: true
            }
          },
          respuestas: {
            include: {
              pregunta: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });

      return NextResponse.json(tests);
    }
  } catch (error: any) {
    console.error('Error obteniendo tests:', error);
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
    const { 
      id_psicologo,
      id_usuario,
      codigo_sesion,
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
    if (codigo_sesion) {
      const codigoExistente = await prisma.test.findFirst({
        where: { codigo_sesion }
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
      // Crear nuevo test
      const nuevoTest = await prisma.test.create({
        data: {
          id_psicologo,
          id_usuario,
          codigo_sesion
        }
      });

      // Procesar preguntas si existen
      if (preguntas && preguntas.length > 0) {
        for (const preguntaData of preguntas) {
          let tipoInputId = preguntaData.id_tipo_input;
          
          // Si se proporciona nombre de tipo input pero no ID, buscarlo o crearlo
          if (preguntaData.tipo_input_nombre && !tipoInputId) {
            const tipoInput = await prisma.tipoInput.upsert({
              where: { nombre: preguntaData.tipo_input_nombre },
              create: { 
                nombre: preguntaData.tipo_input_nombre 
              },
              update: {}
            });
            
            tipoInputId = tipoInput.id;
          }

          await prisma.pregunta.create({
            data: {
              id_test: nuevoTest.id,
              id_tipo_input: tipoInputId,
              texto_pregunta: preguntaData.texto_pregunta
            }
          });
        }
      }

      // Procesar respuestas si existen
      if (respuestas && respuestas.length > 0) {
        for (const respuestaData of respuestas) {
          await prisma.respuestaTest.create({
            data: {
              id_test: nuevoTest.id,
              id_pregunta: respuestaData.id_pregunta,
              id_usuario,
              respuesta: respuestaData.respuesta
            }
          });
        }
      }

      return nuevoTest;
    });

    // Obtener el test completo con sus relaciones para la respuesta
    const testCompleto = await prisma.test.findUnique({
      where: { id: result.id },
      include: {
        psicologo: {
          include: {
            usuario: true
          }
        },
        usuario: true,
        preguntas: {
          include: {
            tipo_input: true
          }
        },
        respuestas: {
          include: {
            pregunta: true,
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
      id_psicologo,
      id_usuario,
      codigo_sesion,
      preguntas,
      respuestas
    }: FullTestData & { id: number } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de test es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el test existe
    const testExistente = await prisma.test.findUnique({
      where: { id },
      include: {
        preguntas: true,
        respuestas: true
      }
    });

    if (!testExistente) {
      return NextResponse.json(
        { error: 'Test no encontrado' },
        { status: 404 }
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
    if (codigo_sesion && codigo_sesion !== testExistente.codigo_sesion) {
      const codigoExistente = await prisma.test.findFirst({
        where: { 
          codigo_sesion,
          NOT: { id }
        }
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: 'El código de sesión ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Usar transacción para múltiples operaciones
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar test
      const testActualizado = await prisma.test.update({
        where: { id },
        data: {
          id_psicologo,
          id_usuario,
          codigo_sesion
        }
      });

      // Procesar preguntas si se proporcionan
      if (preguntas) {
        // Eliminar preguntas existentes
        await prisma.pregunta.deleteMany({
          where: { id_test: id }
        });

        // Crear nuevas preguntas
        if (preguntas.length > 0) {
          for (const preguntaData of preguntas) {
            let tipoInputId = preguntaData.id_tipo_input;
            
            // Si se proporciona nombre de tipo input pero no ID, buscarlo o crearlo
            if (preguntaData.tipo_input_nombre && !tipoInputId) {
              const tipoInput = await prisma.tipoInput.upsert({
                where: { nombre: preguntaData.tipo_input_nombre },
                create: { 
                  nombre: preguntaData.tipo_input_nombre 
                },
                update: {}
              });
              
              tipoInputId = tipoInput.id;
            }

            await prisma.pregunta.create({
              data: {
                id_test: id,
                id_tipo_input: tipoInputId,
                texto_pregunta: preguntaData.texto_pregunta
              }
            });
          }
        }
      }

      // Procesar respuestas si se proporcionan
      if (respuestas) {
        // Eliminar respuestas existentes
        await prisma.respuestaTest.deleteMany({
          where: { id_test: id }
        });

        // Crear nuevas respuestas
        if (respuestas.length > 0) {
          for (const respuestaData of respuestas) {
            await prisma.respuestaTest.create({
              data: {
                id_test: id,
                id_pregunta: respuestaData.id_pregunta,
                id_usuario,
                respuesta: respuestaData.respuesta
              }
            });
          }
        }
      }

      return testActualizado;
    });

    // Obtener el test actualizado con sus relaciones
    const testCompleto = await prisma.test.findUnique({
      where: { id: result.id },
      include: {
        psicologo: {
          include: {
            usuario: true
          }
        },
        usuario: true,
        preguntas: {
          include: {
            tipo_input: true
          }
        },
        respuestas: {
          include: {
            pregunta: true,
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
        { error: 'El código de sesión ya está en uso' },
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
        { error: 'ID de test es requerido' },
        { status: 400 }
      );
    }

    const testId = parseInt(id);

    // Verificar si el test existe
    const testExistente = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        preguntas: true,
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
      // Eliminar respuestas asociadas
      await prisma.respuestaTest.deleteMany({
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
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}