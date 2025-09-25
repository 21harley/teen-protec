import { NextResponse } from 'next/server';
import { GrupoPreguntaPlantilla, PrismaClient } from "../../../app/generated/prisma";
import { calcularProgreso } from '../../../app/api/helpers/testHelpers'
import { cookies } from 'next/headers';
import { create_alarma_email,create_alarma } from '@/app/lib/alertas';
import { setImmediate } from 'timers/promises';
import RegistroUsuarioService from "../../lib/registro/registro-usuario"
import RegistroTestService,{CreateRegistroTestInput} from "../../lib/registro/registro-test"
import { EstadoTestRegistro } from '@/app/types/registros';
import { emitToUser, getIO, initSocketIO } from "../../../pages/api/socket";
import { Server as HttpServer } from "http";

const prisma = new PrismaClient();

// Tipos e interfaces
interface PacienteAsignacion {
  id_paciente: number;
  id_psicologo: number;
}

interface TestAsignacion {
  id_plantilla: number;
  id_paciente: number;
  id_psicologo: number;
  nombre?: string;
}

interface DatosPaciente {
  nombre?: string;
  email?: string;
  cedula?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  adolecente?: {
    id_tutor?: number;
    tutor?: {
      cedula_tutor?: string;
      nombre_tutor?: string;
      profesion_tutor?: string;
      telefono_contacto?: string;
      correo_contacto?: string;
      sexo?: string;
      parentesco?: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const conTests = searchParams.get('conTests') === 'true';
    const disponibles = searchParams.get('disponibles') === 'true';

    // Validar autenticación
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      );
    }

    // Verificar usuario autenticado
    const usuarioAutenticado = await prisma.usuario.findFirst({
      where: { 
        authToken,
        authTokenExpiry: { gt: new Date() }
      },
      include: {
        psicologo: true,
        tipo_usuario: true
      }
    });

    if (!usuarioAutenticado) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    // Configuración de relaciones a incluir
    const includeOptions: any = {
      adolecente: {
        include: { 
          tutor: true 
        }
      },
      tipo_usuario: true,
      psicologoPacientes: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      }
    };

    if (conTests) {
      includeOptions.tests = {
        include: {
          preguntas: {
            include: {
              grupoPregunta: true
            }
          },
          respuestas: {
            include: {
              pregunta: {
                include: {
                  grupoPregunta: true
                }
              },
              opcion: true
            }
          }
        }
      };
    }

    // Filtros base - EXCLUYE ADMINS Y PSICÓLOGOS
    const baseFilters: any = {
      // Excluir admins y psicólogos por tipo de usuario
      tipo_usuario: {
        nombre: { 
          in: ['adolecente', 'usuario'] // Solo estos tipos
        }
      },
      // Excluir usuarios que son psicólogos (por si acaso)
      psicologo: null
    };

    // Caso 1: Obtener pacientes disponibles (sin psicólogo asignado)
    if (disponibles) {
      baseFilters.id_psicologo = null;
    } 
    // Caso 2: Obtener pacientes asignados al psicólogo logueado
    else {
      // Verificar que el usuario autenticado es psicólogo
      if (usuarioAutenticado.tipo_usuario.nombre !== 'psicologo') {
        return NextResponse.json(
          { error: 'Solo los psicólogos pueden ver sus pacientes asignados' },
          { status: 403 }
        );
      }
      baseFilters.id_psicologo = usuarioAutenticado.id;
    }

    // Si se busca un paciente específico
    if (id_paciente) {
      baseFilters.id = parseInt(id_paciente);
    }

    // Obtener usuarios según los filtros
    const usuarios = await prisma.usuario.findMany({
      where: baseFilters,
      include: includeOptions
    });

    // Procesar datos para respuesta (eliminar información sensible)
    const usuariosProcesados = usuarios.map((usuario: any) => {
      const { 
        password, 
        password_iv, 
        authToken, 
        authTokenExpiry, 
        resetPasswordToken, 
        resetPasswordTokenExpiry, 
        ...usuarioSafe 
      } = usuario;
      
      // Procesar tests para incluir información de grupos de manera eficiente
      const testsProcesados = conTests ? usuario.tests?.map((test: any) => {
        // Crear un mapa de grupos para referencia rápida
        const gruposMap: Record<number, any> = {};
        
        // Primero recolectamos todos los grupos únicos
        test.preguntas.forEach((pregunta: any) => {
          if (pregunta.id_gru_pre && pregunta.grupoPregunta && !gruposMap[pregunta.id_gru_pre]) {
            gruposMap[pregunta.id_gru_pre] = pregunta.grupoPregunta;
          }
        });

        // Procesar preguntas sin duplicar info de grupo
        const preguntasProcesadas = test.preguntas.map((pregunta: any) => {
          const { grupoPregunta, ...preguntaSafe } = pregunta;
          return {
            ...preguntaSafe,
            id_grupo: pregunta.id_gru_pre // Solo mantener referencia al ID
          };
        });

        // Procesar respuestas para mantener consistencia
        const respuestasProcesadas = test.respuestas?.map((respuesta: any) => {
          const { pregunta, ...respuestaSafe } = respuesta;
          return {
            ...respuestaSafe,
            pregunta: {
              id: pregunta.id,
              id_grupo: pregunta.id_gru_pre, // Solo referencia al ID
              texto_pregunta: pregunta.texto_pregunta,
              id_tipo: pregunta.id_tipo,
              orden: pregunta.orden
            }
          };
        });

        return {
          ...test,
          grupos: Object.values(gruposMap), // Array de grupos únicos
          preguntas: preguntasProcesadas,
          respuestas: respuestasProcesadas,
          progreso: calcularProgreso(test.id, test.id_usuario ?? undefined)
        };
      }) : undefined;

      return {
        ...usuarioSafe,
        esAdolescente: usuario.tipo_usuario.nombre === 'adolecente',
        esPsicologo: false,
        tienePsicologo: !!usuario.id_psicologo,
        tests: testsProcesados
      };
    });

    return NextResponse.json(
      id_paciente ? usuariosProcesados[0] || null : usuariosProcesados
    );

  } catch (error: any) {
    console.error('Error obteniendo pacientes:', error);
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
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      );
    }

    // Verificar el usuario/psicólogo autenticado
    const usuarioAutenticado = await prisma.usuario.findFirst({
      where: { 
        authToken,
        authTokenExpiry: { gt: new Date() }
      },
      include: {
        psicologo: true,
        tipo_usuario: true
      }
    });

    if (!usuarioAutenticado) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    // Verificar que el usuario es psicólogo
    if (usuarioAutenticado.tipo_usuario.nombre !== 'psicologo') {
      return NextResponse.json(
        { error: 'Solo los psicólogos pueden realizar estas acciones' },
        { status: 403 }
      );
    }

    const idPsicologo = usuarioAutenticado.id;
    const data = await request.json();

    // Validación básica de datos
    if (!data.id_paciente) {
      return NextResponse.json(
        { error: 'ID de paciente es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe y no es psicólogo
    const paciente = await prisma.usuario.findUnique({
      where: { id: data.id_paciente },
      include: { 
        tipo_usuario: true,
        psicologo: true 
      }
    });

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    if (paciente.tipo_usuario.nombre === 'psicologo' || paciente.psicologo) {
      return NextResponse.json(
        { error: 'El usuario es un psicólogo, no puede ser paciente' },
        { status: 400 }
      );
    }

    // Caso 1: Solo asignar paciente (sin id_plantilla)
    if (!data.id_plantilla) {
      // Verificar si ya está asignado
      if (paciente.id_psicologo === idPsicologo) {
        return NextResponse.json(
          { error: 'El paciente ya está asignado a este psicólogo' },
          { status: 400 }
        );
      }

      // Actualizar el campo id_psicologo en el usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: data.id_paciente },
        data: { id_psicologo: idPsicologo },
        include: {
          psicologoPacientes: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      // Registro de asignación de psicólogo
      setImmediate(async () => {
        try {
          const cambioPsicologo = await RegistroUsuarioService.cambiarPsicologo(data.id_paciente, idPsicologo);  
          console.log('cambioPsicologo registro:', cambioPsicologo);
        } catch (error) {
          console.error('Error al crear registro:', error);
        }     
      });
      await prisma.alarma.create({
        data: {
          id_usuario: usuarioActualizado.id || null,
          id_tipo_alerta: 1,
          mensaje: `El psicólogo ${usuarioAutenticado.nombre} te atenderá próximamente.`,
          vista: false,
          correo_enviado: true,
        }
      });
      
      // Crear email asignación psicólogo
      const result_email = await create_alarma_email({
          emailParams: {
            to: usuarioActualizado.email,
            subject: "Tienes una nueva alerta",
            template: "test_asignado",
            props: {
              name: usuarioActualizado.nombre,
              psicologo_name: usuarioAutenticado.nombre,
              alertMessage: `El psicólogo ${usuarioAutenticado.nombre} te atenderá próximamente.`
            }
          }
        });
        
        if (!result_email.emailSent) console.error('Error al enviar email, test.', result_email); 

      return NextResponse.json(
        { 
          message: 'Paciente asignado correctamente', 
          usuario: {
            id: usuarioActualizado.id,
            nombre: usuarioActualizado.nombre,
            email: usuarioActualizado.email,
            tienePsicologo: true,
            psicologo: usuarioActualizado.psicologoPacientes
          },
          testAsignado: false
        },
        { status: 200 }
      );
    }

    // Caso 2: Asignar test a paciente (con id_plantilla)
    // Verificar que el paciente está asignado a este psicólogo
    if (paciente.id_psicologo !== idPsicologo) {
      return NextResponse.json(
        { error: 'El paciente no está asignado a este psicólogo' },
        { status: 403 }
      );
    }

    // Verificar que la plantilla existe y (pertenece al psicólogo O es global)
    const plantilla = await prisma.testPlantilla.findUnique({
      where: { id: data.id_plantilla },
      include: {
        preguntas: {
          include: {
            opciones: true,
            tipo: true,
            grupoPreguntaPlantilla: true
          },
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla de test no encontrada' },
        { status: 404 }
      );
    }

    // Validar permisos sobre la plantilla
    if (plantilla.id_psicologo && plantilla.id_psicologo !== idPsicologo && !plantilla.es_global) {
      return NextResponse.json(
        { 
          error: 'La plantilla no pertenece a este psicólogo',
          details: plantilla.es_global ? 
            'Las plantillas globales pueden ser usadas por cualquier psicólogo' :
            'Solo el dueño de la plantilla puede usarla'
        },
        { status: 403 }
      );
    }

    // Obtener grupos únicos de la plantilla
    const gruposUnicos = new Map<number, typeof plantilla.preguntas[0]['grupoPreguntaPlantilla']>();
    plantilla.preguntas.forEach(pregunta => {
      if (pregunta.grupoPreguntaPlantilla && !gruposUnicos.has(pregunta.grupoPreguntaPlantilla.id)) {
        gruposUnicos.set(pregunta.grupoPreguntaPlantilla.id, pregunta.grupoPreguntaPlantilla);
      }
    });

    // Crear los grupos de preguntas para el test real
    const gruposCreados = [];
    for (const [id, grupoPlantilla] of gruposUnicos) {
      if (!grupoPlantilla) continue;
      
      const grupo = await prisma.grupoPregunta.create({
        data: {
          nombre: grupoPlantilla.nombre,
          total_resp_valida: grupoPlantilla.total_resp_valida,
          total_resp: grupoPlantilla.total_resp
        }
      });
      gruposCreados.push({
        id: grupo.id,
        idOriginal: id
      });
    }

    // Mapear IDs de grupos originales a nuevos
    const gruposMap = new Map();
    gruposCreados.forEach(grupo => {
      gruposMap.set(grupo.idOriginal, grupo.id);
    });

    // Crear el nuevo test basado en la plantilla
    const nuevoTest = await prisma.test.create({
      data: {
        nombre: data.nombre || plantilla.nombre,
        estado: 'NO_INICIADO',
        peso_preguntas: plantilla.peso_preguntas,
        config_baremo: plantilla.config_baremo === null ? undefined : plantilla.config_baremo,
        valor_total: plantilla.valor_total,
        id_psicologo: idPsicologo,
        id_usuario: data.id_paciente,
        preguntas: {
          create: plantilla.preguntas.map(preguntaPlantilla => ({
            id_tipo: preguntaPlantilla.id_tipo,
            texto_pregunta: preguntaPlantilla.texto_pregunta,
            orden: preguntaPlantilla.orden,
            obligatoria: preguntaPlantilla.obligatoria,
            peso: preguntaPlantilla.peso,
            baremo_detalle: preguntaPlantilla.baremo_detalle === null ? undefined : preguntaPlantilla.baremo_detalle,
            placeholder: preguntaPlantilla.placeholder,
            min: preguntaPlantilla.min,
            max: preguntaPlantilla.max,
            paso: preguntaPlantilla.paso,
            eva_psi: preguntaPlantilla.eva_psi,
            id_gru_pre: preguntaPlantilla.grupoPreguntaPlantilla?.id ? 
              gruposMap.get(preguntaPlantilla.grupoPreguntaPlantilla.id) : undefined,
            opciones: {
              create: preguntaPlantilla.opciones.map(opcionPlantilla => ({
                texto: opcionPlantilla.texto,
                valor: opcionPlantilla.valor,
                orden: opcionPlantilla.orden,
                es_otro: opcionPlantilla.es_otro
              }))
            }
          }))
        }
      },
      include: {
        preguntas: {
          include: {
            opciones: true,
            tipo: true,
            grupoPregunta: true
          }
        }
      }
    });

    // Calcular el progreso del test
    const testConProgreso = {
      ...nuevoTest,
      progreso: await calcularProgreso(nuevoTest.id, nuevoTest.id_usuario ?? undefined)
    };
      console.log("validando Usuaio,paciente",usuarioAutenticado!= undefined && paciente != undefined,usuarioAutenticado,paciente);
    // Notificaciones y registros
    if (usuarioAutenticado!= undefined && paciente != undefined) {
      // Crear email de notificación
      await prisma.alarma.create({
            data: {
              id_usuario: paciente.id || null,
              id_tipo_alerta: 8,
              mensaje: "Tienes un nuevo test asignado",
              vista: false,
              correo_enviado: false
            }
      });
      
      emitToUser(paciente.id.toString(),'notificationUpdate',{
         usuarioId: paciente.id.toString(),
        unreadCount: 1
      });
      
      setImmediate(async () => {

        console.log("Entro a crear alama elmail");
        const result_email = await create_alarma_email({
          emailParams: {
            to: paciente.email,
            subject: "Tienes una nueva alerta",
            template: "test_asignado",
            props: {
              name: paciente.nombre,
              psicologo_name: usuarioAutenticado.nombre,
              alertMessage: `El psicólogo ${usuarioAutenticado.nombre} te ha asignado un nuevo test: ${nuevoTest.nombre}`
            }
          }
        });
      
        if (!result_email.emailSent) console.error('Error enviando email de notificación', result_email); 
      });

      // Crear registro en registro-usuario
      setImmediate(async () => {
        try {
          const updateRegistro = await RegistroUsuarioService.agregarTestARegistroUsuario(
            paciente.id, 
            nuevoTest.id
          );  
          console.log('Test agregado a registro usuario:', updateRegistro);
        } catch (error) {
          console.error('Error al crear registro:', error);
        }
      });

      // Crear registro de test
      setImmediate(async () => {
        try {
          const testData = {
            test_id: nuevoTest.id,
            usuario_id: nuevoTest.id_usuario!,
            psicologo_id: nuevoTest.id_psicologo,
            fecha_creacion: nuevoTest.fecha_creacion,
            estado: nuevoTest.estado as EstadoTestRegistro,
            nombre_test: nuevoTest.nombre || undefined,
            valor_total: nuevoTest.valor_total || undefined
          };
          
          const nuevoRegistro = await RegistroTestService.createRegistroTest(testData);
          console.log('Registro test creado:', nuevoRegistro);
        } catch (error) {
          console.error('Error al crear registro test:', error);
        }
      });
    }else{
      console.log("Error no se tiene usuario-autenticado o paciente-test-asignado")
    }
    
    return NextResponse.json(
      { 
        message: 'Test asignado correctamente desde plantilla', 
        test: testConProgreso,
        totalPreguntas: plantilla.preguntas.length,
        testAsignado: true
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error en asignación:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Actualizar datos de un paciente
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const id_psicologo = searchParams.get('id_psicologo');

    if (!id_paciente || !id_psicologo) {
      return NextResponse.json(
        { error: 'ID de paciente y psicólogo son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente está asignado al psicólogo
    const paciente = await prisma.usuario.findFirst({
      where: {
        id: parseInt(id_paciente),
        id_psicologo: parseInt(id_psicologo)
      },
      include: {
        tipo_usuario: true
      }
    });

    if (!paciente) {
      return NextResponse.json(
        { error: 'El paciente no está asignado a este psicólogo' },
        { status: 403 }
      );
    }

    const data: DatosPaciente = await request.json();

    // Validar que no se intenten actualizar campos sensibles
    const camposProhibidos = ['password', 'password_iv', 'authToken', 'authTokenExpiry', 'resetPasswordToken', 'resetPasswordTokenExpiry', 'id_tipo_usuario'];
    for (const campo of camposProhibidos) {
      if (data[campo as keyof DatosPaciente] !== undefined) {
        return NextResponse.json(
          { error: `No puedes actualizar el campo ${campo}` },
          { status: 403 }
        );
      }
    }

    // Actualizar datos básicos del usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id_paciente) },
      data: {
        nombre: data.nombre,
        email: data.email,
        cedula: data.cedula,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
        sexo: data.sexo
      }
    });

    // Si es adolescente, actualizar tutor si viene en los datos
    if (data.adolecente) {
      // Actualizar o crear tutor si se proporcionan datos
      if (data.adolecente.tutor) {
        const tutorData = data.adolecente.tutor;
        
        // Si hay un id_tutor, actualizamos ese tutor
        if (data.adolecente.id_tutor) {
          await prisma.tutor.update({
            where: { id: data.adolecente.id_tutor },
            data: {
              nombre_tutor: tutorData.nombre_tutor,
              profesion_tutor: tutorData.profesion_tutor,
              telefono_contacto: tutorData.telefono_contacto,
              correo_contacto: tutorData.correo_contacto,
              sexo: tutorData.sexo,
              parentesco: tutorData.parentesco
            }
          });
        } else if (tutorData.cedula_tutor) {
          // Si no hay id_tutor pero hay cédula, buscamos o creamos
          const tutor = await prisma.tutor.upsert({
            where: { cedula_tutor: tutorData.cedula_tutor },
            update: {
              nombre_tutor: tutorData.nombre_tutor,
              profesion_tutor: tutorData.profesion_tutor,
              telefono_contacto: tutorData.telefono_contacto,
              correo_contacto: tutorData.correo_contacto,
              sexo: tutorData.sexo,
              parentesco: tutorData.parentesco
            },
            create: {
              cedula_tutor: tutorData.cedula_tutor,
              nombre_tutor: tutorData.nombre_tutor || '',
              profesion_tutor: tutorData.profesion_tutor,
              telefono_contacto: tutorData.telefono_contacto,
              correo_contacto: tutorData.correo_contacto,
              sexo: tutorData.sexo,
              parentesco: tutorData.parentesco
            }
          });

          // Actualizamos la relación del adolescente con el tutor
          data.adolecente.id_tutor = tutor.id;
        }
      }

      // Actualizar la relación adolescente-tutor
      if (paciente.tipo_usuario.nombre === 'adolecente') {
        await prisma.adolecente.upsert({
          where: { id_usuario: parseInt(id_paciente) },
          update: {
            id_tutor: data.adolecente.id_tutor
          },
          create: {
            id_usuario: parseInt(id_paciente),
            id_tutor: data.adolecente.id_tutor
          }
        });
      }
    }

    return NextResponse.json(usuarioActualizado);
  } catch (error: any) {
    console.error('Error actualizando paciente:', error);
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

// Desasignar paciente (eliminar relación con psicólogo pero mantener tests)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get('id_paciente');
    const id_psicologo = searchParams.get('id_psicologo');

    if (!id_paciente || !id_psicologo) {
      return NextResponse.json(
        { error: 'ID de paciente y psicólogo son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe y está asignado a este psicólogo
    const paciente = await prisma.usuario.findUnique({
      where: { 
        id: parseInt(id_paciente),
        id_psicologo: parseInt(id_psicologo)
      },
      include: {
        tipo_usuario: true
      }
    });
    const psicologo = await prisma.usuario.findUnique({
      where: { 
        id: parseInt(id_psicologo),
      },
      include: {
        tipo_usuario: true
      }
    });

    if (!paciente) {
      return NextResponse.json(
        { error: 'No existe asignación entre este psicólogo y paciente' },
        { status: 404 }
      );
    }

    // Verificar que el paciente no sea un admin o psicólogo
    if (paciente.tipo_usuario.nombre === 'admin' || paciente.tipo_usuario.nombre === 'psicologo') {
      return NextResponse.json(
        { error: 'No se puede desasignar usuarios con rol admin o psicólogo' },
        { status: 403 }
      );
    }

    // Eliminar solo la relación (id_psicologo = null) manteniendo todos los tests
    await prisma.usuario.update({
      where: { id: parseInt(id_paciente) },
      data: { id_psicologo: null }
    });
    //alarma
    setImmediate().then(async ()=>{
      const result_email = await  create_alarma({
        id_usuario: paciente.id ,
        id_tipo_alerta: null,
        mensaje: `El psicologo ${psicologo?.nombre}, le a dado de alta respecto a sus servicios.`,
        vista: false,
        correo_enviado: true,
      });
      
    if (!result_email) console.error('Error al enviar email, test.',result_email); 
    });

    //update registro dar alta
    setImmediate().then(async ()=>{
    try {
      const updateRegistro = await RegistroUsuarioService.cambiarPsicologo(paciente.id,null);  
      console.log('Update a registro:', updateRegistro);
    } catch (error) {
      console.error('Error al crear registro:', error);
    }
    });  
    return NextResponse.json(
      { 
        message: 'Paciente desasignado correctamente',
        detail: 'Los tests asociados se mantienen en el sistema'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error desasignando paciente:', error);
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