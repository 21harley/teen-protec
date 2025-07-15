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
  { 
    nombre: "Test asignado", 
    url_destino: "/test",
    id_tipo_usuario: 3 // Adolecente
  },
  { 
    nombre: "Test completado", 
    url_destino: "/pacientes",
    id_tipo_usuario: 2 // Psicólogo
  },
  { 
    nombre: "Test por revisar", 
    url_destino: "/pacientes",
    id_tipo_usuario: 2 // Psicólogo
  },
  { 
    nombre: "Nuevo paciente asignado", 
    url_destino: "/pacientes",
    id_tipo_usuario: 2 // Psicólogo
  },
  { 
    nombre: "Datos actualizados", 
    url_destino: "/perfil",
    id_tipo_usuario: 3 // Adolecente
  },
  { 
    nombre: "Paciente dado de alta", 
    url_destino: "/pacientes",
    id_tipo_usuario: 2 // Psicólogo
  },
  { 
    nombre: "Alerta de sistema", 
    url_destino: "/alertas",
    id_tipo_usuario: 1 // Administrador
  },
  //sin id es de uso general
  { 
    nombre: "Bienvenido!.", 
    url_destino: "/",
  },
  { 
    nombre: "Recuperación de contraseña.", 
    url_destino: "/",
  }
];

const tiposPreguntaData = [
  {
    nombre: "radio",
    descripcion: "Pregunta con opciones de selección única",
    tipo_respuesta: "opcion"
  },
  {
    nombre: "checkbox",
    descripcion: "Pregunta con opciones de selección múltiple",
    tipo_respuesta: "opcion_multiple"
  },
  {
    nombre: "text",
    descripcion: "Pregunta con respuesta de texto",
    tipo_respuesta: "texto"
  },
  {
    nombre: "select",
    descripcion: "Pregunta con desplegable de opciones",
    tipo_respuesta: "opcion"
  },
  {
    nombre: "range",
    descripcion: "Pregunta con respuesta en rango numérico",
    tipo_respuesta: "numero"
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
    sexo: "Masculino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null
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
    sexo: "Femenino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
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
    sexo: "Masculino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
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
  // Adolescente 1 (Paciente del Psicólogo 1)
  {
    email: "adolescente1@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Ana López",
    cedula: "444444444",
    fecha_nacimiento: new Date("2008-07-22"),
    id_tipo_usuario: 3,
    id_psicologo: 2, // Asignado al Psicólogo 1 (Dra. María González)
    sexo: "Femenino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula_tutor: "555555555",
            nombre_tutor: "Juan López",
            profesion_tutor: "Ingeniero",
            telefono_contacto: "+111222333",
            correo_contacto: "juan.lopez@example.com",
            sexo: "Masculino",
            parentesco: "Padre"
          }
        }
      }
    }
  },
  // Adolescente 2 (Paciente del Psicólogo 2)
  {
    email: "adolescente2@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Pedro Ramírez",
    cedula: "666666666",
    fecha_nacimiento: new Date("2007-11-05"),
    id_tipo_usuario: 3,
    id_psicologo: 3, // Asignado al Psicólogo 2 (Dr. Carlos Méndez)
    sexo: "Masculino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula_tutor: "888888888",
            nombre_tutor: "Marta Ramírez",
            profesion_tutor: "Médico",
            telefono_contacto: "+444555666",
            correo_contacto: "marta.ramirez@example.com",
            sexo: "Femenino",
            parentesco: "Madre"
          }
        }
      }
    }
  },
  // Adolescente 3 (Paciente del Psicólogo 1)
  {
    email: "adolescente3@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Carlos Sánchez",
    cedula: "999999999",
    fecha_nacimiento: new Date("2009-02-15"),
    id_tipo_usuario: 3,
    id_psicologo: 2, // Asignado al Psicólogo 1 (Dra. María González)
    sexo: "Masculino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
    adolecente: {
      create: {
        tutor: {
          create: {
            cedula_tutor: "101010101",
            nombre_tutor: "Luisa Sánchez",
            profesion_tutor: "Abogado",
            telefono_contacto: "+777888999",
            correo_contacto: "luisa.sanchez@example.com",
            sexo: "Femenino",
            parentesco: "Madre"
          }
        }
      }
    }
  },
  // Usuario básico (Paciente del Psicólogo 2)
  {
    email: "usuario@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Laura Fernández",
    cedula: "777777777",
    fecha_nacimiento: new Date("1995-04-30"),
    id_tipo_usuario: 4,
    id_psicologo: 3, // Asignado al Psicólogo 2 (Dr. Carlos Méndez)
    sexo: "Femenino",
    authToken: null,
    authTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null
  }
];

// Datos de preguntas y opciones para tests
const preguntasTest = [
  {
    texto_pregunta: "¿Cómo te has sentido durante la última semana?",
    id_tipo: 1, // radio
    orden: 1,
    obligatoria: true,
    peso: 1.0,
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
    peso: 0.8,
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
    peso: 0.5,
    placeholder: "Escribe aquí tu respuesta..."
  },
  {
    texto_pregunta: "¿Cómo calificarías tu nivel de estrés actual?",
    id_tipo: 5, // range
    orden: 4,
    obligatoria: true,
    peso: 1.2,
    min: 1,
    max: 10,
    paso: 1
  },
  {
    texto_pregunta: "¿Con qué frecuencia te sientes abrumado/a?",
    id_tipo: 4, // select
    orden: 5,
    obligatoria: true,
    peso: 1.0,
    opciones: [
      { texto: "Nunca", valor: "nunca", orden: 1 },
      { texto: "Rara vez", valor: "rara_vez", orden: 2 },
      { texto: "A veces", valor: "a_veces", orden: 3 },
      { texto: "Frecuentemente", valor: "frecuentemente", orden: 4 },
      { texto: "Siempre", valor: "siempre", orden: 5 }
    ]
  }
];

async function main() {
  console.log("🧹 Eliminando datos existentes...");
  // Eliminar datos existentes en el orden correcto para evitar violaciones de FK
  await prisma.respuesta.deleteMany({});
  await prisma.opcion.deleteMany({});
  await prisma.opcionPlantilla.deleteMany({});
  await prisma.pregunta.deleteMany({});
  await prisma.preguntaPlantilla.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.testPlantilla.deleteMany({});
  await prisma.redSocialPsicologo.deleteMany({});
  await prisma.psicologo.deleteMany({});
  await prisma.adolecente.deleteMany({});
  await prisma.tutor.deleteMany({});
  await prisma.alarma.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.tipoPregunta.deleteMany({});
  await prisma.tipoAlerta.deleteMany({});
  await prisma.tipoUsuario.deleteMany({});

  console.log("✅ Todos los datos existentes eliminados");

  // 1. Primero crear tipos de usuario
  console.log("🔧 Creando tipos de usuario...");
  for (const tipoUsuario of tipoUsuarioData) {
    await prisma.tipoUsuario.create({
      data: {
        nombre: tipoUsuario.nombre,
        menu: tipoUsuario.menu
      }
    });
  }

  // 2. Luego crear tipos de alerta (que dependen de tipos de usuario)
  console.log("🔔 Creando tipos de alerta...");
  for (const tipoAlerta of tipoAlertaData) {
    await prisma.tipoAlerta.create({
      data: {
        nombre: tipoAlerta.nombre,
        url_destino: tipoAlerta.url_destino,
        id_tipo_usuario: tipoAlerta.id_tipo_usuario
      }
    });
  }

  // 3. Crear tipos de pregunta (no tienen dependencias)
  console.log("❓ Creando tipos de pregunta...");
  for (const tipoPregunta of tiposPreguntaData) {
    await prisma.tipoPregunta.create({
      data: {
        nombre: tipoPregunta.nombre,
        descripcion: tipoPregunta.descripcion,
        tipo_respuesta: tipoPregunta.tipo_respuesta
      }
    });
  }

  // 4. Crear usuarios con sus relaciones
  console.log("👥 Creando usuarios y relaciones...");
  for (const usuario of dataUsuarios) {
    await prisma.usuario.create({
      data: usuario
    });
  }

  // 5. Actualizar relaciones psicólogo-paciente
  console.log("👨‍⚕️ Actualizando relaciones psicólogo-paciente...");
  await prisma.usuario.update({
    where: { id: 4 }, // Adolescente 1
    data: {
      psicologoPacientes: { connect: { id: 2 } } // Psicólogo 1
    }
  });

  await prisma.usuario.update({
    where: { id: 5 }, // Adolescente 2
    data: {
      psicologoPacientes: { connect: { id: 3 } } // Psicólogo 2
    }
  });

  await prisma.usuario.update({
    where: { id: 6 }, // Adolescente 3
    data: {
      psicologoPacientes: { connect: { id: 2 } } // Psicólogo 1
    }
  });

  await prisma.usuario.update({
    where: { id: 7 }, // Usuario básico
    data: {
      psicologoPacientes: { connect: { id: 3 } } // Psicólogo 2
    }
  });

  // 6. Crear alarmas de prueba según los flujos descritos
  console.log("🚨 Creando alarmas de prueba...");
  await prisma.alarma.createMany({
    data: [
      // Test asignado (para adolescente)
      {
        id_usuario: 4, // Adolescente 1
        id_tipo_alerta: 1, // Test asignado
        mensaje: "Se te ha asignado un nuevo test de evaluación psicológica",
        vista: false,
        fecha_vista: null
      },
      // Test completado (para psicólogo)
      {
        id_usuario: 2, // Psicólogo 1
        id_tipo_alerta: 2, // Test completado
        mensaje: "Ana López ha completado el test de evaluación",
        vista: false,
        fecha_vista: null
      },
      // Test por revisar (para psicólogo)
      {
        id_usuario: 2, // Psicólogo 1
        id_tipo_alerta: 3, // Test por revisar
        mensaje: "Tienes 1 test pendiente de revisión",
        vista: false,
        fecha_vista: null
      },
      // Nuevo paciente asignado (para psicólogo)
      {
        id_usuario: 3, // Psicólogo 2
        id_tipo_alerta: 4, // Nuevo paciente asignado
        mensaje: "Se te ha asignado un nuevo paciente: Laura Fernández",
        vista: false,
        fecha_vista: null
      },
      // Datos actualizados (para adolescente)
      {
        id_usuario: 5, // Adolescente 2
        id_tipo_alerta: 5, // Datos actualizados
        mensaje: "Tus datos personales han sido actualizados",
        vista: false,
        fecha_vista: null
      },
      // Paciente dado de alta (para psicólogo)
      {
        id_usuario: 2, // Psicólogo 1
        id_tipo_alerta: 6, // Paciente dado de alta
        mensaje: "Carlos Sánchez ha sido dado de alta del sistema",
        vista: false,
        fecha_vista: null
      },
      // Alerta de sistema (para admin)
      {
        id_usuario: 1, // Admin
        id_tipo_alerta: 7, // Alerta de sistema
        mensaje: "Se ha detectado un intento de acceso no autorizado",
        vista: false,
        fecha_vista: null
      }
    ]
  });

  // Función para crear tests con preguntas y opciones
  async function crearTestCompleto(idPsicologo: number | null, idUsuario: number, estado: 'NO_INICIADO' | 'EN_PROGRESO' | 'COMPLETADO', pesoPreguntas: 'SIN_VALOR' | 'IGUAL_VALOR' | 'BAREMO') {
    const test = await prisma.test.create({
      data: {
        nombre: `Test de evaluación psicológica - ${new Date().toLocaleDateString()}`,
        estado: estado,
        peso_preguntas: pesoPreguntas,
        config_baremo: pesoPreguntas === 'BAREMO' ? {
          niveles: [
            { min: 0, max: 10, resultado: "Bajo riesgo" },
            { min: 11, max: 20, resultado: "Riesgo moderado" },
            { min: 21, max: 30, resultado: "Alto riesgo" }
          ]
        } : undefined,
        valor_total: pesoPreguntas !== 'SIN_VALOR' ? 5.0 : null,
        id_psicologo: idPsicologo,
        id_usuario: idUsuario,
        preguntas: {
          create: preguntasTest.map(pregunta => ({
            texto_pregunta: pregunta.texto_pregunta,
            id_tipo: pregunta.id_tipo,
            orden: pregunta.orden,
            obligatoria: pregunta.obligatoria,
            peso: pesoPreguntas !== 'SIN_VALOR' ? pregunta.peso : null,
            baremo_detalle: pesoPreguntas === 'BAREMO' ? {
              valor: pregunta.peso,
              descripcion: "Peso según baremo"
            } : null,
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

    if (estado !== 'NO_INICIADO') {
      const fechaUltimaRespuesta = new Date();
      
      for (const pregunta of test.preguntas) {
        if (pregunta.opciones.length > 0) {
          const opcionSeleccionada = pregunta.opciones[Math.floor(Math.random() * pregunta.opciones.length)];
          
          await prisma.respuesta.create({
            data: {
              id_test: test.id,
              id_pregunta: pregunta.id,
              id_usuario: idUsuario,
              id_opcion: opcionSeleccionada.id,
              texto_respuesta: pregunta.id_tipo === 2 ? "Otra información" : null,
              valor_rango: pregunta.id_tipo === 5 ? Math.floor(Math.random() * 10) + 1 : null,
              fecha: fechaUltimaRespuesta
            }
          });
        } else if (pregunta.id_tipo === 3) {
          await prisma.respuesta.create({
            data: {
              id_test: test.id,
              id_pregunta: pregunta.id,
              id_usuario: idUsuario,
              texto_respuesta: "Esta es una respuesta de ejemplo para la pregunta de texto.",
              fecha: fechaUltimaRespuesta
            }
          });
        }
      }

      await prisma.test.update({
        where: { id: test.id },
        data: {
          fecha_ultima_respuesta: fechaUltimaRespuesta
        }
      });
    }

    return test;
  }

  // Función para crear plantillas de tests
  async function crearPlantillaTest(idPsicologo: number) {
    const plantilla = await prisma.testPlantilla.create({
      data: {
        nombre: "Plantilla de evaluación estándar",
        estado: "COMPLETADO",
        peso_preguntas: "IGUAL_VALOR",
        config_baremo: {
          niveles: [
            { min: 0, max: 10, resultado: "Bajo riesgo" },
            { min: 11, max: 20, resultado: "Riesgo moderado" },
            { min: 21, max: 30, resultado: "Alto riesgo" }
          ]
        },
        valor_total: 5.0,
        id_psicologo: idPsicologo,
        preguntas: {
          create: preguntasTest.map(pregunta => ({
            texto_pregunta: pregunta.texto_pregunta,
            id_tipo: pregunta.id_tipo,
            orden: pregunta.orden,
            obligatoria: pregunta.obligatoria,
            peso: pregunta.peso,
            baremo_detalle: {
              valor: pregunta.peso,
              descripcion: "Peso según baremo"
            },
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
      }
    });

    return plantilla;
  }

  // Crear tests para diferentes usuarios
  console.log("📝 Creando tests de ejemplo...");
  
  await crearTestCompleto(2, 4, 'COMPLETADO', 'IGUAL_VALOR'); // Test completado para adolescente 1
  await crearTestCompleto(3, 5, 'EN_PROGRESO', 'BAREMO'); // Test en progreso para adolescente 2
  await crearTestCompleto(2, 6, 'NO_INICIADO', 'SIN_VALOR'); // Test no iniciado para adolescente 3
  await crearTestCompleto(3, 7, 'COMPLETADO', 'BAREMO'); // Test completado para usuario adulto
  await crearTestCompleto(null, 1, 'EN_PROGRESO', 'IGUAL_VALOR'); // Test en progreso para admin

  // Crear plantillas de tests para psicólogos
  console.log("📋 Creando plantillas de tests...");
  await crearPlantillaTest(2); // Plantilla para psicólogo 1
  await crearPlantillaTest(3); // Plantilla para psicólogo 2

  console.log("✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });