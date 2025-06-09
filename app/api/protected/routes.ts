import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    // El middleware ya validó el token
    const users = await prisma.user.findMany();
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}