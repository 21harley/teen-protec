import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import { encriptar, generarTokenExpiry } from "@/app/lib/crytoManager";
import { UsuarioBase,TutorData,PsicologoData,TipoRegistro } from "../../type";
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
            cedula: tutorData.cedula_tutor || '',
            nombre: tutorData.nombre_tutor || '',
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

    // Configurar cookies
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

    // Obtener datos completos del usuario según su tipo
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: tipoRegistro === 'adolescente'
          ? {
              include: {
                tutor: true
              }
            }
          : false,
        psicologo: tipoRegistro === 'psicologo'
      }
    });

    // Preparar respuesta según el tipo de usuario
    let responseData: any = {
      user: {
        id: usuarioCompleto?.id,
        email: usuarioCompleto?.email,
        nombre: usuarioCompleto?.nombre,
        id_tipo_usuario: usuarioCompleto?.id_tipo_usuario,
        tipoUsuario: usuarioCompleto?.tipo_usuario,
        tokenExpiry: authTokenExpiry
      }
    };

    // Agregar datos específicos según el tipo de registro
    if (tipoRegistro === 'adolescente') {
      responseData.user.esAdolescente = true;
      responseData.user.tutorInfo = usuarioCompleto?.adolecente && 'tutor' in usuarioCompleto.adolecente
        ? (usuarioCompleto.adolecente as any).tutor
        : {};
    } else if (tipoRegistro === 'psicologo') {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = usuarioCompleto?.psicologo;
      if (responseData.user.psicologoInfo?.redes_sociales) {
        responseData.user.psicologoInfo.redes_sociales = 
          JSON.parse(responseData.user.psicologoInfo.redes_sociales);
      }
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