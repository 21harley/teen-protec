
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value;

  // Rutas públicas
  const publicPaths = ['/login', '/register'];
  
  // Rutas protegidas
  const protectedPaths = ['/api/protected', '/dashboard'];

  // Redirigir si no está autenticado y accede a ruta protegida
  if (protectedPaths.some(p => path.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }

  // Si está autenticado y trata de acceder a login/register
  if (publicPaths.includes(path)){
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/protected/:path*',
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};
