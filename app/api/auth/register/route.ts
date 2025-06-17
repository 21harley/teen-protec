import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import { encriptar, generarTokenExpiry } from "@/app/lib/crytoManager";
import crypto from 'crypto';
import { cookies } from 'next/headers';

interface UsuarioBase {
  email: string;
  password: string;
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

type TipoRegistroPermitido = 'usuario' | 'adolescente';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { 
      tipoRegistro,
      usuarioData, 
      tutorData 
    }: { 
      tipoRegistro: TipoRegistroPermitido,
      usuarioData: UsuarioBase, 
      tutorData?: TutorData 
    } = await request.json();

    // Validaciones básicas
    if (!usuarioData.email || !usuarioData.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!['usuario', 'adolescente'].includes(tipoRegistro)) {
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
    const contraseñaEncriptada = encriptar(usuarioData.password);

    // Determinar tipo de usuario
    const idTipoUsuario = usuarioData.id_tipo_usuario || 
                         (tipoRegistro === 'adolescente' ? 3 : 1);

    // Generar token de autenticación
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

    // Obtener datos completos del usuario
    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: {
            tutor: true
          }
        }
      }
    });

    // Preparar respuesta
    const responseData = {
      user: {
        id: usuarioCompleto?.id,
        email: usuarioCompleto?.email,
        nombre: usuarioCompleto?.nombre,
        id_tipo_usuario: usuarioCompleto?.id_tipo_usuario,
        tipoUsuario: usuarioCompleto?.tipo_usuario,
        esAdolescente: !!usuarioCompleto?.adolecente,
        tutorInfo: usuarioCompleto?.adolecente?.tutor,
        tokenExpiry: authTokenExpiry
      }
    };

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