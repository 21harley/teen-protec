import { PrismaClient } from "./../../../../app/generated/prisma";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import RegistroSesionService from "../../../../app/lib/registro/registro-sesion";
import { setImmediate } from 'timers/promises';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_usuario = searchParams.get('id');
    const id = parseInt(id_usuario ? id_usuario : '-1');
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    console.log(id_usuario,id,searchParams)
    if (authToken) {
      await prisma.usuario.updateMany({
        where: { authToken },
        data: { 
          authToken: null,
          authTokenExpiry: null 
        }
      });
    }

    cookieStore.delete('auth-token');
    cookieStore.delete('auth-token-expiry');

   if(id>0){
    setImmediate().then(async () => {
      try {
        if(!id_usuario) return
        const cierreSesion = await RegistroSesionService.cerrarSesionesActivas(id)
        console.log("registro update cerrar sesion:",cierreSesion);
        } catch (error) {
          console.error('Error al crear registro cerrar sesion:', error);
      }
    });
   }else{
    console.log("Error al enviar el id, al cerrar sesion.");
   }

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