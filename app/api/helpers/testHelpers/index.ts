import { NextResponse } from 'next/server';
import { PrismaClient } from "./../../../../app/generated/prisma";

const prisma = new PrismaClient()

enum TestStatus {
  NoIniciado = 'no_iniciado',
  EnProgreso = 'en_progreso',
  Completado = 'completado'
}

interface TestBase {
  id_psicologo?: number;
  id_usuario?: number;
  nombre?: string;
  estado?: TestStatus;
  progreso?: number;
  fecha_creacion?: Date | string;
  fecha_ultima_respuesta?: Date | string;
}

interface PreguntaData {
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  paso?: number;
  opciones?: OpcionData[];
}

interface OpcionData {
  texto: string;
  valor: string;
  orden: number;
  es_otro?: boolean;
}

interface RespuestaData {
  id_pregunta: number;
  id_opcion?: number;
  texto_respuesta?: string;
  valor_rango?: number;
}

interface FullTestData extends TestBase {
  preguntas?: PreguntaData[];
  respuestas?: RespuestaData[];
}

interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper mejorado para calcular progreso
export async function calcularProgreso(testId: number, usuarioId?: number): Promise<number> {
  try {
    // Obtener todas las preguntas con sus tipos
    const preguntas = await prisma.pregunta.findMany({
      where: { id_test: testId },
      include: { tipo: true }
    });
    
    if (preguntas.length === 0) {
      //console.log('[calcularProgreso] No hay preguntas para este test');
      return 0;
    }
    
    // Obtener todas las respuestas
    const whereClause = usuarioId ? 
      { id_test: testId, id_usuario: usuarioId } : 
      { id_test: testId };
    
    const respuestas = await prisma.respuesta.findMany({
      where: whereClause
    });

    ///console.log(`[calcularProgreso] Preguntas: ${preguntas.length}, Respuestas encontradas: ${respuestas.length}`);
    
    // Agrupar respuestas por pregunta
    const respuestasPorPregunta: Record<number, any[]> = {};
    respuestas.forEach(r => {
      if (!respuestasPorPregunta[r.id_pregunta]) {
        respuestasPorPregunta[r.id_pregunta] = [];
      }
      respuestasPorPregunta[r.id_pregunta].push(r);
    });

    //console.log(`[calcularProgreso] Preguntas con respuestas: ${Object.keys(respuestasPorPregunta).length}`);
    
    // Contar preguntas válidamente respondidas
    let respondidas = 0;
    
    for (const pregunta of preguntas) {
      const respuestasPreg = respuestasPorPregunta[pregunta.id] || [];
      
      //console.log(`[calcularProgreso] Procesando pregunta ${pregunta.id} (${pregunta.tipo.nombre}), respuestas: ${respuestasPreg.length}, obligatoria: ${pregunta.obligatoria}`);
      
      // Verificar si está respondida adecuadamente según el tipo
      let estaRespondida = false;
      
      switch (pregunta.tipo.nombre) {
        case 'radio':
        case 'select':
          estaRespondida = respuestasPreg.some(r => r.id_opcion !== null);
          break;
        
        case 'checkbox':
          // Para checkbox, con que haya al menos una opción seleccionada cuenta como respondida
          estaRespondida = respuestasPreg.length > 0;
          break;
        
        case 'text':
          estaRespondida = respuestasPreg.some(r => 
            r.texto_respuesta && r.texto_respuesta.trim() !== ''
          );
          break;
        
        case 'range':
          estaRespondida = respuestasPreg.some(r => r.valor_rango !== null);
          break;
        
        default:
          estaRespondida = true;
      }
      
      //console.log(`[calcularProgreso] Pregunta ${pregunta.id} respondida: ${estaRespondida}`);
      
      // Si es obligatoria y no está respondida, no cuenta
      if (pregunta.obligatoria && !estaRespondida) {
        //console.log(`[calcularProgreso] Pregunta obligatoria ${pregunta.id} no respondida - no cuenta`);
        continue;
      }
      
      if (estaRespondida) {
        respondidas++;
        //console.log(`[calcularProgreso] Pregunta ${pregunta.id} cuenta como respondida`);
      }
    }
    
    const progreso = Math.round((respondidas / preguntas.length) * 100);
    //console.log(`[calcularProgreso] Progreso calculado: ${respondidas}/${preguntas.length} = ${progreso}%`);
    return progreso;
  } catch (error) {
    //console.error('[calcularProgreso] Error al calcular progreso:', error);
    return 0; // En caso de error, retornar 0 para no afectar el estado actual
  }
}

// Helper mejorado para verificar si todas las preguntas están respondidas
async function todasPreguntasRespondidas(testId: number, usuarioId: number): Promise<boolean> {
  // Obtener todas las preguntas obligatorias
  const preguntasObligatorias = await prisma.pregunta.findMany({
    where: { 
      id_test: testId,
      obligatoria: true 
    },
    include: {
      tipo: true
    }
  });

  if (preguntasObligatorias.length === 0) {
    console.log('[todasPreguntasRespondidas] No hay preguntas obligatorias - considerando como completado');
    return true;
  }

  // Obtener todas las respuestas válidas agrupadas por pregunta
  const respuestasValidas = await prisma.respuesta.groupBy({
    by: ['id_pregunta'],
    where: { 
      id_test: testId,
      id_usuario: usuarioId,
      OR: [
        { texto_respuesta: { not: null } },
        { valor_rango: { not: null } },
        { id_opcion: { not: null } }
      ]
    }
  });

  //console.log('[todasPreguntasRespondidas] Preguntas obligatorias:', preguntasObligatorias.map(p => p.id));
  //console.log('[todasPreguntasRespondidas] Preguntas respondidas:', respuestasValidas.map(r => r.id_pregunta));

  // Verificar que todas las preguntas obligatorias estén respondidas
  const todasObligatoriasRespondidas = preguntasObligatorias.every(pregunta => {
    const tieneRespuesta = respuestasValidas.some(respuesta => respuesta.id_pregunta === pregunta.id);
    
    if (!tieneRespuesta) {
      console.log(`[todasPreguntasRespondidas] Pregunta obligatoria ${pregunta.id} no tiene respuesta`);
    }
    
    return tieneRespuesta;
  });

  //console.log(`[todasPreguntasRespondidas] Todas obligatorias respondidas: ${todasObligatoriasRespondidas}`);
  return todasObligatoriasRespondidas;
}

// Helper para determinar estado basado en progreso
// Función auxiliar para determinar estado
function determinarEstado(progreso: number, todasRespondidas: boolean): TestStatus {
  //console.log(`[determinarEstado] Progreso: ${progreso}, TodasRespondidas: ${todasRespondidas}`);
  
  if (progreso === 100 || todasRespondidas) {
    return TestStatus.Completado;
  }
  if (progreso === 0) {
    return TestStatus.NoIniciado;
  }
  return TestStatus.EnProgreso;
}

// Función auxiliar para calcular progreso con respuestas proporcionadas
async function calcularProgresoConRespuestas(testId: number, usuarioId: number, respuestas: any[]): Promise<number> {
  try {
    // Obtener todas las preguntas con sus tipos
    const preguntas = await prisma.pregunta.findMany({
      where: { id_test: testId },
      include: { tipo: true }
    });
    
    if (preguntas.length === 0) {
      console.log('[calcularProgresoConRespuestas] No hay preguntas para este test');
      return 0;
    }
    
    //console.log(`[calcularProgresoConRespuestas] Preguntas: ${preguntas.length}, Respuestas proporcionadas: ${respuestas.length}`);
    
    // Agrupar respuestas por pregunta
    const respuestasPorPregunta: Record<number, any[]> = {};
    respuestas.forEach(r => {
      if (!respuestasPorPregunta[r.id_pregunta]) {
        respuestasPorPregunta[r.id_pregunta] = [];
      }
      respuestasPorPregunta[r.id_pregunta].push(r);
    });

    //console.log(`[calcularProgresoConRespuestas] Preguntas con respuestas: ${Object.keys(respuestasPorPregunta).length}`);
    
    // Contar preguntas válidamente respondidas
    let respondidas = 0;
    
    for (const pregunta of preguntas) {
      const respuestasPreg = respuestasPorPregunta[pregunta.id] || [];
      
      //console.log(`[calcularProgresoConRespuestas] Procesando pregunta ${pregunta.id} (${pregunta.tipo.nombre}), respuestas: ${respuestasPreg.length}, obligatoria: ${pregunta.obligatoria}`);
      
      // Verificar si está respondida adecuadamente según el tipo
      let estaRespondida = false;
      
      switch (pregunta.tipo.nombre) {
        case 'radio':
        case 'select':
          estaRespondida = respuestasPreg.some(r => r.id_opcion !== null);
          break;
        
        case 'checkbox':
          estaRespondida = respuestasPreg.length > 0;
          break;
        
        case 'text':
          estaRespondida = respuestasPreg.some(r => 
            r.texto_respuesta && r.texto_respuesta.trim() !== ''
          );
          break;
        
        case 'range':
          estaRespondida = respuestasPreg.some(r => r.valor_rango !== null);
          break;
        
        default:
          estaRespondida = true;
      }
      
      //console.log(`[calcularProgresoConRespuestas] Pregunta ${pregunta.id} respondida: ${estaRespondida}`);
      
      // Si es obligatoria y no está respondida, no cuenta
      if (pregunta.obligatoria && !estaRespondida) {
        console.log(`[calcularProgresoConRespuestas] Pregunta obligatoria ${pregunta.id} no respondida - no cuenta`);
        continue;
      }
      
      if (estaRespondida) {
        respondidas++;
        //console.log(`[calcularProgresoConRespuestas] Pregunta ${pregunta.id} cuenta como respondida`);
      }
    }
    
    const progreso = Math.round((respondidas / preguntas.length) * 100);
    //console.log(`[calcularProgresoConRespuestas] Progreso calculado: ${respondidas}/${preguntas.length} = ${progreso}%`);
    return progreso;
  } catch (error) {
    console.error('[calcularProgresoConRespuestas] Error al calcular progreso:', error);
    return 0;
  }
}

// Función auxiliar para verificar preguntas obligatorias con respuestas proporcionadas
async function todasPreguntasRespondidasConRespuestas(testId: number, usuarioId: number, respuestas: any[]): Promise<boolean> {
  try {
    // Obtener todas las preguntas obligatorias
    const preguntasObligatorias = await prisma.pregunta.findMany({
      where: { 
        id_test: testId,
        obligatoria: true 
      }
    });

    if (preguntasObligatorias.length === 0) {
      console.log('[todasPreguntasRespondidasConRespuestas] No hay preguntas obligatorias - considerando como completado');
      return true;
    }

    // Filtrar respuestas válidas para este usuario
    const respuestasValidas = respuestas.filter(r => 
      r.id_usuario === usuarioId && 
      (r.texto_respuesta !== null || r.valor_rango !== null || r.id_opcion !== null)
    );

    // Agrupar por pregunta
    const respuestasPorPregunta: Record<number, any[]> = {};
    respuestasValidas.forEach(r => {
      if (!respuestasPorPregunta[r.id_pregunta]) {
        respuestasPorPregunta[r.id_pregunta] = [];
      }
      respuestasPorPregunta[r.id_pregunta].push(r);
    });

    //console.log('[todasPreguntasRespondidasConRespuestas] Preguntas obligatorias:', preguntasObligatorias.map(p => p.id));
    //console.log('[todasPreguntasRespondidasConRespuestas] Preguntas respondidas:', Object.keys(respuestasPorPregunta));

    // Verificar que todas las preguntas obligatorias estén respondidas
    const todasObligatoriasRespondidas = preguntasObligatorias.every(pregunta => {
      const respuestasPreg = respuestasPorPregunta[pregunta.id] || [];
      const tieneRespuesta = respuestasPreg.length > 0;
      
      if (!tieneRespuesta) {
        console.log(`[todasPreguntasRespondidasConRespuestas] Pregunta obligatoria ${pregunta.id} no tiene respuesta`);
      }
      
      return tieneRespuesta;
    });

    //console.log(`[todasPreguntasRespondidasConRespuestas] Todas obligatorias respondidas: ${todasObligatoriasRespondidas}`);
    return todasObligatoriasRespondidas;
  } catch (error) {
    console.error('[todasPreguntasRespondidasConRespuestas] Error:', error);
    return false;
  }
}
