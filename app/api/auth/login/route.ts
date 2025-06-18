// /app/api/auth/login/route.ts
import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { desencriptar, generarTokenExpiry } from "@/app/lib/crytoManager";
import { LoginResponse } from "../../type";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email y contraseña son requeridos' },
      { status: 400 }
    );
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
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
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const contraseñaDesencriptada = desencriptar({
      iv: usuario.password_iv,
      contenido: usuario.password
    });

    if (contraseñaDesencriptada !== password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generate auth token
    const authToken = crypto.randomBytes(64).toString('hex');
    const authTokenExpiry = generarTokenExpiry();
    
    // Update user with new token
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { 
        authToken,
        authTokenExpiry,
      }
    });

    // Set cookies
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict' as const
    };

    cookieStore.set('auth-token', authToken, cookieOptions);
    cookieStore.set('auth-token-expiry', authTokenExpiry.toISOString(), cookieOptions);
    
    // Set user info cookie (accessible client-side)
    cookieStore.set('user-info', JSON.stringify({
      id: usuario.id,
      tipo: usuario.id_tipo_usuario,
      nombre: usuario.nombre,
      esAdolescente: !!usuario.adolecente,
      esPsicologo: !!usuario.psicologo
    }), {
      ...cookieOptions,
      httpOnly: false
    });

    // Prepare response data
    const responseData: LoginResponse = {
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        cedula: usuario.cedula,
        fecha_nacimiento: usuario.fecha_nacimiento,
        id_tipo_usuario: usuario.id_tipo_usuario,
        tipoUsuario: usuario.tipo_usuario,
        tokenExpiry: authTokenExpiry
      }
    };

    // Add adolescent-specific data if applicable
    if (usuario.adolecente) {
      responseData.user.esAdolescente = true;
      if (usuario.adolecente.tutor) {
        const tutor = usuario.adolecente.tutor;
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
    if (usuario.psicologo) {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = {
        numero_de_titulo: usuario.psicologo.numero_de_titulo ?? "",
        nombre_universidad: usuario.psicologo.nombre_universidad ?? "",
        monto_consulta: usuario.psicologo.monto_consulta ?? 0,
        telefono_trabajo: usuario.psicologo.telefono_trabajo ?? "",
        redes_sociales: usuario.psicologo.redes_sociales
      };
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('Error en login:', error);
    
    if (error.message.includes('Error al desencriptar')) {
      return NextResponse.json(
        { error: 'Problema con las credenciales almacenadas' },
        { status: 500 }
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