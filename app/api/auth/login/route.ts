// /app/api/auth/login/route.ts
import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { desencriptar, generarTokenExpiry } from "@/app/lib/crytoManager";

// Configuración de Prisma
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
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar si la cuenta está activa/bloqueada (puedes agregar este campo al modelo)
    // if (usuario.estado !== 'ACTIVO') {
    //   return NextResponse.json(
    //     { error: 'Tu cuenta está bloqueada o inactiva' },
    //     { status: 403 }
    //   );
    // }

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

    // Generar token seguro y fecha de expiración
    const authToken = crypto.randomBytes(64).toString('hex');
    const authTokenExpiry = generarTokenExpiry();
    
    // Actualizar el usuario con el token y su expiración
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { 
        authToken,
        authTokenExpiry,
      }
    });

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
      sameSite: 'strict' as const
    };

    // Configurar cookies de autenticación
    cookieStore.set('auth-token', authToken, cookieOptions);
    cookieStore.set('auth-token-expiry', authTokenExpiry.toISOString(), cookieOptions);
    
    // Configurar cookie con información básica del usuario (opcional)
    cookieStore.set('user-info', JSON.stringify({
      id: usuario.id,
      tipo: usuario.id_tipo_usuario,
      nombre: usuario.nombre
    }), {
      ...cookieOptions,
      httpOnly: false // Necesario para acceder desde el cliente
    });

    // Preparar respuesta sin datos sensibles
    const responseData = {
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        id_tipo_usuario: usuario.id_tipo_usuario,
        tipoUsuario: usuario.tipo_usuario,
        esAdolescente: !!usuario.adolecente,
        tutorInfo: usuario.adolecente?.tutor,
        tokenExpiry: authTokenExpiry
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('Error en login:', error);
    
    // Manejo específico de errores
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