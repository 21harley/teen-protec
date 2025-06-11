import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value;

  // Rutas públicas
  const publicPaths = ['/login', '/register', '/'];
  
  if (publicPaths.includes(path)) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { authToken: token },
      include: { 
        tipoUsuario: {
          include: {
            menu: true
          }
        } 
      },
    });

    if (!user) {
      // Limpiar cookie inválida
      const response = NextResponse.redirect(new URL('/login', request.nextUrl));
      response.cookies.delete('auth-token');
      return response;
    }

    // Verificar rutas permitidas
    const allowedPaths = user.tipoUsuario.menu.map((item: any) => item.path);
    const isPathAllowed = allowedPaths.some((allowedPath: string) => 
      path.startsWith(allowedPath) || 
      path === '/' ||
      path.startsWith('/api/')
    );

    if (!isPathAllowed) {
      return NextResponse.redirect(new URL('/unauthorized', request.nextUrl));
    }

    // Pasar información del usuario a las rutas
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.tipoUsuario.nombre);
    requestHeaders.set('x-user-role-id', user.id_tipo_usuario.toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  } finally {
    await prisma.$disconnect();
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};