import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../app/generated/prisma";
import { encriptar, EncryptedData, generarTokenExpiry } from "@/app/lib/crytoManager";
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { create_alarma_email,create_alarma } from '@/app/lib/alertas';
import RegistroUsuarioService from "../../lib/registro/registro-usuario"
import { setImmediate } from 'timers/promises';

const prisma = new PrismaClient();

// Tipos alineados con el modelo Prisma
interface TipoUsuarioResponse {
  id: number;
  nombre: string;
  menu: any;
}

interface TutorResponse {
  id: number;
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: string;
  parentesco?: string;
}

interface RedSocialResponse {
  id: number;
  nombre_red: string;
  url_perfil: string;
}

interface PsicologoResponse {
  id_usuario: number;
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: RedSocialResponse[];
}

interface AdolecenteResponse {
  id_usuario: number;
  id_tutor?: number;
  tutor?: TutorResponse;
}

interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  fecha_nacimiento: Date;
  id_tipo_usuario: number;
  id_psicologo?: number | null;
  tipo_usuario: TipoUsuarioResponse;
  adolecente?: AdolecenteResponse;
  psicologo?: PsicologoResponse;
  psicologoPacientes?: {
    id: number;
    nombre: string;
    email: string;
    psicologo?: PsicologoResponse;
  };
}

interface LoginResponse {
  user: {
    id: number;
    email: string;
    nombre: string;
    cedula: string;
    telefono: string;
    fecha_nacimiento: Date;
    sexo?: string;
    id_tipo_usuario: number;
    id_psicologo?: number;
    tipoUsuario: TipoUsuarioResponse;
    authTokenExpiry: Date;
    psicologoPacientes?: {
      id: number;
      nombre: string;
      email: string;
      psicologo?: PsicologoResponse;
    };
    esAdolescente?: boolean;
    tutorInfo?: TutorResponse;
    esPsicologo?: boolean;
    psicologoInfo?: PsicologoResponse;
  };
}

enum TipoRegistro {
  USUARIO = 'usuario',
  ADOLESCENTE = 'adolescente',
  PSICOLOGO = 'psicologo'
}

interface TutorData {
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
  sexo?: string;
  parentesco?: string;
}

interface PsicologoData {
  numero_de_titulo?: string;
  nombre_universidad?: string;
  monto_consulta?: number;
  telefono_trabajo?: string;
  redes_sociales?: {
    nombre_red: string;
    url_perfil: string;
  }[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids'); // Nuevo parámetro para múltiples IDs
    const tipo = searchParams.get('tipo');
    const rol = searchParams.get('rol');
    const includePassword = searchParams.get('includePassword') === 'true';
    const nombre = searchParams.get('nombre');
    const email = searchParams.get('email');
    const cedula = searchParams.get('cedula');
    const telefono = searchParams.get('telefono');
    const id_psicologo = searchParams.get('id_psicologo');

    const paginated = searchParams.get('paginated') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    // 1. Manejo de búsqueda por múltiples IDs (nueva funcionalidad)
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (ids.length === 0) {
        return NextResponse.json({ error: 'IDs no válidos' }, { status: 400 });
      }

      const usuarios = await prisma.usuario.findMany({
        where: { id: { in: ids } },
        include: {
          tipo_usuario: true,
          adolecente: { include: { tutor: true } },
          psicologo: { include: { redes_sociales: true } },
          psicologoPacientes: {
            include: {
              psicologo: { include: { redes_sociales: true } }
            }
          }
        },
        orderBy: { id: 'asc' }
      });

      const safeUsers = usuarios.map(({ password, password_iv, authToken, authTokenExpiry, ...user }) => {
        let adolecente: AdolecenteResponse | undefined = undefined;
        if (user.adolecente) {
          const { id_usuario, id_tutor, tutor } = user.adolecente;
          adolecente = {
            id_usuario,
            id_tutor: id_tutor ?? undefined,
            tutor: tutor
              ? {
                  id: tutor.id,
                  cedula_tutor: tutor.cedula_tutor,
                  nombre_tutor: tutor.nombre_tutor,
                  profesion_tutor: tutor.profesion_tutor ?? undefined,
                  telefono_contacto: tutor.telefono_contacto ?? undefined,
                  correo_contacto: tutor.correo_contacto ?? undefined,
                  sexo: tutor.sexo ?? undefined,
                  parentesco: tutor.parentesco ?? undefined
                }
              : undefined
          };
        }

        let psicologoPacientes = undefined;
        if (user.psicologoPacientes) {
          psicologoPacientes = {
            id: user.psicologoPacientes.id,
            nombre: user.psicologoPacientes.nombre,
            email: user.psicologoPacientes.email,
            psicologo: user.psicologoPacientes.psicologo ? {
              id_usuario: user.psicologoPacientes.psicologo.id_usuario,
              numero_de_titulo: user.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
              nombre_universidad: user.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
              monto_consulta: user.psicologoPacientes.psicologo.monto_consulta ?? undefined,
              telefono_trabajo: user.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
              redes_sociales: user.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
                id: red.id,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              })) || []
            } : undefined
          };
        }

        return {
          ...user,
          ...(includePassword ? { password, password_iv } : {}),
          adolecente,
          psicologoPacientes,
          id_psicologo: user.id_psicologo
        } as UsuarioResponse;
      });

      return NextResponse.json(safeUsers);
    }

    // 2. Manejo de búsqueda por ID único (funcionalidad existente)
    if (id) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        include: {
          tipo_usuario: true,
          adolecente: { include: { tutor: true } },
          psicologo: { include: { redes_sociales: true } },
          psicologoPacientes: {
            include: {
              psicologo: { include: { redes_sociales: true } }
            }
          }
        }
      });

      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      const { password, password_iv, authToken, authTokenExpiry, ...safeUser } = usuario;

      let adolecente: AdolecenteResponse | undefined = undefined;
      if (usuario.adolecente) {
        const { id_usuario, id_tutor, tutor } = usuario.adolecente;
        adolecente = {
          id_usuario,
          id_tutor: id_tutor ?? undefined,
          tutor: tutor
            ? {
                id: tutor.id,
                cedula_tutor: tutor.cedula_tutor,
                nombre_tutor: tutor.nombre_tutor,
                profesion_tutor: tutor.profesion_tutor ?? undefined,
                telefono_contacto: tutor.telefono_contacto ?? undefined,
                correo_contacto: tutor.correo_contacto ?? undefined,
                sexo: tutor.sexo ?? undefined,
                parentesco: tutor.parentesco ?? undefined
              }
            : undefined
        };
      }

      let psicologoPacientes = undefined;
      if (usuario.psicologoPacientes) {
        psicologoPacientes = {
          id: usuario.psicologoPacientes.id,
          nombre: usuario.psicologoPacientes.nombre,
          email: usuario.psicologoPacientes.email,
          psicologo: usuario.psicologoPacientes.psicologo ? {
            id_usuario: usuario.psicologoPacientes.psicologo.id_usuario,
            numero_de_titulo: usuario.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
            nombre_universidad: usuario.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
            monto_consulta: usuario.psicologoPacientes.psicologo.monto_consulta ?? undefined,
            telefono_trabajo: usuario.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
            redes_sociales: usuario.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
              id: red.id,
              nombre_red: red.nombre_red,
              url_perfil: red.url_perfil
            })) || []
          } : undefined
        };
      }

      return NextResponse.json({
        ...safeUser,
        ...(includePassword ? { password, password_iv } : {}),
        adolecente,
        psicologoPacientes,
        id_psicologo: usuario.id_psicologo
      } as UsuarioResponse);
    }

    // 3. Construcción dinámica del filtro para consultas generales
    let whereClause: any = {};

    // Filtro por rol (prioriza 'rol' sobre 'tipo' si ambos están presentes)
    const filterType = rol || tipo;
    
    if (filterType) {
      const filterTypeUpper = filterType.toUpperCase();
      
      if (filterTypeUpper === 'ADOLESCENTE') {
        whereClause.adolecente = { isNot: null };
      } else if (filterTypeUpper === 'PSICOLOGO') {
        whereClause.psicologo = { isNot: null };
      } else if (filterTypeUpper === 'USUARIO') {
        whereClause.AND = [
          { adolecente: { is: null } },
          { psicologo: { is: null } }
        ];
      } else {
        // Filtra por tipo de usuario (rol) usando la relación con TipoUsuario
        whereClause.tipo_usuario = {
          nombre: {
            equals: filterType,
            mode: 'insensitive'
          }
        };
      }
    }

    // Resto de los filtros
    if (id_psicologo) whereClause.id_psicologo = parseInt(id_psicologo);
    if (nombre) whereClause.nombre = { contains: nombre, mode: 'insensitive' };
    if (email) whereClause.email = { contains: email, mode: 'insensitive' };
    if (cedula) whereClause.cedula = { contains: cedula };
    if (telefono) whereClause.telefono = { contains: telefono };

    // 4. Manejo de resultados paginados
    if (paginated) {
      const total = await prisma.usuario.count({ where: whereClause });
      const totalPages = Math.ceil(total / pageSize);

      const usuarios = await prisma.usuario.findMany({
        where: whereClause,
        include: {
          tipo_usuario: true,
          adolecente: { include: { tutor: true } },
          psicologo: { include: { redes_sociales: true } },
          psicologoPacientes: {
            include: {
              psicologo: { include: { redes_sociales: true } }
            }
          }
        },
        orderBy: { id: 'asc' },
        skip,
        take: pageSize
      });

      const safeUsers = usuarios.map(({ password, password_iv, authToken, authTokenExpiry, ...user }) => {
        let adolecente: AdolecenteResponse | undefined = undefined;
        if (user.adolecente) {
          const { id_usuario, id_tutor, tutor } = user.adolecente;
          adolecente = {
            id_usuario,
            id_tutor: id_tutor ?? undefined,
            tutor: tutor
              ? {
                  id: tutor.id,
                  cedula_tutor: tutor.cedula_tutor,
                  nombre_tutor: tutor.nombre_tutor,
                  profesion_tutor: tutor.profesion_tutor ?? undefined,
                  telefono_contacto: tutor.telefono_contacto ?? undefined,
                  correo_contacto: tutor.correo_contacto ?? undefined,
                  sexo: tutor.sexo ?? undefined,
                  parentesco: tutor.parentesco ?? undefined
                }
              : undefined
          };
        }

        let psicologoPacientes = undefined;
        if (user.psicologoPacientes) {
          psicologoPacientes = {
            id: user.psicologoPacientes.id,
            nombre: user.psicologoPacientes.nombre,
            email: user.psicologoPacientes.email,
            psicologo: user.psicologoPacientes.psicologo ? {
              id_usuario: user.psicologoPacientes.psicologo.id_usuario,
              numero_de_titulo: user.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
              nombre_universidad: user.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
              monto_consulta: user.psicologoPacientes.psicologo.monto_consulta ?? undefined,
              telefono_trabajo: user.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
              redes_sociales: user.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
                id: red.id,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              })) || []
            } : undefined
          };
        }

        return {
          ...user,
          adolecente,
          psicologoPacientes,
          id_psicologo: user.id_psicologo
        } as UsuarioResponse;
      });

      return NextResponse.json({
        data: safeUsers,
        total,
        page,
        pageSize,
        totalPages
      });
    }

    // 5. Manejo de resultados no paginados
    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      include: {
        tipo_usuario: true,
        adolecente: { include: { tutor: true } },
        psicologo: { include: { redes_sociales: true } },
        psicologoPacientes: {
          include: {
            psicologo: { include: { redes_sociales: true } }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    const safeUsers = usuarios.map(({ password, password_iv, authToken, authTokenExpiry, ...user }) => {
      let adolecente: AdolecenteResponse | undefined = undefined;
      if (user.adolecente) {
        const { id_usuario, id_tutor, tutor } = user.adolecente;
        adolecente = {
          id_usuario,
          id_tutor: id_tutor ?? undefined,
          tutor: tutor
            ? {
                id: tutor.id,
                cedula_tutor: tutor.cedula_tutor,
                nombre_tutor: tutor.nombre_tutor,
                profesion_tutor: tutor.profesion_tutor ?? undefined,
                telefono_contacto: tutor.telefono_contacto ?? undefined,
                correo_contacto: tutor.correo_contacto ?? undefined,
                sexo: tutor.sexo ?? undefined,
                parentesco: tutor.parentesco ?? undefined
              }
            : undefined
        };
      }

      let psicologoPacientes = undefined;
      if (user.psicologoPacientes) {
        psicologoPacientes = {
          id: user.psicologoPacientes.id,
          nombre: user.psicologoPacientes.nombre,
          email: user.psicologoPacientes.email,
          psicologo: user.psicologoPacientes.psicologo ? {
            id_usuario: user.psicologoPacientes.psicologo.id_usuario,
            numero_de_titulo: user.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
            nombre_universidad: user.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
            monto_consulta: user.psicologoPacientes.psicologo.monto_consulta ?? undefined,
            telefono_trabajo: user.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
            redes_sociales: user.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
              id: red.id,
              nombre_red: red.nombre_red,
              url_perfil: red.url_perfil
            })) || []
          } : undefined
        };
      }

      return {
        ...user,
        adolecente,
        psicologoPacientes,
        id_psicologo: user.id_psicologo
      } as UsuarioResponse;
    });

    return NextResponse.json(safeUsers);

  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { tipoRegistro, usuarioData, tutorData, psicologoData } = await request.json();

    if (!usuarioData.email || !usuarioData.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!Object.values(TipoRegistro).includes(tipoRegistro)) {
      return NextResponse.json(
        { error: 'Tipo de registro no válido' },
        { status: 400 }
      );
    }

    if (tipoRegistro === TipoRegistro.ADOLESCENTE && !tutorData) {
      return NextResponse.json(
        { error: 'Datos del tutor son requeridos para registro de adolescente' },
        { status: 400 }
      );
    }

    if (tipoRegistro === TipoRegistro.PSICOLOGO && !psicologoData) {
      return NextResponse.json(
        { error: 'Datos profesionales son requeridos para registro de psicólogo' },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: { 
        OR: [
          { email: usuarioData.email },
          { cedula: usuarioData.cedula }
        ]
      }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }

    const contraseñaEncriptada = encriptar(usuarioData.password!);
    const idTipoUsuario = usuarioData.id_tipo_usuario || 
                         (tipoRegistro === TipoRegistro.PSICOLOGO ? 2 : 
                          tipoRegistro === TipoRegistro.ADOLESCENTE ? 3 : 4);

    const authToken = crypto.randomBytes(64).toString('hex');
    const authTokenExpiry = generarTokenExpiry();

    const result = await prisma.$transaction(async (prisma) => {
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          password: contraseñaEncriptada.contenido,
          cedula: usuarioData.cedula,
          telefono: usuarioData.telefono,
          sexo: usuarioData?.sexo,
          fecha_nacimiento: new Date(usuarioData.fecha_nacimiento),
          id_tipo_usuario: idTipoUsuario,
          id_psicologo: usuarioData.id_psicologo,
          password_iv: contraseñaEncriptada.iv,
          authToken,
          authTokenExpiry
        }
      });

      switch (tipoRegistro) {
        case TipoRegistro.ADOLESCENTE:
          const tutor = await prisma.tutor.create({
            data: {
              cedula_tutor: tutorData?.cedula_tutor || usuarioData.cedula,
              nombre_tutor: tutorData?.nombre_tutor || usuarioData.nombre,
              profesion_tutor: tutorData?.profesion_tutor,
              telefono_contacto: tutorData?.telefono_contacto,
              correo_contacto: tutorData?.correo_contacto,
              sexo: tutorData?.sexo,
              parentesco: tutorData?.parentesco
            }
          });

          await prisma.adolecente.create({
            data: {
              id_usuario: nuevoUsuario.id,
              id_tutor: tutor.id
            }
          });
          break;

        case TipoRegistro.PSICOLOGO:
          const psicologo = await prisma.psicologo.create({
            data: {
              id_usuario: nuevoUsuario.id,
              numero_de_titulo: psicologoData?.numero_de_titulo,
              nombre_universidad: psicologoData?.nombre_universidad,
              monto_consulta: psicologoData?.monto_consulta,
              telefono_trabajo: psicologoData?.telefono_trabajo
            }
          });

          if (psicologoData?.redes_sociales?.length) {
            await prisma.redSocialPsicologo.createMany({
              data: psicologoData.redes_sociales.map((red: { nombre_red: string; url_perfil: string }) => ({
                id_psicologo: psicologo.id_usuario,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              }))
            });
          }
          break;
      }

      return nuevoUsuario;
    });

    // Configuración de cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict' as const
    };

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth-token',
      value: authToken,
      ...cookieOptions
    });
    
    cookieStore.set({
      name: 'auth-token-expiry',
      value: authTokenExpiry.toISOString(),
      ...cookieOptions
    });

    const usuarioCompleto = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        },
        psicologoPacientes: {
          include: {
            psicologo: {
              include: {
                redes_sociales: true
              }
            }
          }
        }
      }
    });

    if (!usuarioCompleto) {
      throw new Error('Usuario no encontrado después de creación');
    }

    const { password, password_iv, authToken: _, authTokenExpiry: __, ...safeUser } = usuarioCompleto;
    
    const responseData: LoginResponse = {
      user: {
        id: usuarioCompleto.id,
        email: usuarioCompleto.email,
        nombre: usuarioCompleto.nombre,
        cedula: usuarioCompleto.cedula,
        telefono: usuarioCompleto.telefono,
        fecha_nacimiento: usuarioCompleto.fecha_nacimiento,
        sexo: usuarioCompleto.sexo ?? undefined,
        id_tipo_usuario: usuarioCompleto.id_tipo_usuario,
        id_psicologo: usuarioCompleto.id_psicologo || undefined,
        tipoUsuario: {
          id: usuarioCompleto.tipo_usuario.id,
          nombre: usuarioCompleto.tipo_usuario.nombre,
          menu: usuarioCompleto.tipo_usuario.menu
        },
        authTokenExpiry: usuarioCompleto.authTokenExpiry ?? new Date(0),
        psicologoPacientes: usuarioCompleto.psicologoPacientes ? {
          id: usuarioCompleto.psicologoPacientes.id,
          nombre: usuarioCompleto.psicologoPacientes.nombre,
          email: usuarioCompleto.psicologoPacientes.email,
          psicologo: usuarioCompleto.psicologoPacientes.psicologo
            ? {
                id_usuario: usuarioCompleto.psicologoPacientes.psicologo.id_usuario,
                numero_de_titulo: usuarioCompleto.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
                nombre_universidad: usuarioCompleto.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
                monto_consulta: usuarioCompleto.psicologoPacientes.psicologo.monto_consulta ?? undefined,
                telefono_trabajo: usuarioCompleto.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
                redes_sociales: usuarioCompleto.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
                  id: red.id,
                  nombre_red: red.nombre_red,
                  url_perfil: red.url_perfil
                })) || []
              }
            : undefined
        } : undefined
      }
    };

    if (usuarioCompleto.adolecente) {
      responseData.user.esAdolescente = true;
      if (usuarioCompleto.adolecente.tutor) {
        const tutor = usuarioCompleto.adolecente.tutor;
        responseData.user.tutorInfo = {
          id: tutor.id,
          cedula_tutor: tutor.cedula_tutor,
          nombre_tutor: tutor.nombre_tutor,
          profesion_tutor: tutor.profesion_tutor ?? undefined,
          telefono_contacto: tutor.telefono_contacto ?? undefined,
          correo_contacto: tutor.correo_contacto ?? undefined,
          sexo: tutor.sexo ?? undefined,
          parentesco: tutor.parentesco ?? undefined
        };
      }
    }

    if (usuarioCompleto.psicologo) {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = {
        id_usuario: usuarioCompleto.psicologo.id_usuario,
        numero_de_titulo: usuarioCompleto.psicologo.numero_de_titulo ?? undefined,
        nombre_universidad: usuarioCompleto.psicologo.nombre_universidad ?? undefined,
        monto_consulta: usuarioCompleto.psicologo.monto_consulta ?? undefined,
        telefono_trabajo: usuarioCompleto.psicologo.telefono_trabajo ?? undefined,
        redes_sociales: usuarioCompleto.psicologo.redes_sociales?.map(red => ({
          id: red.id,
          nombre_red: red.nombre_red,
          url_perfil: red.url_perfil
        })) || []
      };
    }

  //crear email
  setImmediate().then(async () => {
       const result_email = await  create_alarma_email({
       id_usuario: usuarioCompleto.id,
       id_tipo_alerta: 8,
       mensaje: "Registro completado con exito",
       vista: false,
       correo_enviado: true,
       emailParams: {
         to: usuarioCompleto.email,
         subject: "Tienes una nueva alerta",
         template: "welcome",
         props: {
           name: usuarioCompleto.nombre,
           alertMessage: "¡Bienvenido al PsicoTest!"
         }
       }
       });
     
       if (!result_email.emailSent) console.error('Error creando usuario',result_email); 
  });

  //crear registro
  setImmediate().then(async ()=>{
     try {
    const nuevoRegistro = await RegistroUsuarioService.createRegistroUsuario({
      usuario_id: usuarioCompleto.id,
      sexo: usuarioCompleto.sexo ?? "",
      fecha_nacimiento: usuarioCompleto.fecha_nacimiento,
      tipo_usuario: usuarioCompleto.tipo_usuario.nombre,
      psicologo_id: null,
      tests_ids: [],
      total_tests: 0,
    });
    


    console.log('Registro creado:', nuevoRegistro);
  } catch (error) {
    console.error('Error al crear registro:', error);
  }
  });

  return NextResponse.json(responseData, { status: 201 });
 
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    const { id, usuarioData, tutorData, psicologoData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        },
        psicologoPacientes: {
          include: {
            psicologo: {
              include: {
                redes_sociales: true
              }
            }
          }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const datosActualizacion: any = {
      nombre: usuarioData.nombre,
      cedula: usuarioData.cedula,
      fecha_nacimiento: usuarioData.fecha_nacimiento ? new Date(usuarioData.fecha_nacimiento) : undefined,
      id_tipo_usuario: usuarioData.id_tipo_usuario,
      id_psicologo: usuarioData.id_psicologo
    };

    if (usuarioData.password && usuarioData.password !== '') {
      const contraseñaEncriptada = encriptar(usuarioData.password);
      datosActualizacion.password = contraseñaEncriptada.contenido;
      datosActualizacion.password_iv = contraseñaEncriptada.iv;
    }
    
    const result = await prisma.$transaction(async (prisma) => {
      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: datosActualizacion
      });

      if (usuarioExistente.adolecente && tutorData) {
        await prisma.tutor.update({
          where: { id: usuarioExistente.adolecente.id_tutor ?? undefined },
          data: {
            nombre_tutor: tutorData.nombre_tutor || undefined,
            cedula_tutor: tutorData.cedula_tutor || undefined,
            profesion_tutor: tutorData.profesion_tutor || undefined,
            telefono_contacto: tutorData.telefono_contacto || undefined,
            correo_contacto: tutorData.correo_contacto || undefined,
            sexo: tutorData.sexo || undefined,
            parentesco: tutorData.parentesco || undefined
          }
        });
      }

      if (usuarioExistente.psicologo && psicologoData) {
        await prisma.psicologo.update({
          where: { id_usuario: id },
          data: {
            numero_de_titulo: psicologoData.numero_de_titulo || undefined,
            nombre_universidad: psicologoData.nombre_universidad || undefined,
            monto_consulta: psicologoData.monto_consulta || undefined,
            telefono_trabajo: psicologoData.telefono_trabajo || undefined
          }
        });

        if (psicologoData.redes_sociales) {
          await prisma.redSocialPsicologo.deleteMany({
            where: { id_psicologo: usuarioExistente.psicologo?.id_usuario }
          });

          if (psicologoData.redes_sociales.length > 0) {
            await prisma.redSocialPsicologo.createMany({
              data: psicologoData.redes_sociales.map((red: { nombre_red: string; url_perfil: string }) => ({
                id_psicologo: usuarioExistente.psicologo?.id_usuario || 0,
                nombre_red: red.nombre_red,
                url_perfil: red.url_perfil
              }))
            });
          }
        }
      }

      return usuarioActualizado;
    });

    const usuarioActualizado = await prisma.usuario.findUnique({
      where: { id: result.id },
      include: {
        tipo_usuario: true,
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        },
        psicologoPacientes: {
          include: {
            psicologo: {
              include: {
                redes_sociales: true
              }
            }
          }
        }
      }
    });

    if (!usuarioActualizado) {
      throw new Error('Usuario no encontrado después de actualización');
    }

    const responseData: LoginResponse = {
      user: {
        id: usuarioActualizado.id,
        email: usuarioActualizado.email,
        nombre: usuarioActualizado.nombre,
        cedula: usuarioActualizado.cedula,
        telefono: usuarioActualizado.telefono,
        fecha_nacimiento: usuarioActualizado.fecha_nacimiento,
        id_tipo_usuario: usuarioActualizado.id_tipo_usuario,
        id_psicologo: usuarioActualizado.id_psicologo || undefined,
        tipoUsuario: {
          id: usuarioActualizado.tipo_usuario.id,
          nombre: usuarioActualizado.tipo_usuario.nombre,
          menu: usuarioActualizado.tipo_usuario.menu
        },
        authTokenExpiry: usuarioActualizado.authTokenExpiry ?? new Date(0),
        psicologoPacientes: usuarioActualizado.psicologoPacientes ? {
          id: usuarioActualizado.psicologoPacientes.id,
          nombre: usuarioActualizado.psicologoPacientes.nombre,
          email: usuarioActualizado.psicologoPacientes.email,
          psicologo: usuarioActualizado.psicologoPacientes.psicologo
            ? {
                id_usuario: usuarioActualizado.psicologoPacientes.psicologo.id_usuario,
                numero_de_titulo: usuarioActualizado.psicologoPacientes.psicologo.numero_de_titulo ?? undefined,
                nombre_universidad: usuarioActualizado.psicologoPacientes.psicologo.nombre_universidad ?? undefined,
                monto_consulta: usuarioActualizado.psicologoPacientes.psicologo.monto_consulta ?? undefined,
                telefono_trabajo: usuarioActualizado.psicologoPacientes.psicologo.telefono_trabajo ?? undefined,
                redes_sociales: usuarioActualizado.psicologoPacientes.psicologo.redes_sociales?.map(red => ({
                  id: red.id,
                  nombre_red: red.nombre_red,
                  url_perfil: red.url_perfil
                })) || []
              }
            : undefined
        } : undefined
      }
    };

    if (usuarioActualizado.adolecente) {
      responseData.user.esAdolescente = true;
      if (usuarioActualizado.adolecente.tutor) {
        const tutor = usuarioActualizado.adolecente.tutor;
        responseData.user.tutorInfo = {
          id: tutor.id,
          cedula_tutor: tutor.cedula_tutor,
          nombre_tutor: tutor.nombre_tutor,
          profesion_tutor: tutor.profesion_tutor ?? undefined,
          telefono_contacto: tutor.telefono_contacto ?? undefined,
          correo_contacto: tutor.correo_contacto ?? undefined,
          sexo: tutor.sexo ?? undefined,
          parentesco: tutor.parentesco ?? undefined
        };
      }
    }

    if (usuarioActualizado.psicologo) {
      responseData.user.esPsicologo = true;
      responseData.user.psicologoInfo = {
        id_usuario: usuarioActualizado.psicologo.id_usuario,
        numero_de_titulo: usuarioActualizado.psicologo.numero_de_titulo ?? undefined,
        nombre_universidad: usuarioActualizado.psicologo.nombre_universidad ?? undefined,
        monto_consulta: usuarioActualizado.psicologo.monto_consulta ?? undefined,
        telefono_trabajo: usuarioActualizado.psicologo.telefono_trabajo ?? undefined,
        redes_sociales: usuarioActualizado.psicologo.redes_sociales?.map(red => ({
          id: red.id,
          nombre_red: red.nombre_red,
          url_perfil: red.url_perfil
        })) || []
      };
    }

    const result_email = await  create_alarma({
      id_usuario: responseData.user.id,
      id_tipo_alerta: null,
      mensaje: "Atualizacion completado con exito",
      vista: false,
      correo_enviado: false,
    });
    
    if(!result_email){
      console.error("Error al crear la alerta.");
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o cédula ya están registrados' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        adolecente: {
          include: { tutor: true }
        },
        psicologo: {
          include: { redes_sociales: true }
        }
      }
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (prisma) => {
      if (usuarioExistente.adolecente) {
        await prisma.adolecente.delete({
          where: { id_usuario: userId }
        });

        const tutorId = usuarioExistente.adolecente.id_tutor;
        if (tutorId) {
          const otrosAdolescentes = await prisma.adolecente.count({
            where: { id_tutor: tutorId }
          });

          if (otrosAdolescentes === 0) {
            await prisma.tutor.delete({
              where: { id: tutorId }
            });
          }
        }
      }

      if (usuarioExistente.psicologo) {
        await prisma.redSocialPsicologo.deleteMany({
          where: { id_psicologo: userId }
        });

        await prisma.psicologo.delete({
          where: { id_usuario: userId }
        });
      }

      await prisma.usuario.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json(
      { message: 'Usuario eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}