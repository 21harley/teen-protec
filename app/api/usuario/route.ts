import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";
import { encriptar, EncryptedData, generarTokenExpiry } from "@/app/lib/crytoManager";
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { TipoRegistro, UsuarioBase, TutorData, PsicologoData, LoginResponse } from '../type';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo') as TipoRegistro | null;
    const includePassword = searchParams.get('includePassword') === 'true';
    const nombre = searchParams.get('nombre');
    const email = searchParams.get('email');
    const cedula = searchParams.get('cedula');
    
    // Pagination parameters
    const paginated = searchParams.get('paginated') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    
    // Get single user by ID
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

      // Si se solicita incluir la contraseña (para edición)
      if (includePassword) {
        const { authToken, authTokenExpiry, ...userWithPassword } = usuario;
        return NextResponse.json({
          ...userWithPassword,
          // Incluir la contraseña encriptada y su IV
          password: userWithPassword.password,
          password_iv: userWithPassword.password_iv
        });
      }

      // No devolver información sensible por defecto
      const { password, password_iv, authToken, authTokenExpiry, ...safeUser } = usuario;
      return NextResponse.json(safeUser);
    }
    
    // Build where clause for filters
    let whereClause: any = {};
    
    // Filter by user type
    if (tipo === 'adolescente') {
      whereClause.adolecente = { isNot: null };
    } else if (tipo === 'psicologo') {
      whereClause.psicologo = { isNot: null };
    } else if (tipo === 'usuario') {
      whereClause.AND = [
        { adolecente: { is: null } },
        { psicologo: { is: null } }
      ];
    }
    
    // Add search filters
    if (nombre) {
      whereClause.nombre = { contains: nombre, mode: 'insensitive' };
    }
    
    if (email) {
      whereClause.email = { contains: email, mode: 'insensitive' };
    }
    
    if (cedula) {
      whereClause.cedula = { contains: cedula, mode: 'insensitive' };
    }
    
    // Handle paginated requests
    if (paginated) {
      // Get total count for pagination
      const total = await prisma.usuario.count({ where: whereClause });
      const totalPages = Math.ceil(total / pageSize);
      
      // Get paginated results
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
        orderBy: { id: 'asc' },
        skip,
        take: pageSize
      });
      
      // Filter sensitive data
      const safeUsers = usuarios.map(({ password, password_iv, authToken, authTokenExpiry, ...user }) => user);
      
      return NextResponse.json({
        data: safeUsers,
        total,
        page,
        pageSize,
        totalPages
      });
    }
    
    // Non-paginated request (backward compatible)
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
    
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
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
                          tipoRegistro === 'adolescente' ? 3 : 4);

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
      tutorData?: Partial<TutorData>, 
      psicologoData?: Partial<PsicologoData> 
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
        tipo_usuario: true,
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

    // Preparar datos de actualización del usuario
    const datosActualizacion: any = {
      nombre: usuarioData.nombre,
      cedula: usuarioData.cedula,
      fecha_nacimiento: usuarioData.fecha_nacimiento ? new Date(usuarioData.fecha_nacimiento) : undefined,
      id_tipo_usuario: usuarioData.id_tipo_usuario
    };

    // Actualizar contraseña solo si se proporciona una nueva
    if (usuarioData.password && usuarioData.password !== '') {
      const contraseñaEncriptada = encriptar(usuarioData.password);
      datosActualizacion.password = contraseñaEncriptada.contenido;
      datosActualizacion.password_iv = contraseñaEncriptada.iv;
    }
    
    // Transacción para actualización
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar usuario principal
      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: datosActualizacion
      });

      // Actualizar tutor si existe y hay datos de tutor
      if (usuarioExistente.adolecente && tutorData) {
        await prisma.tutor.update({
          where: { id: usuarioExistente.adolecente.id_tutor ?? undefined },
          data: {
            nombre: tutorData.nombre_tutor || undefined,
            cedula: tutorData.cedula_tutor || undefined,
            profesion_tutor: tutorData.profesion_tutor || undefined,
            telefono_contacto: tutorData.telefono_contacto || undefined,
            correo_contacto: tutorData.correo_contacto || undefined
          }
        });
      }

      // Actualizar psicólogo si existe y hay datos de psicólogo
      if (usuarioExistente.psicologo && psicologoData) {
        await prisma.psicologo.update({
          where: { id_usuario: id },
          data: {
            numero_de_titulo: psicologoData.numero_de_titulo || undefined,
            nombre_universidad: psicologoData.nombre_universidad || undefined,
            monto_consulta: psicologoData.monto_consulta || undefined,
            telefono_trabajo: psicologoData.telefono_trabajo || undefined
          }
        });

        // Actualizar redes sociales del psicólogo
        if (psicologoData.redes_sociales) {
          await prisma.redSocialPsicologo.deleteMany({
            where: { id_psicologo: usuarioExistente.psicologo?.id_usuario }
          });

          if (psicologoData.redes_sociales.length > 0) {
            await prisma.redSocialPsicologo.createMany({
              data: psicologoData.redes_sociales.map(red => ({
                id_psicologo: usuarioExistente.psicologo?.id_usuario || 0,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              }))
            });
          }
        }
      }

      return usuarioActualizado;
    });

    // Obtener usuario actualizado con todos los datos relacionados
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

    // Preparar respuesta con el mismo formato que login
    const responseData: LoginResponse = {
      user: {
        id: usuarioActualizado.id,
        email: usuarioActualizado.email,
        nombre: usuarioActualizado.nombre,
        cedula: usuarioActualizado.cedula,
        fecha_nacimiento: usuarioActualizado.fecha_nacimiento,
        id_tipo_usuario: usuarioActualizado.id_tipo_usuario,
        tipoUsuario: {
          ...usuarioActualizado.tipo_usuario,
          menu: Array.isArray(usuarioActualizado.tipo_usuario.menu)
            ? usuarioActualizado.tipo_usuario.menu
                .map((item: any) =>
                  typeof item === 'string'
                    ? JSON.parse(item)
                    : item
                )
                .filter((item: any) => item !== null)
            : [],
        },
        tokenExpiry: usuarioActualizado.authTokenExpiry ?? new Date(0)
      }
    };

    // Add adolescent-specific data if applicable
    if (usuarioActualizado.adolecente) {
      responseData.user.esAdolescente = true;
      if (usuarioActualizado.adolecente.tutor) {
        const tutor = usuarioActualizado.adolecente.tutor;
        responseData.user.tutorInfo = {
          id: tutor.id,
          cedula: tutor.cedula,
          nombre: tutor.nombre,
          profesion_tutor: tutor.profesion_tutor ?? undefined,
          telefono_contacto: tutor.telefono_contacto ?? undefined,
          correo_contacto: tutor.correo_contacto ?? undefined,
        };
      }
    }

    // Add psychologist-specific data if applicable
    if (usuarioActualizado.psicologo) {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = {
        numero_de_titulo: usuarioActualizado.psicologo.numero_de_titulo ?? '',
        nombre_universidad: usuarioActualizado.psicologo.nombre_universidad ?? '',
        monto_consulta: Number(usuarioActualizado.psicologo.monto_consulta) ?? 0,
        telefono_trabajo: usuarioActualizado.psicologo.telefono_trabajo ?? '',
        redes_sociales: usuarioActualizado.psicologo.redes_sociales
      };
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    
    // Manejar error de duplicado de cédula
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
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