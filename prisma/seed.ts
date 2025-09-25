import { PrismaClient, EstadoCita } from "../app/generated/prisma";
import { encriptar } from "@/app/lib/crytoManager";

const prisma = new PrismaClient();

enum TipoPreguntaNombre {
  OPCION_UNICA= 'radio',
  OPCION_MULTIPLE = 'checkbox',
  RESPUESTA_CORTA = 'text',
  SELECT = 'select',
  RANGO = 'range'
}

const tiposCitaData = [
  {
    nombre: "Evaluación Inicial",
    descripcion: "Primera sesión de evaluación psicológica",
    duracion: 60, // 60 minutos
    color_calendario: "#FF6B6B" // Rojo claro
  },
  {
    nombre: "Seguimiento",
    descripcion: "Sesión regular de seguimiento terapéutico",
    duracion: 45,
    color_calendario: "#4ECDC4" // Turquesa
  },
  {
    nombre: "Emergencia",
    descripcion: "Sesión para casos urgentes",
    duracion: 30,
    color_calendario: "#FFA500" // Naranja
  },
  {
    nombre: "Taller Grupal",
    descripcion: "Sesión grupal educativa",
    duracion: 90,
    color_calendario: "#A5D8FF" // Azul claro
  },
  {
    nombre: "Revisión de Resultados",
    descripcion: "Discusión de resultados de tests",
    duracion: 30,
    color_calendario: "#C8E6C9" // Verde claro
  }
];

const tipoUsuarioData = [
  {
    nombre: "administrador",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/usuarios", name: "Usuarios", icon: "people" },
      { path: "/cita", name: "Cita", icon: "cita" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/registro", name: "Registro", icon: "registro" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "psicologo",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/pacientes", name: "Pacientes", icon: "medical_services" },
      { path: "/cita", name: "Cita", icon: "cita" },
      { path: "/registro", name: "Registro", icon: "registro" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "adolecente",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/cita", name: "Cita", icon: "cita" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "usuario",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/cita", name: "Cita", icon: "cita" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "secretaria",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/cita", name: "Cita", icon: "cita" },
      { path: "/registro", name: "Registro", icon: "registro" },
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

function generarCitasDeEjemplo() {
  const ahora = new Date();
  const citas = [];
  
  // Citas pasadas
  for (let i = 1; i <= 5; i++) {
    const fechaInicio = new Date(ahora);
    fechaInicio.setDate(ahora.getDate() - i);
    fechaInicio.setHours(10 + i, 0, 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + 45);
    
    citas.push({
      titulo: `Sesión de seguimiento ${i}`,
      descripcion: `Sesión regular #${i} con el paciente`,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: i % 2 === 0 ? EstadoCita.COMPLETADA : EstadoCita.CANCELADA,
      id_psicologo: 2, // Psicólogo 1
      id_paciente: 4,  // Adolescente 1
      id_tipo_cita: 2, // Seguimiento
      duracion_real: i % 2 === 0 ? 50 : null,
      notas_psicologo: i % 2 === 0 ? `El paciente mostró mejoría en los puntos discutidos. Se recomienda continuar con el tratamiento.` : null
    });
  }
  
  // Citas futuras
  for (let i = 1; i <= 10; i++) {
    const fechaInicio = new Date(ahora);
    fechaInicio.setDate(ahora.getDate() + i);
    
    // Variar las horas
    const hora = 9 + (i % 4);
    fechaInicio.setHours(hora, 0, 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    const duracion = [30, 45, 60, 90][i % 4];
    fechaFin.setMinutes(fechaFin.getMinutes() + duracion);
    
    // Alternar entre psicólogos y pacientes
    const psicologoId = i % 2 === 0 ? 2 : 3; // Alternar entre psicólogo 1 y 2
    const pacienteId = i % 2 === 0 ? 4 : 5; // Alternar entre adolescente 1 y 2
    
    citas.push({
      titulo: `Cita ${i}`,
      descripcion: `Descripción de la cita ${i}`,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: EstadoCita.PENDIENTE,
      id_psicologo: psicologoId,
      id_paciente: pacienteId,
      id_tipo_cita: (i % 5) + 1, // Rotar entre los tipos de cita
      recordatorios: {
        create: [
          {
            metodo: "EMAIL",
            fecha_envio: new Date(new Date(fechaInicio).setHours(fechaInicio.getHours() - 24)),
            estado: "PENDIENTE"
          },
          {
            metodo: "NOTIFICACION",
            fecha_envio: new Date(new Date(fechaInicio).setHours(fechaInicio.getHours() - 2)),
            estado: "PENDIENTE"
          }
        ]
      }
    });
  }
  
  return citas;
}

const contraseñaEncriptada = encriptar("123456789J*Aa");

const dataUsuarios = [
  // Administrador
  {
    email: "admin@example.com",
    password: contraseñaEncriptada.contenido,
    password_iv: contraseñaEncriptada.iv,
    nombre: "Admin Principal",
    cedula: "111111111",
    telefono:"11111111111",
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
    telefono:"222222222",
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
    telefono:"33333333",
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
    telefono:"444444444",
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
    telefono:"666666666",
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
    telefono:"999999999",
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
    telefono:"777777777",
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


// Datos para el test de Habilidades de Estudio
const habilidadesEstudioData = {
  nombre: "ENCUESTA SOBRE LAS HABILIDADES DE ESTUDIO (BROWN, 1978)",
  instrucciones: `La presente encuesta está formada por tres breves cuestionarios, en los cuales puedes indicar los problemas referentes a organización, técnicas y motivación al estudio, que quizás perjudican tu rendimiento académico. Si contestas todas las preguntas con sinceridad y reflexión, podrás identificar mucho de tus actuales defectos al estudiar. Cada cuestionario contiene veinte preguntas, a las que se contestará con "SÍ" o "NO". No hay respuestas correctas o incorrectas, ya que queremos conocer tu modo de actuar y tus actitudes personales con respecto al estudio. Responde tan rápido como puedas, sin dedicar demasiado tiempo a una sola pregunta. No omitas ninguna de ellas.`,
  secciones: [
    {
      nombre: "Organización de estudio",
      preguntas: [
        "¿Sueles dejar para último momento la preparación de tus trabajos?",
        "¿Crees que el sueño o el cansancio te impiden estudiar eficazmente en muchas ocasiones?",
        "¿Es frecuente que no termines tus tareas escolares a tiempo?",
        "¿Tiendes a emplear tiempo en leer revistas, ver televisión o charlas cuando deberías dedicarlo a estudiar?",
        "Tus actividades sociales o deportivas ¿te llevan a descuidar a menudo tus tareas escolares?",
        "¿Sueles dejar pasar un día o más antes de repasar los apuntes tomados en clase?",
        "¿Sueles dedicar tu tiempo libre, entre ocho de la mañana y cuatro de la tarde, a otras actividades que no sea estudiar?",
        "¿Descubres algunas veces de súbito que debes entregar una tarea antes de lo que creías?",
        "¿Te retrasas con frecuencia en una materia debido a que tienes que estudiar otra?",
        "¿Te parece que tu rendimiento es muy bajo en relación con el tiempo que dedicas al estudio?",
        "¿Está situado tu escritorio directamente frente a una ventana, puerta u otra fuente de distracción?",
        "¿Sueles tener fotografías, trofeos o recuerdos sobre tu mesa de escritorio?",
        "¿Sueles estudiar recostado en la cama o arrellanado en un asiento cómodo?",
        "¿Produce resplandor la lámpara que utilizas al estudiar?",
        "Tu mesa de estudio ¿está tan desordenada y llena de objetos que no dispones de sitio suficiente para estudiar con eficacia?",
        "¿Suelen interrumpir tu estudio personas que vienen a visitarte?",
        "¿Estudias con frecuencia mientras tienes puesta la televisión, la radio o un equipo de sonido?",
        "En el lugar donde estudias ¿se pueden ver con facilidad revistas, fotos o materiales pertenecientes a tu afición?",
        "¿Con frecuencia interrumpen tu estudio actividades o ruidos que provienen del exterior?",
        "¿Suele hacerse lento tu estudio debido a que no tienes a la mano los libros y materiales necesarios?"
      ]
    },
    {
      nombre: "Técnicas de estudio",
      preguntas: [
        "¿Tiendes a comenzar la lectura de un libro de texto sin hojear previamente los subtítulos y las ilustraciones?",
        "¿Te saltas por lo general las figuras, gráficos y tablas cuando estudias un tema?",
        "¿Suele serte difícil seleccionar los puntos más importantes de los temas de estudio?",
        "¿Te sorprendes con cierta frecuencia pensando en algo que no tiene nada que ver con lo que estudias?",
        "¿Sueles tener dificultad en entender tus apuntes de clase cuando tratas de repasarlos después de cierto tiempo?",
        "Al tomar notas ¿Te sueles quedar retrasado con frecuencia debido a que no puedes escribir con suficiente rapidez?",
        "Poco después de comenzar un curso ¿sueles encontrarte con que tus apuntes están desordenados y no los entiendes?",
        "¿Tomas normalmente tus apuntes tratando de escribir las palabras exactas del profesor?",
        "Cuando tomas notas de un libro ¿tienes la costumbre de copiar el material necesario, palabra por palabra?",
        "¿Te es difícil en general seleccionar un tema apropiado para un ensayo o informe?",
        "¿Sueles tener problemas para organizar el contenido de un ensayo o informe?",
        "¿Sueles preparar el esquema de un trabajo de ese tipo después de haberlo redactado?",
        "¿Te preparas a veces para un examen memorizando fórmulas, definiciones o reglas que no entiendes con claridad?",
        "¿Te resulta difícil decidir qué estudiar y cómo estudiarlo cuando preparas un examen de opción múltiple?",
        "¿Sueles tener dificultades para organizar en un orden lógico las materias que debes estudiar por unidades?",
        "Al preparar exámenes ¿sueles estudiar toda la asignatura en el último momento?",
        "¿Sueles entregar tus exámenes sin revisarlos detenidamente para ver si tienen algún error cometido por descuido?",
        "¿Te es imposible con frecuencia terminar la exposición de un tema en el tiempo prescrito?",
        "¿Sueles perder puntos en exámenes con preguntas de 'verdadero-falso' debido a que no las lees detenidamente?",
        "¿Empleas normalmente mucho tiempo en contestar la primera mitad de la prueba y tienes que apresurarte en la segunda?"
      ]
    },
    {
      nombre: "Motivación para el estudio",
      preguntas: [
        "Después de los primeros días o semanas del curso ¿tiendes a perder interés por el estudio?",
        "¿Crees que en general basta estudiar lo necesario para obtener un 'aprobado' en las asignaturas?",
        "¿Te sientes frecuentemente confuso e indeciso sobre cuáles deben ser tus metas formativas y profesionales?",
        "¿Sueles pensar que no vale la pena el tiempo y el esfuerzo que son necesarios para lograr una educación universitaria?",
        "¿Crees que es más importante divertirte y disfrutar de la vida que estudiar?",
        "¿Sueles pasar el tiempo en clase en divagaciones o soñando despierto en lugar de atender al profesor?",
        "¿Te sientes habitualmente incapaz de concentrarte en tus estudios debido a que estás inquieto, aburrido o de mal humor?",
        "¿Piensas con frecuencia que las materias que estudias tienen poco valor práctico para ti?",
        "¿Sientes frecuentes deseos de abandonar la universidad y conseguir trabajo?",
        "¿Sueles tener la sensación de que lo que se enseña en los centros docentes no te prepara para afrontar los problemas de la vida adulta?",
        "¿Sueles dedicarte a estudiar de modo casual, según el estado de ánimo en que te encuentres?",
        "¿Te horroriza estudiar libros de texto porque son aburridos?",
        "¿Esperas normalmente a que se te fije la fecha de un examen para comenzar a estudiar los libros de texto o a repasar tus apuntes de clase?",
        "¿Sueles pensar que los exámenes son pruebas penosas de las que no se puede escapar y respecto a las cuales lo que debe hacerse es sobrevivir del modo que sea?",
        "¿Sientes con frecuencia que tus profesores no comprenden las necesidades e intereses de los estudiantes?",
        "¿Tienes normalmente la sensación de que tus profesores exigen demasiadas horas de estudio fuera de clase?",
        "¿Dudas por lo general en pedir ayuda a tus profesores en tareas que te son difíciles?",
        "¿Sueles pensar que tus profesores no tienen contacto con los temas y sucesos de actualidad?",
        "¿Te sientes reacio por lo general a hablar con tus profesores de tus proyectos futuros, de estudio o profesionales?",
        "¿Criticas con frecuencia a tus profesores cuando charlan con sus compañeros?"
      ]
    }
  ]
};

async function crearPlantillaHabilidadesEstudioGlobal() {
  console.log("Creando plantilla global de Habilidades de Estudio...");

  try {
    // 1. Primero creamos la plantilla base
    const plantilla = await prisma.testPlantilla.create({
      data: {
        nombre: habilidadesEstudioData.nombre,
        estado: "COMPLETADO",
        peso_preguntas: "SIN_VALOR",
        es_global: true,
        id_psicologo: null,
      }
    });

    console.log(`Plantilla base creada con ID: ${plantilla.id}`);

    // 2. Creamos los grupos de preguntas para cada sección
    const gruposCreados = [];
    for (const [seccionIndex, seccion] of habilidadesEstudioData.secciones.entries()) {
      const grupo = await prisma.grupoPreguntaPlantilla.create({
        data: {
          nombre: seccion.nombre,
          // No hay relación directa con testPlantilla en el modelo
        }
      });
      gruposCreados.push(grupo);
      console.log(`Grupo creado: ${grupo.nombre} (ID: ${grupo.id})`);
    }

    // 3. Creamos las preguntas con sus opciones y las asociamos a los grupos
    for (const [seccionIndex, seccion] of habilidadesEstudioData.secciones.entries()) {
      const grupo = gruposCreados[seccionIndex];
      
      for (const [preguntaIndex, preguntaTexto] of seccion.preguntas.entries()) {
        const orden = (seccionIndex * 20) + preguntaIndex + 1;
        
        await prisma.preguntaPlantilla.create({
          data: {
            id_test: plantilla.id,
            id_gru_pre: grupo.id,
            texto_pregunta: preguntaTexto,
            id_tipo: 1, // Tipo radio (Sí/No)
            orden: orden,
            obligatoria: true,
            opciones: {
              create: [
                { texto: "Sí", valor: "si", orden: 1 },
                { texto: "No", valor: "no", orden: 2 }
              ]
            }
          }
        });
        console.log(`Pregunta ${orden} creada en grupo ${grupo.nombre}`);
      }
    }

    // 4. Obtenemos la plantilla completa con toda su estructura
    const plantillaCompleta = await prisma.testPlantilla.findUnique({
      where: { id: plantilla.id },
      include: {
        preguntas: {
          include: {
            opciones: true,
            grupoPreguntaPlantilla: true
          },
          orderBy: { orden: 'asc' }
        },
      }
    });

    console.log(`Plantilla global creada exitosamente con ID: ${plantilla.id}`);
    return plantillaCompleta;

  } catch (error) {
    console.error("Error al crear la plantilla:", error);
    throw error;
  }
}

async function main() {
  console.log("eliminando datos existentes...");
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
  await prisma.recordatorioCita.deleteMany({});
  await prisma.cita.deleteMany({});
  await prisma.tipoCita.deleteMany({});

  console.log("todos los datos existentes eliminados");

  // 1. Primero crear tipos de usuario
  console.log("creando tipos de usuario...");
  for (const tipoUsuario of tipoUsuarioData) {
    await prisma.tipoUsuario.create({
      data: {
        nombre: tipoUsuario.nombre,
        menu: tipoUsuario.menu
      }
    });
  }

  // 2. Luego crear tipos de alerta (que dependen de tipos de usuario)
  console.log("creando tipos de alerta...");
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
  console.log("creando tipos de pregunta...");
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
  console.log("creando usuarios y relaciones...");
  for (const usuario of dataUsuarios) {
    await prisma.usuario.create({
      data: usuario
    });
  }

  // 5. Actualizar relaciones psicólogo-paciente
  console.log("actualizando relaciones psicólogo-paciente...");
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
  console.log("creando alarmas de prueba...");
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

    // 7. Crear tipos de cita
  console.log("creando tipos de cita...");
  for (const tipoCita of tiposCitaData) {
    await prisma.tipoCita.create({
      data: tipoCita
    });
  }

  // 8. Crear citas de ejemplo
  console.log("creando citas de ejemplo...");
  const citasEjemplo = generarCitasDeEjemplo();
  
  for (const cita of citasEjemplo) {
    await prisma.cita.create({
      data: cita
    });
  }



  // Crear plantillas de tests para psicólogos
  console.log("creando plantilla de tests...");

await crearPlantillaHabilidadesEstudioGlobal();

  console.log("seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });