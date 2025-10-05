import { PrismaClient } from "./../../generated/prisma";

const prisma = new PrismaClient();

interface TestValidationResult {
  success: boolean;
  message?: string;
  results?: GroupResult[];
  interpretacion?:String;
  total_puntos?:Number;
}

interface GroupResult {
  grupoId: number;
  grupoNombre: string;
  respuestasNegativas: number;
  totalPreguntas: number;
  interpretacion: string;
}

// Matriz de interpretación basada en tu tabla
const INTERPRETATION_MATRIX = {
  'Organización de estudio': [
    { min: 20, max: 20, interpretation: 'Muy alto' },
    { min: 19, max: 19, interpretation: 'Alto' },
    { min: 18, max: 18, interpretation: 'Encima del promedio' },
    { min: 16, max: 17, interpretation: 'Promedio alto' },
    { min: 14, max: 15, interpretation: 'Promedio' },
    { min: 12, max: 13, interpretation: 'Promedio bajo' },
    { min: 11, max: 11, interpretation: 'Debajo del promedio' },
    { min: 10, max: 10, interpretation: 'Bajo' },
    { min: 0, max: 9, interpretation: 'Muy bajo' }
  ],
  'Técnicas de estudio': [
    { min: 20, max: 20, interpretation: 'Muy alto' },
    { min: 18, max: 19, interpretation: 'Alto' },
    { min: 17, max: 17, interpretation: 'Encima del promedio' },
    { min: 16, max: 16, interpretation: 'Promedio alto' },
    { min: 14, max: 15, interpretation: 'Promedio' },
    { min: 13, max: 13, interpretation: 'Promedio bajo' },
    { min: 12, max: 12, interpretation: 'Debajo del promedio' },
    { min: 11, max: 11, interpretation: 'Bajo' },
    { min: 0, max: 10, interpretation: 'Muy bajo' }
  ],
  'Motivación para el estudio': [
    { min: 20, max: 20, interpretation: 'Muy alto' },
    { min: 19, max: 19, interpretation: 'Alto' },
    { min: 18, max: 18, interpretation: 'Encima del promedio' },
    { min: 17, max: 17, interpretation: 'Promedio alto' },
    { min: 16, max: 16, interpretation: 'Promedio' },
    { min: 15, max: 15, interpretation: 'Promedio bajo' },
    { min: 13, max: 14, interpretation: 'Debajo del promedio' },
    { min: 12, max: 12, interpretation: 'Bajo' },
    { min: 0, max: 11, interpretation: 'Muy bajo' }
  ],
  'Calificación Total en habilidades':[
    { min: 57, max: 60, interpretation: 'Muy alto' },
    { min: 52, max: 56, interpretation: 'Alto' },
    { min: 50, max: 51, interpretation: 'Encima del promedio' },
    { min: 48, max: 49, interpretation: 'Promedio alto' },
    { min: 43, max: 47, interpretation: 'Promedio' },
    { min: 39, max: 42, interpretation: 'Promedio bajo' },
    { min: 37, max: 38, interpretation: 'Debajo del promedio' },
    { min: 34, max: 36, interpretation: 'Bajo' },
    { min: 0, max: 33, interpretation: 'Muy bajo' }
  ]
};

export async function validateTestAndUpdateGroups(testId: number): Promise<TestValidationResult> {
  try {
    // 1. Validar parámetro de entrada
    if (!testId) {
      return {
        success: false,
        message: 'ID de test es requerido'
      };
    }

    // 2. Obtener el test con sus relaciones
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        preguntas: {
          include: {
            grupoPregunta: true,
            opciones: true,
            respuestas: true
          }
        }
      }
    });

    if (!test) {
      return {
        success: false,
        message: 'Test no encontrado'
      };
    }

    // 3. Procesar cada grupo del test
    const gruposIds = test.preguntas
      .map(p => p.id_gru_pre)
      .filter((id): id is number => id !== null);

    const gruposUnicos = [...new Set(gruposIds)];

    const results: GroupResult[] = [];

    for (const grupoId of gruposUnicos) {
      const grupo = await prisma.grupoPregunta.findUnique({
        where: { id: grupoId }
      });

      if (!grupo) continue;

      // 4. Filtrar preguntas de este grupo
      const preguntasDelGrupo = test.preguntas.filter(p => p.id_gru_pre === grupoId);
      
      // 5. Contar respuestas negativas
      let respuestasNegativas = 0;
      
      for (const pregunta of preguntasDelGrupo) {
        for (const respuesta of pregunta.respuestas) {
          const opcion = pregunta.opciones.find(o => o.id === respuesta.id_opcion);
          if (opcion?.valor.toLowerCase() === 'no') {
            respuestasNegativas++;
          }
        }
      }

      // 6. Obtener interpretación basada en la matriz
      const interpretacion = getInterpretationForGroup(grupo.nombre, respuestasNegativas);

      // 7. Actualizar el grupo en la base de datos
      await prisma.grupoPregunta.update({
        where: { id: grupoId },
        data: {
          total_resp_valida: respuestasNegativas,
          total_resp: preguntasDelGrupo.length,
          interpretacion
        }
      });

      results.push({
        grupoId,
        grupoNombre: grupo.nombre,
        respuestasNegativas,
        totalPreguntas: preguntasDelGrupo.length,
        interpretacion
      });
    }

    let total_resultado = 0;
    for(const grupoId of results) total_resultado += grupoId.respuestasNegativas;
    
    let interpretacion_test = getInterpretationForGroup('Calificación Total en habilidades', total_resultado);


    //8. actualizo test
    await prisma.test.update({
        where: { id: testId },
        data: {
          ponderacion_final:total_resultado,
          interp_resul_sis:interpretacion_test,
        }
    });

    return {
      success: true,
      message: 'Test validado exitosamente',
      results,
      interpretacion: interpretacion_test,
      total_puntos:total_resultado
    };

  } catch (error: any) {
    console.error('Error en validateTestAndUpdateGroups:', error);
    return {
      success: false,
      message: error.message || 'Error al validar el test'
    };
  } finally {
    await prisma.$disconnect();
  }
}

function getInterpretationForGroup(grupoNombre: string, respuestasNegativas: number): string {
  console.log(grupoNombre,respuestasNegativas,INTERPRETATION_MATRIX[grupoNombre as keyof typeof INTERPRETATION_MATRIX]);
  const grupoRules = INTERPRETATION_MATRIX[grupoNombre as keyof typeof INTERPRETATION_MATRIX];
  
  if (!grupoRules) {
    return 'Interpretación no disponible';
  }

  const rangoEncontrado = grupoRules.find(
    r => respuestasNegativas >= r.min && respuestasNegativas <= r.max
  );

  return rangoEncontrado?.interpretation || 'Fuera de rango';
}

// Ejemplo de uso:
/*
const result = await validateTestAndUpdateGroups(123);
if (result.success) {
  console.log('Resultados:', result.results);
} else {
  console.error('Error:', result.message);
}
*/