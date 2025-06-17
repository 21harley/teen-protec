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
    nombre: "Test",
  },
  {
    nombre: "Asignación de test",
  },
  {
    nombre: "Test finalizado",
  },
  {
    nombre: "Test por revisar",
  },
  {
    nombre: "Alarma",
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
  // Adolescente 3 (nuevo adolescente con tutor)
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
  // Eliminar datos existentes para evitar duplicados
  await prisma.tipoAlerta.deleteMany({});
  await prisma.respuestaTest.deleteMany({});
  await prisma.pregunta.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.redSocialPsicologo.deleteMany({});
  await prisma.psicologo.deleteMany({});
  await prisma.adolecente.deleteMany({});
  await prisma.tutor.deleteMany({});
  await prisma.alarma.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.tipoInput.deleteMany({});
  await prisma.tipoUsuario.deleteMany({});

  // Crear tipos de input
  await prisma.tipoInput.createMany({
    data: [
      { id: 1, nombre: "text", valor: "text" },
      { id: 2, nombre: "radio", valor: "radio" },
      { id: 3, nombre: "select", valor: "select" }
    ]
  });

  // Crear los tipos de usuario con sus menús
  for (const tipoUsuario of tipoUsuarioData) {
    await prisma.tipoUsuario.create({
      data: {
        nombre: tipoUsuario.nombre,
        menu: tipoUsuario.menu
      }
    });
  }

  // Crear usuarios con sus relaciones
  for (const usuario of dataUsuarios) {
    await prisma.usuario.create({
      data: usuario
    });
  }

for (const tipoAlerta of tipoAlertaData) {
  await prisma.tipoAlerta.create({
    data: {
      nombre: tipoAlerta.nombre
    }
  });
}

  // Crear alarmas de prueba
await prisma.alarma.createMany({
  data: [
    {
      id_usuario: 1, // Adolescente 1
      id_tipo_alerta: 1, // Test
      mensaje: "Posibles síntomas de depresión detectados",
      url_destino: "/test",
      vista: false,
      fecha_vista: null
    },
    {
      id_usuario: 4, // Adolescente 1
      id_tipo_alerta: 2, // Asignación de test
      mensaje: "Se te ha asignado un nuevo test",
      url_destino: "/test",
      vista: false,
      fecha_vista: null
    },
    {
      id_usuario: 5, // Adolescente 2
      id_tipo_alerta: 3, // Test finalizado
      mensaje: "Test completado exitosamente",
      url_destino: "/test",
      vista: false,
      fecha_vista: null
    },
    {
      id_usuario: 2, // Psicólogo 1
      id_tipo_alerta: 4, // Test por revisar
      mensaje: "Tienes tests pendientes de revisión",
      url_destino: "/pacientes",
      vista: false,
      fecha_vista: null
    },
    {
      id_usuario: 1, 
      id_tipo_alerta: 5, // Alarma
      mensaje: "Nuevo test disponible para todos los usuarios",
      url_destino: "/test",
      vista: false,
      fecha_vista: null
    }
  ]
});
  // Crear test con preguntas
  const test1 = await prisma.test.create({
    data: {
      id_psicologo: 2, // Psicólogo 1
      codigo_sesion: "TEST123",
      preguntas: {
        create: [
          {
            texto_pregunta: "¿Cómo te sientes hoy?",
            id_tipo_input: 1,
          },
          {
            texto_pregunta: "¿Con qué frecuencia experimentas estos sentimientos?",
            id_tipo_input: 2,
          },
          {
            texto_pregunta: "¿Qué tipo de apoyo necesitarías?",
            id_tipo_input: 3,
          },
          {
            texto_pregunta: "Describe una situación reciente que te haya causado estrés",
            id_tipo_input: 1,
          }
        ]
      }
    }
  });

  // Obtener preguntas creadas
  const preguntasCreadas = await prisma.pregunta.findMany({
    where: { id_test: test1.id }
  });

  // Crear respuestas para el adolescente 1
  for (const pregunta of preguntasCreadas) {
    let respuesta: string | null = null;
    
    if (pregunta.texto_pregunta.includes("sientes hoy")) {
      respuesta = "Me siento un poco cansado";
    } else if (pregunta.texto_pregunta.includes("frecuencia")) {
      respuesta = "A veces";
    } else if (pregunta.texto_pregunta.includes("apoyo")) {
      respuesta = "Apoyo emocional";
    } else if (pregunta.texto_pregunta.includes("situación")) {
      respuesta = "Tuve un examen difícil la semana pasada";
    }

    if (respuesta) {
      await prisma.respuestaTest.create({
        data: {
          id_test: test1.id,
          id_pregunta: pregunta.id,
          id_usuario: 4, // Adolescente 1
          respuesta: respuesta
        }
      });
    }
  }

  console.log("Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });