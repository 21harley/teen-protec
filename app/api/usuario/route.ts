import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";
import crypto from 'crypto';

interface EncryptedData {
  iv: string;
  contenido: string;
}

// Configuración de Prisma
const prisma = new PrismaClient()

// Configuración de encriptación
const algoritmo = 'aes-256-cbc';
const rawEncryptionKey: string = process.env.ENCRYPTION_KEY || '';
const claveEncriptacion = crypto.createHash('sha256').update(rawEncryptionKey).digest('base64').substr(0, 32);
const iv: Buffer = crypto.randomBytes(16);

// Tipos para los datos
interface UsuarioBase {
  email: string;
  password: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  id_tipo_usuario: number;
}

interface TutorData {
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
}

interface PsicologoData {
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: { nombre_red: string; url_perfil: string }[];
}

// Tipos de registro
type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo';

// Funciones de utilidad
function encriptar(texto: string): EncryptedData {
  try {
    const cipher = crypto.createCipheriv(algoritmo, claveEncriptacion, iv);
    let encriptado = cipher.update(texto, 'utf8', 'hex');
    encriptado += cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      contenido: encriptado,
    };
  } catch (error) {
    console.error('Error encriptando contraseña:', error);
    throw new Error('Error al encriptar la contraseña');
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo') as TipoRegistro | null;
    
    if (id) {
      // Obtener un usuario específico
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          tipo_usuario: true,
          adolecente: {
            include: {
              tutor: true
            }
          },
          psicologo: {
            include: {
              redes_sociales: true
            }
          }
        }
      });

      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(usuario);
    } else {
      // Obtener usuarios según tipo si se especifica
      let whereClause = {};
      
      if (tipo === 'adolescente') {
        whereClause = { adolecente: { isNot: null } };
      } else if (tipo === 'psicologo') {
        whereClause = { psicologo: { isNot: null } };
      } else if (tipo === 'usuario') {
        whereClause = {
          AND: [
            { adolecente: { is: null } },
            { psicologo: { is: null } }
          ]
        };
      }

      const usuarios = await prisma.usuario.findMany({
        where: whereClause,
        include: {
          tipo_usuario: true,
          adolecente: {
            include: {
              tutor: true
            }
          },
          psicologo: {
            include: {
              redes_sociales: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });

      return NextResponse.json(usuarios);
    }
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
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
      tipoRegistro,
      usuarioData, 
      tutorData, 
      psicologoData 
    }: { 
      tipoRegistro: TipoRegistro,
      usuarioData: UsuarioBase, 
      tutorData?: TutorData, 
      psicologoData?: PsicologoData 
    } = await request.json();

    // Validación básica
    if (!usuarioData.email || !usuarioData.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de registro
    if (!['usuario', 'adolescente', 'psicologo'].includes(tipoRegistro)) {
      return NextResponse.json(
        { error: 'Tipo de registro no válido' },
        { status: 400 }
      );
    }

    // Validar datos adicionales según tipo de registro
    if (tipoRegistro === 'adolescente' && !tutorData) {
      return NextResponse.json(
        { error: 'Datos del tutor son requeridos para registro de adolescente' },
        { status: 400 }
      );
    }

    if (tipoRegistro === 'psicologo' && !psicologoData) {
      return NextResponse.json(
        { error: 'Datos profesionales son requeridos para registro de psicólogo' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { 
        OR: [
          { email: usuarioData.email },
          { cedula: usuarioData.cedula }
        ]
      }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }

    // Encriptar la contraseña
    const contraseñaEncriptada: EncryptedData = encriptar(usuarioData.password);

    // Determinar el tipo de usuario según el tipo de registro
    let idTipoUsuario = usuarioData.id_tipo_usuario;
    if (!idTipoUsuario) {
      if (tipoRegistro === 'psicologo') idTipoUsuario = 2; // Asumiendo que 2 es para psicólogos
      else if (tipoRegistro === 'adolescente') idTipoUsuario = 3; // Asumiendo que 3 es para adolescentes
      else idTipoUsuario = 1; // Usuario básico
    }

    // Crear transacción para asegurar la integridad de los datos
    const result = await prisma.$transaction(async (prisma) => {
      // Crear nuevo usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          password: contraseñaEncriptada.contenido,
          cedula: usuarioData.cedula,
          fecha_nacimiento: new Date(usuarioData.fecha_nacimiento),
          id_tipo_usuario: idTipoUsuario,
          password_iv: contraseñaEncriptada.iv
        }
      });

      // Procesar según tipo de registro
      switch (tipoRegistro) {
        case 'adolescente':
          if (!tutorData) throw new Error('Datos del tutor son requeridos');
          
          const tutor = await prisma.tutor.create({
            data: {
              cedula: usuarioData.cedula,
              nombre: usuarioData.nombre,
              profesion_tutor: tutorData.profesion_tutor,
              telefono_contacto: tutorData.telefono_contacto,
              correo_contacto: tutorData.correo_contacto
            }
          });

          await prisma.adolecente.create({
            data: {
              id_usuario: nuevoUsuario.id,
              id_tutor: tutor.id
            }
          });
          break;

        case 'psicologo':
          if (!psicologoData) throw new Error('Datos profesionales son requeridos');
          
          const psicologo = await prisma.psicologo.create({
            data: {
              id_usuario: nuevoUsuario.id,
              numero_de_titulo: psicologoData.numero_de_titulo,
              nombre_universidad: psicologoData.nombre_universidad,
              monto_consulta: psicologoData.monto_consulta,
              telefono_trabajo: psicologoData.telefono_trabajo
            }
          });

          // Agregar redes sociales si existen
          if (psicologoData.redes_sociales && psicologoData.redes_sociales.length > 0) {
            await prisma.redSocialPsicologo.createMany({
              data: psicologoData.redes_sociales.map(red => ({
                id_psicologo: psicologo.id_usuario,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              }))
            });
          }
          break;

        case 'usuario':
          // No se necesita hacer nada adicional para usuario básico
          break;
      }

      return nuevoUsuario;
    });

    // Obtener el usuario con sus relaciones para la respuesta
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: {
            tutor: true
          }
        },
        psicologo: {
          include: {
            redes_sociales: true
          }
        }
      }
    });

    return NextResponse.json(usuarioCompleto, { status: 201 });

  } catch (error: any) {
    console.error('Error creando usuario:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
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
      tipoRegistro,
      usuarioData, 
      tutorData, 
      psicologoData 
    }: { 
      id: number,
      tipoRegistro?: TipoRegistro,
      usuarioData: Partial<UsuarioBase>, 
      tutorData?: TutorData, 
      psicologoData?: PsicologoData 
    } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
      include: {
        adolecente: {
          include: {
            tutor: true
          }
        },
        psicologo: {
          include: {
            redes_sociales: true
          }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Determinar el tipo de registro actual si no se especifica
    const currentType = usuarioExistente.psicologo ? 'psicologo' : 
                       usuarioExistente.adolecente ? 'adolescente' : 'usuario';

    const registroActual = tipoRegistro || currentType;

    // Preparar datos de actualización
    const datosActualizacion: any = {
      nombre: usuarioData.nombre,
      cedula: usuarioData.cedula,
      fecha_nacimiento: usuarioData.fecha_nacimiento ? new Date(usuarioData.fecha_nacimiento) : undefined,
      id_tipo_usuario: usuarioData.id_tipo_usuario
    };

    // Actualizar contraseña si se proporciona
    if (usuarioData.password) {
      const contraseñaEncriptada: EncryptedData = encriptar(usuarioData.password);
      datosActualizacion.password = contraseñaEncriptada.contenido;
      datosActualizacion.password_iv = contraseñaEncriptada.iv;
    }

    // Usar transacción para múltiples operaciones
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: datosActualizacion
      });

      // Procesar según tipo de registro
      switch (registroActual) {
        case 'adolescente':
          if (!usuarioExistente.adolecente) {
            if (!tutorData) {
              throw new Error('Datos del tutor son requeridos para convertir usuario a adolescente');
            }
            
            // Crear nuevo tutor y relación adolescente
            const tutor = await prisma.tutor.create({
              data: {
                cedula: usuarioData.cedula || usuarioExistente.cedula,
                nombre: usuarioData.nombre || usuarioExistente.nombre,
                profesion_tutor: tutorData.profesion_tutor,
                telefono_contacto: tutorData.telefono_contacto,
                correo_contacto: tutorData.correo_contacto
              }
            });

            await prisma.adolecente.create({
              data: {
                id_usuario: id,
                id_tutor: tutor.id
              }
            });
          } else if (tutorData) {
            // Actualizar tutor existente
            await prisma.tutor.update({
              where: { id: usuarioExistente.adolecente.id_tutor || undefined },
              data: {
                profesion_tutor: tutorData.profesion_tutor,
                telefono_contacto: tutorData.telefono_contacto,
                correo_contacto: tutorData.correo_contacto
              }
            });
          }
          break;

        case 'psicologo':
          if (!usuarioExistente.psicologo) {
            if (!psicologoData) {
              throw new Error('Datos profesionales son requeridos para convertir usuario a psicólogo');
            }
            
            // Crear nuevo psicólogo
            const psicologo = await prisma.psicologo.create({
              data: {
                id_usuario: id,
                numero_de_titulo: psicologoData.numero_de_titulo,
                nombre_universidad: psicologoData.nombre_universidad,
                monto_consulta: psicologoData.monto_consulta,
                telefono_trabajo: psicologoData.telefono_trabajo
              }
            });

            // Agregar redes sociales si existen
            if (psicologoData.redes_sociales && psicologoData.redes_sociales.length > 0) {
              await prisma.redSocialPsicologo.createMany({
                data: psicologoData.redes_sociales.map(red => ({
                  id_psicologo: id,
                  nombre_red: red.nombre_red,
                  url_perfil: red.url_perfil
                }))
              });
            }
          } else if (psicologoData) {
            // Actualizar psicólogo existente
            await prisma.psicologo.update({
              where: { id_usuario: id },
              data: {
                numero_de_titulo: psicologoData.numero_de_titulo,
                nombre_universidad: psicologoData.nombre_universidad,
                monto_consulta: psicologoData.monto_consulta,
                telefono_trabajo: psicologoData.telefono_trabajo
              }
            });

            // Actualizar redes sociales si se proporcionan
            if (psicologoData.redes_sociales) {
              // Eliminar redes existentes
              await prisma.redSocialPsicologo.deleteMany({
                where: { id_psicologo: id }
              });

              // Crear nuevas redes
              if (psicologoData.redes_sociales.length > 0) {
                await prisma.redSocialPsicologo.createMany({
                  data: psicologoData.redes_sociales.map(red => ({
                    id_psicologo: id,
                    nombre_red: red.nombre_red,
                    url_perfil: red.url_perfil
                  }))
                });
              }
            }
          }
          break;

        case 'usuario':
          // Si el usuario era psicólogo o adolescente, eliminar esas relaciones
          if (usuarioExistente.psicologo) {
            await prisma.redSocialPsicologo.deleteMany({
              where: { id_psicologo: id }
            });
            await prisma.psicologo.delete({
              where: { id_usuario: id }
            });
          }

          if (usuarioExistente.adolecente) {
            const tutorId = usuarioExistente.adolecente.id_tutor;
            await prisma.adolecente.delete({
              where: { id_usuario: id }
            });

            // Eliminar tutor si no está asociado a otros adolescentes
            const otrosAdolescentes = await prisma.adolecente.count({
              where: { id_tutor: tutorId }
            });

            if (otrosAdolescentes === 0) {
              await prisma.tutor.delete({
                where: { id: tutorId || undefined }
              });
            }
          }
          break;
      }

      return usuarioActualizado;
    });

    // Obtener el usuario actualizado con sus relaciones
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: {
            tutor: true
          }
        },
        psicologo: {
          include: {
            redes_sociales: true
          }
        }
      }
    });

    return NextResponse.json(usuarioCompleto);

  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
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
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        adolecente: {
          include: {
            tutor: true
          }
        },
        psicologo: {
          include: {
            redes_sociales: true
          }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Usar transacción para eliminar relaciones primero
    await prisma.$transaction(async (prisma) => {
      // Eliminar adolescente si existe
      if (usuarioExistente.adolecente) {
        await prisma.adolecente.delete({
          where: { id_usuario: usuarioExistente.id }
        });

        // Eliminar tutor si no está asociado a otros adolescentes
        const tutorId = usuarioExistente.adolecente.id_tutor;
        if (tutorId) {
          const otrosAdolescentes = await prisma.adolecente.count({
            where: { id_tutor: tutorId }
          });

          if (otrosAdolescentes === 0) {
            await prisma.tutor.delete({
              where: { id: tutorId }
            });
          }
        }
      }

      // Eliminar psicólogo si existe
      if (usuarioExistente.psicologo) {
        await prisma.redSocialPsicologo.deleteMany({
          where: { id_psicologo: usuarioExistente.id }
        });

        await prisma.psicologo.delete({
          where: { id_usuario: usuarioExistente.id }
        });
      }

      // Finalmente eliminar el usuario
      await prisma.usuario.delete({
        where: { id: usuarioExistente.id }
      });
    });

    return NextResponse.json(
      { message: 'Usuario eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}