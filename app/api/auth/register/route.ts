import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface EncryptedData {
  iv: string;
  contenido: string;
}

// Cache simple en memoria
const responseCache = new Map<string, any>();

// Configuración de Prisma
const prisma = new PrismaClient()

// Configuración de encriptación
const algoritmo = 'aes-256-cbc';
const rawEncryptionKey: string = process.env.ENCRYPTION_KEY || '';
const claveEncriptacion = crypto.createHash('sha256').update(rawEncryptionKey).digest('base64').substr(0, 32);
const iv: Buffer = crypto.randomBytes(16);

export async function POST(request: Request) {
  try {
    const { email, password, nombre, cedula, fecha_nacimiento, id_tipo_usuario } = await request.json();

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Crear clave de cache basada en los datos del usuario
    const cacheKey = `user-${email}-${cedula}`;
    
    // Verificar si la respuesta está en cache
    if (responseCache.has(cacheKey)) {
      return NextResponse.json(responseCache.get(cacheKey));
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 } // Conflict
      );
    }

    // Encriptar la contraseña
    const contraseñaEncriptada: EncryptedData = encriptar(password);

    // Crear nuevo usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email: email,
        nombre: nombre,
        password: contraseñaEncriptada.contenido,
        cedula: cedula,
        fecha_nacimiento: new Date(fecha_nacimiento),
        id_tipo_usuario: id_tipo_usuario,
        password_iv: contraseñaEncriptada.iv
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        cedula:true,
        fecha_nacimiento:true,
      }
    });

    //console.log('Usuario creado:', nuevoUsuario);
    
    // Almacenar en cache
    responseCache.set(cacheKey, nuevoUsuario);
    
    return NextResponse.json(nuevoUsuario, { status: 201 });

  } catch (error: any) {
    //console.error('Error creando usuario:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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