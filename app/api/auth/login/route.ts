// /app/api/auth/login/route.ts
import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// Configuración de Prisma
const prisma = new PrismaClient();

// Configuración de encriptación (debe coincidir con el registro)
const algoritmo = 'aes-256-cbc';
const rawEncryptionKey: string = process.env.ENCRYPTION_KEY || '';
const claveEncriptacion = crypto.createHash('sha256').update(rawEncryptionKey).digest('base64').substr(0, 32);

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
      include: { tipo_usuario: true } // Incluir el tipo de usuario
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

    // Generar un token más seguro
    const authToken = crypto.randomBytes(32).toString('hex');
    
    // Actualizar el usuario con el token en la base de datos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { authToken }
    });

    const cookieStore = await cookies();
    cookieStore.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        id_tipo_usuario: usuario.id_tipo_usuario,
        tipoUsuario: usuario.tipo_usuario // Incluir información del tipo
      }
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function desencriptar(encryptedData: { iv: string; contenido: string }): string {
  try {
    const decipher = crypto.createDecipheriv(
      algoritmo,
      claveEncriptacion,
      Buffer.from(encryptedData.iv, 'hex')
    );
    let desencriptado = decipher.update(encryptedData.contenido, 'hex', 'utf8');
    desencriptado += decipher.final('utf8');
    return desencriptado;
  } catch (error) {
    console.error('Error desencriptando:', error);
    throw new Error('Error al desencriptar la contraseña');
  }
}