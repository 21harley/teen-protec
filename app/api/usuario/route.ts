import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";
import { encriptar, generarTokenExpiry } from "@/app/lib/crytoManager";
import { cookies } from 'next/headers';
import crypto from 'crypto';

interface EncryptedData {
  iv: string;
  contenido: string;
}

const prisma = new PrismaClient();

// Tipos para los datos
interface UsuarioBase {
  email: string;
  password?: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  id_tipo_usuario?: number;
}

interface TutorData {
  cedula_tutor?: string;
  nombre_tutor?: string;
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

type TipoRegistro = 'usuario' | 'adolescente' | 'psicologo';

// GET - Obtener usuarios
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo') as TipoRegistro | null;
    
    if (id) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          tipo_usuario: true,
          adolecente: {
            include: { tutor: true }
          },
          psicologo: {
            include: { redes_sociales: true }
          }
        }
      });

      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // No devolver información sensible
      const { password, password_iv, authToken, authTokenExpiry, ...safeUser } = usuario;
      return NextResponse.json(safeUser);
    } else {
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
            include: { tutor: true }
          },
          psicologo: {
            include: { redes_sociales: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      // Filtrar datos sensibles
      const safeUsers = usuarios.map(({ password, password_iv, authToken, authTokenExpiry, ...user }) => user);
      return NextResponse.json(safeUsers);
    }
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Crear usuario
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

    // Validaciones básicas
    if (!usuarioData.email || !usuarioData.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!['usuario', 'adolescente', 'psicologo'].includes(tipoRegistro)) {
      return NextResponse.json(
        { error: 'Tipo de registro no válido' },
        { status: 400 }
      );
    }

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

    // Verificar usuario existente
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

    // Encriptar contraseña
    const contraseñaEncriptada = encriptar(usuarioData.password!);

    // Determinar tipo de usuario
    const idTipoUsuario = usuarioData.id_tipo_usuario || 
                         (tipoRegistro === 'psicologo' ? 2 : 
                          tipoRegistro === 'adolescente' ? 3 : 1);

    // Generar token de autenticación (opcional para registro)
    const authToken = crypto.randomBytes(64).toString('hex');
    const authTokenExpiry = generarTokenExpiry();

    // Crear transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          password: contraseñaEncriptada.contenido,
          cedula: usuarioData.cedula,
          fecha_nacimiento: new Date(usuarioData.fecha_nacimiento),
          id_tipo_usuario: idTipoUsuario,
          password_iv: contraseñaEncriptada.iv,
          authToken,
          authTokenExpiry
        }
      });

      // Procesar según tipo de registro
      switch (tipoRegistro) {
        case 'adolescente':
          const tutor = await prisma.tutor.create({
            data: {
              cedula: tutorData?.cedula_tutor || usuarioData.cedula,
              nombre: tutorData?.nombre_tutor || usuarioData.nombre,
              profesion_tutor: tutorData?.profesion_tutor,
              telefono_contacto: tutorData?.telefono_contacto,
              correo_contacto: tutorData?.correo_contacto
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
          const psicologo = await prisma.psicologo.create({
            data: {
              id_usuario: nuevoUsuario.id,
              numero_de_titulo: psicologoData?.numero_de_titulo,
              nombre_universidad: psicologoData?.nombre_universidad,
              monto_consulta: psicologoData?.monto_consulta,
              telefono_trabajo: psicologoData?.telefono_trabajo
            }
          });

          if (psicologoData?.redes_sociales?.length) {
            await prisma.redSocialPsicologo.createMany({
              data: psicologoData.redes_sociales.map(red => ({
                id_psicologo: psicologo.id_usuario,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              }))
            });
          }
          break;
      }

      return nuevoUsuario;
    });

    // Configurar cookies de autenticación (opcional para registro)
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict' as const
    };

    cookieStore.set('auth-token', authToken, cookieOptions);
    cookieStore.set('auth-token-expiry', authTokenExpiry.toISOString(), cookieOptions);

    // Obtener usuario completo sin datos sensibles
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        }
      }
    });

    if (!usuarioCompleto) {
      throw new Error('Usuario no encontrado después de creación');
    }

    const { password, password_iv, authToken: _, authTokenExpiry: __, ...safeUser } = usuarioCompleto;
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error: any) {
    console.error('Error creando usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const { 
      id,
      usuarioData, 
      tutorData, 
      psicologoData 
    }: { 
      id: number,
      usuarioData: Partial<UsuarioBase>, 
      tutorData?: TutorData, 
      psicologoData?: PsicologoData 
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Verificar usuario existente
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
      include: {
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const datosActualizacion: any = {
      nombre: usuarioData.nombre,
      cedula: usuarioData.cedula,
      fecha_nacimiento: usuarioData.fecha_nacimiento ? new Date(usuarioData.fecha_nacimiento) : undefined,
      id_tipo_usuario: usuarioData.id_tipo_usuario
    };

    // Actualizar contraseña si se proporciona
    if (usuarioData.password) {
      const contraseñaEncriptada = encriptar(usuarioData.password);
      datosActualizacion.password = contraseñaEncriptada.contenido;
      datosActualizacion.password_iv = contraseñaEncriptada.iv;
    }

    // Transacción para actualización
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: datosActualizacion
      });

      // Actualizar relaciones según tipo existente
      if (usuarioExistente.adolecente && tutorData) {
        await prisma.tutor.update({
          where: { id: usuarioExistente.adolecente.id_tutor || undefined },
          data: {
            profesion_tutor: tutorData.profesion_tutor,
            telefono_contacto: tutorData.telefono_contacto,
            correo_contacto: tutorData.correo_contacto
          }
        });
      }

      if (usuarioExistente.psicologo && psicologoData) {
        await prisma.psicologo.update({
          where: { id_usuario: id },
          data: {
            numero_de_titulo: psicologoData.numero_de_titulo,
            nombre_universidad: psicologoData.nombre_universidad,
            monto_consulta: psicologoData.monto_consulta,
            telefono_trabajo: psicologoData.telefono_trabajo
          }
        });

        if (psicologoData.redes_sociales) {
          await prisma.redSocialPsicologo.deleteMany({
            where: { id_psicologo: id }
          });

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

      return usuarioActualizado;
    });

    // Obtener usuario actualizado sin datos sensibles
    const usuarioActualizado = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        }
      }
    });

    if (!usuarioActualizado) {
      throw new Error('Usuario no encontrado después de actualización');
    }

    const { password, password_iv, authToken, authTokenExpiry, ...safeUser } = usuarioActualizado;
    return NextResponse.json(safeUser);

  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Eliminar usuario
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

    // Verificar usuario existente
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Transacción para eliminación segura
    await prisma.$transaction(async (prisma) => {
      // Eliminar relaciones primero
      if (usuarioExistente.adolecente) {
        await prisma.adolecente.delete({
          where: { id_usuario: userId }
        });

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

      if (usuarioExistente.psicologo) {
        await prisma.redSocialPsicologo.deleteMany({
          where: { id_psicologo: userId }
        });

        await prisma.psicologo.delete({
          where: { id_usuario: userId }
        });
      }

      // Finalmente eliminar el usuario
      await prisma.usuario.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json(
      { message: 'Usuario eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}