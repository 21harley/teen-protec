// /app/api/auth/logout/route.ts
import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    // Eliminar el token de la base de datos si existe
    if (authToken) {
      await prisma.usuario.updateMany({
        where: { authToken },
        data: { 
          authToken: null,
          authTokenExpiry: null 
        }
      });
    }

    // Eliminar todas las cookies relacionadas con la autenticación
    cookieStore.delete('auth-token');
    cookieStore.delete('auth-token-expiry');
    
    // Opcional: Eliminar otras cookies de sesión si las tienes
    // cookieStore.delete('session-data');
    // cookieStore.delete('user-preferences');

    return NextResponse.json(
      { 
        success: true,
        message: 'Sesión cerrada exitosamente' 
      },
      { 
        status: 200,
        headers: {
          // Asegurar que las cookies se eliminen en el cliente
          'Set-Cookie': [
            'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
            'auth-token-expiry=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict'
          ].join(', ')
        }
      }
    );

  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al cerrar sesión' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}