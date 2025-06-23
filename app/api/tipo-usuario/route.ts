import { NextResponse } from 'next/server';
import { PrismaClient } from "../../generated/prisma";

// Configuración de Prisma
const prisma = new PrismaClient()

// Tipos para los datos
interface TipoUsuarioData {
  nombre: string;
  menu?: any[]; // Tipo Json[] según el modelo
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Obtener un tipo de usuario específico por ID
      const tipoUsuario = await prisma.tipoUsuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuarios: true
        }
      });

      if (!tipoUsuario) {
        return NextResponse.json(
          { error: 'Tipo de usuario no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(tipoUsuario);
    } else {
      // Obtener todos los tipos de usuario
      const tiposUsuario = await prisma.tipoUsuario.findMany({
        include: {
          usuarios: true
        },
        orderBy: {
          id: 'asc'
        }
      });

      return NextResponse.json(tiposUsuario);
    }
  } catch (error: any) {
    console.error('Error obteniendo tipos de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, menu = [] }: TipoUsuarioData = await request.json();

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de usuario es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de usuario ya existe
    const tipoExistente = await prisma.tipoUsuario.findUnique({
      where: { nombre }
    });

    if (tipoExistente) {
      return NextResponse.json(
        { error: 'Este tipo de usuario ya existe' },
        { status: 409 }
      );
    }

    // Crear nuevo tipo de usuario
    const nuevoTipoUsuario = await prisma.tipoUsuario.create({
      data: {
        nombre,
        menu
      }
    });

    return NextResponse.json(nuevoTipoUsuario, { status: 201 });

  } catch (error: any) {
    console.error('Error creando tipo de usuario:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este tipo de usuario ya existe' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nombre, menu }: TipoUsuarioData & { id: number } = await request.json();

    // Validación básica
    if (!id) {
      return NextResponse.json(
        { error: 'ID de tipo de usuario es requerido' },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del tipo de usuario es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el tipo de usuario existe
    const tipoExistente = await prisma.tipoUsuario.findUnique({
      where: { id }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el nuevo nombre ya está en uso
    if (nombre !== tipoExistente.nombre) {
      const nombreExistente = await prisma.tipoUsuario.findFirst({
        where: { 
          nombre,
          NOT: { id }
        }
      });

      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Este nombre de tipo de usuario ya está en uso' },
          { status: 409 }
        );
      }
    }

    // Actualizar tipo de usuario
    const tipoActualizado = await prisma.tipoUsuario.update({
      where: { id },
      data: {
        nombre,
        menu: menu || tipoExistente.menu
      },
      include: {
        usuarios: true
      }
    });

    return NextResponse.json(tipoActualizado);

  } catch (error: any) {
    console.error('Error actualizando tipo de usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este nombre de tipo de usuario ya está en uso' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de tipo de usuario es requerido' },
        { status: 400 }
      );
    }

    const tipoUsuarioId = parseInt(id);

    // Verificar si el tipo de usuario existe
    const tipoExistente = await prisma.tipoUsuario.findUnique({
      where: { id: tipoUsuarioId },
      include: {
        usuarios: true
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asociados
    if (tipoExistente.usuarios && tipoExistente.usuarios.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar este tipo de usuario porque tiene usuarios asociados',
          usuariosAsociados: tipoExistente.usuarios.length
        },
        { status: 400 }
      );
    }

    // Eliminar el tipo de usuario
    await prisma.tipoUsuario.delete({
      where: { id: tipoUsuarioId }
    });

    return NextResponse.json(
      { message: 'Tipo de usuario eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando tipo de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}