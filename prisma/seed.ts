import { PrismaClient } from "../app/generated/prisma";
import { encriptar } from "@/app/lib/crytoManager";

const prisma = new PrismaClient();

const tipoUsuarioData = [
  {
    nombre: "administrador",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/usuarios", name: "Usuarios", icon: "people" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "psicologo",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/pacientes", name: "Pacientes", icon: "medical_services" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "adolecente",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "usuario",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  }
];

const tipoAlertaData = [
  { nombre: "Test" },
  { nombre: "Asignación de test" },
  { nombre: "Test finalizado" },
  { nombre: "Test por revisar" },
  { nombre: "Alarma" }
];

const tiposPreguntaData = [
  {
    nombre: "radio",
    descripcion: "Pregunta con opciones de selección única"
  },
  {
    nombre: "checkbox",
    descripcion: "Pregunta con opciones de selección múltiple"
  },
  {
    nombre: "text",
    descripcion: "Pregunta con respuesta de texto"
  },
  {
    nombre: "select",
    descripcion: "Pregunta con desplegable de opciones"
  },
  {
    nombre: "range",
    descripcion: "Pregunta con respuesta en rango numérico"
  }
];

const contraseñaEncriptada = encriptar("123456789");

const dataUsuarios = [
  // Administrador
  {
    email: "admin@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Admin Principal",
    cedula: "111111111",
    fecha_nacimiento: new Date("1980-05-15"),
    id_tipo_usuario: 1,
    authTokenExpiry: null
  },
  // Psicólogo 1
  {
    email: "psicologo1@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Dra. María González",
    cedula: "222222222",
    fecha_nacimiento: new Date("1985-08-20"),
    id_tipo_usuario: 2,
    authTokenExpiry: null,
    psicologo: {
      create: {
        numero_de_titulo: "PSI-12345",
        nombre_universidad: "Universidad Central",
        monto_consulta: 50.00,
        telefono_trabajo: "+1234567890",
        redes_sociales: {
          create: [
            { nombre_red: "LinkedIn", url_perfil: "https://linkedin.com/maria-gonzalez" },
            { nombre_red: "Twitter", url_perfil: "https://twitter.com/maria_psi" }
          ]
        }
      }
    }
  },
  // Psicólogo 2
  {
    email: "psicologo2@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Dr. Carlos Méndez",
    cedula: "333333333",
    fecha_nacimiento: new Date("1979-03-10"),
    id_tipo_usuario: 2,
    authTokenExpiry: null,
    psicologo: {
      create: {
        numero_de_titulo: "PSI-67890",
        nombre_universidad: "Universidad Nacional",
        monto_consulta: 60.00,
        telefono_trabajo: "+0987654321",
        redes_sociales: {
          create: [
            { nombre_red: "Facebook", url_perfil: "https://facebook.com/carlospsi" }
          ]
        }
      }
    }
  },
  // Adolescente 1
  {
    email: "adolescente1@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Ana López",
    cedula: "444444444",
    fecha_nacimiento: new Date("2008-07-22"),
    id_tipo_usuario: 3,
    authTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula: "555555555",
            nombre: "Juan López",
            profesion_tutor: "Ingeniero",
            telefono_contacto: "+111222333",
            correo_contacto: "juan.lopez@example.com"
          }
        }
      }
    }
  },
  // Adolescente 2
  {
    email: "adolescente2@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Pedro Ramírez",
    cedula: "666666666",
    fecha_nacimiento: new Date("2007-11-05"),
    id_tipo_usuario: 3,
    authTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula: "888888888",
            nombre: "Marta Ramírez",
            profesion_tutor: "Médico",
            telefono_contacto: "+444555666",
            correo_contacto: "marta.ramirez@example.com"
          }
        }
      }
    }
  },
  // Adolescente 3
  {
    email: "adolescente3@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Carlos Sánchez",
    cedula: "999999999",
    fecha_nacimiento: new Date("2009-02-15"),
    id_tipo_usuario: 3,
    authTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula: "101010101",
            nombre: "Luisa Sánchez",
            profesion_tutor: "Abogado",
            telefono_contacto: "+777888999",
            correo_contacto: "luisa.sanchez@example.com"
          }
        }
      }
    }
  },
  // Usuario básico
  {
    email: "usuario@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Laura Fernández",
    cedula: "777777777",
    fecha_nacimiento: new Date("1995-04-30"),
    id_tipo_usuario: 4,
    authTokenExpiry: null
  }
];

async function main() {
  // Eliminar datos existentes
  await prisma.respuesta.deleteMany({});
  await prisma.opcion.deleteMany({});
  await prisma.pregunta.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.redSocialPsicologo.deleteMany({});
  await prisma.psicologo.deleteMany({});
  await prisma.adolecente.deleteMany({});
  await prisma.tutor.deleteMany({});
  await prisma.alarma.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.tipoPregunta.deleteMany({});
  await prisma.tipoAlerta.deleteMany({});
  await prisma.tipoUsuario.deleteMany({});

  // Crear tipos de usuario
  for (const tipoUsuario of tipoUsuarioData) {
    await prisma.tipoUsuario.create({
      data: {
        nombre: tipoUsuario.nombre,
        menu: tipoUsuario.menu
      }
    });
  }

  // Crear tipos de alerta
  for (const tipoAlerta of tipoAlertaData) {
    await prisma.tipoAlerta.create({
      data: {
        nombre: tipoAlerta.nombre
      }
    });
  }

  // Crear tipos de pregunta
  for (const tipoPregunta of tiposPreguntaData) {
    await prisma.tipoPregunta.create({
      data: {
        nombre: tipoPregunta.nombre,
        descripcion: tipoPregunta.descripcion
      }
    });
  }

  // Crear usuarios con sus relaciones
  for (const usuario of dataUsuarios) {
    await prisma.usuario.create({
      data: usuario
    });
  }

  // Crear alarmas de prueba
  await prisma.alarma.createMany({
    data: [
      {
        id_usuario: 4,
        id_tipo_alerta: 1,
        mensaje: "Posibles síntomas de depresión detectados",
        url_destino: "/test",
        vista: false,
        fecha_vista: null
      },
      {
        id_usuario: 4,
        id_tipo_alerta: 2,
        mensaje: "Se te ha asignado un nuevo test",
        url_destino: "/test",
        vista: false,
        fecha_vista: null
      },
      {
        id_usuario: 5,
        id_tipo_alerta: 3,
        mensaje: "Test completado exitosamente",
        url_destino: "/test",
        vista: false,
        fecha_vista: null
      },
      {
        id_usuario: 2,
        id_tipo_alerta: 4,
        mensaje: "Tienes tests pendientes de revisión",
        url_destino: "/pacientes",
        vista: false,
        fecha_vista: null
      },
      {
        id_usuario: 1, 
        id_tipo_alerta: 5,
        mensaje: "Nuevo test disponible para todos los usuarios",
        url_destino: "/test",
        vista: false,
        fecha_vista: null
      }
    ]
  });

  // Datos de preguntas y opciones para tests
  const preguntasTest = [
    {
      texto_pregunta: "¿Cómo te has sentido durante la última semana?",
      id_tipo: 1, // radio
      orden: 1,
      obligatoria: true,
      opciones: [
        { texto: "Muy bien", valor: "muy_bien", orden: 1 },
        { texto: "Bien", valor: "bien", orden: 2 },
        { texto: "Regular", valor: "regular", orden: 3 },
        { texto: "Mal", valor: "mal", orden: 4 },
        { texto: "Muy mal", valor: "muy_mal", orden: 5 }
      ]
    },
    {
      texto_pregunta: "¿Qué emociones has experimentado recientemente? (Selecciona todas las que apliquen)",
      id_tipo: 2, // checkbox
      orden: 2,
      obligatoria: false,
      opciones: [
        { texto: "Alegría", valor: "alegria", orden: 1 },
        { texto: "Tristeza", valor: "tristeza", orden: 2 },
        { texto: "Enojo", valor: "enojo", orden: 3 },
        { texto: "Miedo", valor: "miedo", orden: 4 },
        { texto: "Ansiedad", valor: "ansiedad", orden: 5 }
      ]
    },
    {
      texto_pregunta: "Describe cómo ha sido tu día hoy",
      id_tipo: 3, // text
      orden: 3,
      obligatoria: false,
      placeholder: "Escribe aquí tu respuesta..."
    },
    {
      texto_pregunta: "¿Cómo calificarías tu nivel de estrés actual?",
      id_tipo: 5, // range
      orden: 4,
      obligatoria: true,
      min: 1,
      max: 10,
      paso: 1
    },
    {
      texto_pregunta: "¿Con qué frecuencia te sientes abrumado/a?",
      id_tipo: 4, // select
      orden: 5,
      obligatoria: true,
      opciones: [
        { texto: "Nunca", valor: "nunca", orden: 1 },
        { texto: "Rara vez", valor: "rara_vez", orden: 2 },
        { texto: "A veces", valor: "a_veces", orden: 3 },
        { texto: "Frecuentemente", valor: "frecuentemente", orden: 4 },
        { texto: "Siempre", valor: "siempre", orden: 5 }
      ]
    }
  ];

  // Función para crear tests con preguntas y opciones
  async function crearTestCompleto(idPsicologo: number, idUsuario: number, estado: 'no_iniciado' | 'en_progreso' | 'completado', progreso: number) {
    const codigoSesion = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const test = await prisma.test.create({
      data: {
        id_psicologo: idPsicologo,
        id_usuario: idUsuario,
        nombre: codigoSesion,
        estado: estado,
        progreso: progreso,
        fecha_creacion: new Date(),
        fecha_ultima_respuesta: estado !== 'no_iniciado' ? new Date() : null,
        preguntas: {
          create: preguntasTest.map(pregunta => ({
            texto_pregunta: pregunta.texto_pregunta,
            id_tipo: pregunta.id_tipo,
            orden: pregunta.orden,
            obligatoria: pregunta.obligatoria,
            placeholder: pregunta.placeholder,
            min: pregunta.min,
            max: pregunta.max,
            paso: pregunta.paso,
            opciones: pregunta.opciones ? {
              create: pregunta.opciones.map(opcion => ({
                texto: opcion.texto,
                valor: opcion.valor,
                orden: opcion.orden,
                es_otro: false
              }))
            } : undefined
          }))
        }
      },
      include: {
        preguntas: {
          include: {
            opciones: true
          }
        }
      }
    });

    // Si el test está completado o en progreso, añadir respuestas
    if (estado !== 'no_iniciado') {
      for (const pregunta of test.preguntas) {
        if (pregunta.opciones.length > 0) {
          // Para preguntas con opciones, seleccionar una al azar
          const opcionSeleccionada = pregunta.opciones[Math.floor(Math.random() * pregunta.opciones.length)];
          
          await prisma.respuesta.create({
            data: {
              id_test: test.id,
              id_pregunta: pregunta.id,
              id_usuario: idUsuario,
              id_opcion: opcionSeleccionada.id,
              texto_respuesta: pregunta.id_tipo === 2 ? "Otra información" : null, // Para checkbox
              valor_rango: pregunta.id_tipo === 5 ? Math.floor(Math.random() * 10) + 1 : null // Para range
            }
          });
        } else if (pregunta.id_tipo === 3) {
          // Para preguntas de texto
          await prisma.respuesta.create({
            data: {
              id_test: test.id,
              id_pregunta: pregunta.id,
              id_usuario: idUsuario,
              texto_respuesta: "Esta es una respuesta de ejemplo para la pregunta de texto."
            }
          });
        }
      }
    }

    return test;
  }

  // Crear tests para diferentes usuarios
  console.log("Creando tests de ejemplo...");
  
  // Test completado para adolescente 1
  await crearTestCompleto(2, 4, 'completado', 100);
  
  // Test en progreso para adolescente 2
  await crearTestCompleto(3, 5, 'en_progreso', 50);
  
  // Test no iniciado para adolescente 3
  await crearTestCompleto(2, 6, 'no_iniciado', 0);
  
  // Test completado para usuario adulto
  await crearTestCompleto(3, 7, 'completado', 100);
  
  // Test en progreso para admin
  await crearTestCompleto(2, 1, 'en_progreso', 75);

  console.log("✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });