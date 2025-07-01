import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import { encriptar, generarTokenExpiry, desencriptar } from "@/app/lib/crytoManager";
import { UsuarioBase, TutorData, PsicologoData, TipoRegistro, LoginResponse } from "../../type";
import crypto from 'crypto';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

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
        { error: 'Datos del psicólogo son requeridos para este registro' },
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

    // Determinar tipo de usuario según el registro
    let idTipoUsuario = usuarioData.id_tipo_usuario;
    if (!idTipoUsuario) {
      switch (tipoRegistro) {
        case 'adolescente':
          idTipoUsuario = 3;
          break;
        case 'psicologo':
          idTipoUsuario = 2;
          break;
        default:
          idTipoUsuario = 4; // Usuario regular
      }
    }

    // Generar token de autenticación
    const authToken = crypto.randomBytes(64).toString('hex');
    const authTokenExpiry = generarTokenExpiry();

    // Crear transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Crear usuario base
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

      // Registrar adolescente si aplica
      if (tipoRegistro === 'adolescente' && tutorData) {
        const tutor = await prisma.tutor.create({
          data: {
            cedula_tutor: tutorData.cedula_tutor || '',
            nombre_tutor: tutorData.nombre_tutor || '',
            profesion_tutor: tutorData.profesion_tutor || '',
            telefono_contacto: tutorData.telefono_contacto || '',
            correo_contacto: tutorData.correo_contacto || ''
          }
        });

        await prisma.adolecente.create({
          data: {
            id_usuario: nuevoUsuario.id,
            id_tutor: tutor.id
          }
        });
      }

      // Registrar psicólogo si aplica
      if (tipoRegistro === 'psicologo' && psicologoData) {
        await prisma.psicologo.create({
          data: {
            id_usuario: nuevoUsuario.id,
            numero_de_titulo: psicologoData.numero_de_titulo || '',
            nombre_universidad: psicologoData.nombre_universidad || '',
            monto_consulta: psicologoData.monto_consulta || 0,
            telefono_trabajo: psicologoData.telefono_trabajo || '',
            redes_sociales: psicologoData.redes_sociales
              ? {
                  create: psicologoData.redes_sociales.map(red => ({
                    nombre_red: red.nombre_red,
                    url_perfil: red.url_perfil
                  }))
                }
              : undefined
          }
        });
      }

      return nuevoUsuario;
    });

    // Obtener datos completos del usuario según su tipo
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

    if (!usuarioCompleto) {
      throw new Error('Usuario no encontrado después de creación');
    }

    // Configurar cookies (igual que en login)
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
      sameSite: 'strict' as const
    };

    cookieStore.set('auth-token', authToken, cookieOptions);
    cookieStore.set('auth-token-expiry', authTokenExpiry.toISOString(), cookieOptions);
    
    // Set user info cookie (accessible client-side)
    cookieStore.set('user-info', JSON.stringify({
      id: usuarioCompleto.id,
      tipo: usuarioCompleto.id_tipo_usuario,
      nombre: usuarioCompleto.nombre,
      esAdolescente: !!usuarioCompleto.adolecente,
      esPsicologo: !!usuarioCompleto.psicologo
    }), {
      ...cookieOptions,
      httpOnly: false
    });

    // Preparar respuesta según el tipo de usuario (igual que en login)
    const responseData: LoginResponse = {
      user: {
        id: usuarioCompleto.id,
        email: usuarioCompleto.email,
        nombre: usuarioCompleto.nombre,
        cedula: usuarioCompleto.cedula,
        fecha_nacimiento: usuarioCompleto.fecha_nacimiento,
        id_tipo_usuario: usuarioCompleto.id_tipo_usuario,
        tipoUsuario: {
          ...usuarioCompleto.tipo_usuario,
          menu: Array.isArray(usuarioCompleto.tipo_usuario.menu)
            ? usuarioCompleto.tipo_usuario.menu
                .filter((item: any): item is { path: string; name: string; icon: string } =>
                  item &&
                  typeof item === 'object' &&
                  typeof item.path === 'string' &&
                  typeof item.name === 'string' &&
                  typeof item.icon === 'string'
                )
            : []
        },
        tokenExpiry: authTokenExpiry
      }
    };

    // Add adolescent-specific data if applicable (igual que en login)
    if (usuarioCompleto.adolecente) {
      responseData.user.esAdolescente = true;
      if (usuarioCompleto.adolecente.tutor) {
        const tutor = usuarioCompleto.adolecente.tutor;
        responseData.user.tutorInfo = {
          id: tutor.id,
          cedula_tutor: tutor.cedula_tutor,
          nombre_tutor: tutor.nombre_tutor,
          profesion_tutor: tutor.profesion_tutor ?? undefined,
          telefono_contacto: tutor.telefono_contacto ?? undefined,
          correo_contacto: tutor.correo_contacto ?? undefined,
        };
      }
    }

    // Add psychologist-specific data if applicable (igual que en login)
    if (usuarioCompleto.psicologo) {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = {
        numero_de_titulo: usuarioCompleto.psicologo.numero_de_titulo ?? "",
        nombre_universidad: usuarioCompleto.psicologo.nombre_universidad ?? "",
        monto_consulta: usuarioCompleto.psicologo.monto_consulta ?? 0,
        telefono_trabajo: usuarioCompleto.psicologo.telefono_trabajo ?? "",
        redes_sociales: usuarioCompleto.psicologo.redes_sociales
      };
    }

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: any) {
    console.error('Error en registro:', error);
    
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