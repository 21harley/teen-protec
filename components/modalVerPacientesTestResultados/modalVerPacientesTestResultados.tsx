'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { PreguntaData, RespuestaData, TestStatus, PesoPreguntaTipo, TipoPreguntaNombre, TipoPreguntaMap } from "@/app/types/test"
import Image from 'next/image'

interface GrupoData {
  id: number;
  nombre: string;
  total_resp_valida: number;
  total_resp: number;
  interpretacion: string;
}

interface ModalVerPacientesTestResultadosProps {
  preguntas: PreguntaData[]
  respuestas: RespuestaData[]
  estado: TestStatus
  pesoPreguntas: PesoPreguntaTipo
  onClose: () => void
  onEvaluar: (preguntasActualizadas: PreguntaData[], comentario: string, totalPuntaje: number) => Promise<void>
  grupos?: GrupoData[] | undefined
  comentarios_psicologo? : string
  interp_resul_sis?: string
  total_resultados?: number
}

export function ModalVerPacientesTestResultados({ 
  preguntas, 
  respuestas, 
  estado,
  pesoPreguntas,
  onClose, 
  onEvaluar,
  grupos = [],
  comentarios_psicologo = "",
  interp_resul_sis = "",
  total_resultados = 0
}: ModalVerPacientesTestResultadosProps) {
  console.log(
    { 
  preguntas, 
  respuestas, 
  estado,
  pesoPreguntas,
  onClose, 
  onEvaluar,
  grupos
}
  )
  const [evaluacionesPsi, setEvaluacionesPsi] = useState<Record<number, number | null>>({})
  const [comentario, setComentario] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [puntajeActual, setPuntajeActual] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

  // Helper functions that don't change between renders
  const getRespuestasForPregunta = useCallback((preguntaId: number) => {
    return respuestas.filter(r => r.id_pregunta === preguntaId)
  }, [respuestas])

  const getTextoOpcion = useCallback((respuesta: RespuestaData) => {
    if (respuesta.opcion) {
      return respuesta.opcion.texto
    }
    return respuesta.texto_respuesta || null
  }, [])

  const getValorOpcion = useCallback((respuesta: RespuestaData) => {
    if (respuesta.opcion) {
      return respuesta.opcion.valor ? parseFloat(respuesta.opcion.valor) : 0
    }
    return 0
  }, [])

  // Memoized calculation of total score
  const calcularPuntajeTotal = useCallback((evaluaciones: Record<number, number | null>) => {
    if (pesoPreguntas !== 'SIN_VALOR') {
      return preguntas.reduce((total, pregunta) => {
        const respuestasPregunta = getRespuestasForPregunta(pregunta.id!)
        const tipoPregunta = TipoPreguntaMap[pregunta.id_tipo]
        
        if (pesoPreguntas === 'IGUAL_VALOR') {
          if (respuestasPregunta.length > 0) {
            if (tipoPregunta === TipoPreguntaNombre.RESPUESTA_CORTA || tipoPregunta === TipoPreguntaNombre.RANGO) {
              return total + (evaluaciones[pregunta.id!] === 1 ? pregunta.peso || 0 : 0)
            } else {
              return total + (pregunta.peso || 0)
            }
          }
          return total
        } else if (pesoPreguntas === 'BAREMO') {
          if (tipoPregunta === TipoPreguntaNombre.OPCION_MULTIPLE) {
            const valores = respuestasPregunta.map(r => getValorOpcion(r))
            const maxValor = valores.length > 0 ? Math.max(...valores) : 0
            return total + maxValor
          } else if (tipoPregunta === TipoPreguntaNombre.OPCION_UNICA || 
                    tipoPregunta === TipoPreguntaNombre.SELECT) {
            const valor = respuestasPregunta.length > 0 ? getValorOpcion(respuestasPregunta[0]) : 0
            return total + valor
          } else if (tipoPregunta === TipoPreguntaNombre.RESPUESTA_CORTA) {
            return total + (evaluaciones[pregunta.id!] || 0)
          } else if (tipoPregunta === TipoPreguntaNombre.RANGO) {
            const valorRango = respuestasPregunta[0]?.valor_rango || 0
            const evalPsi = evaluaciones[pregunta.id!] || 0
            return total + valorRango + evalPsi
          }
        }
        return total
      }, 0)
    }
    return 0
  }, [pesoPreguntas, preguntas, getRespuestasForPregunta, getValorOpcion])

  // Initialize group expansion state - runs only once when component mounts
  useEffect(() => {
    const initialExpanded: Record<number, boolean> = {}
    grupos.forEach(grupo => {
      initialExpanded[grupo.id] = false
    })
    setExpandedGroups(initialExpanded)
  }, []) 

  // Initialize evaluations with question values
  useEffect(() => {
    const initialEvaluacionesPsi: Record<number, number | null> = {}

    preguntas.forEach(pregunta => {
      if (pesoPreguntas === 'IGUAL_VALOR' || pesoPreguntas === 'BAREMO') {
        initialEvaluacionesPsi[pregunta.id!] = typeof pregunta.eva_psi === 'string' 
          ? parseFloat(pregunta.eva_psi) 
          : pregunta.eva_psi ?? (pesoPreguntas === 'IGUAL_VALOR' ? 0 : null)
      }
    })

    setEvaluacionesPsi(initialEvaluacionesPsi)
    setPuntajeActual(calcularPuntajeTotal(initialEvaluacionesPsi))
  }, [preguntas, pesoPreguntas, calcularPuntajeTotal])

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const handleEvaluacionPsiChange = (preguntaId: number, valor: string | number, maxPuntos: number) => {
    let numericValue: number | null = null

    if (pesoPreguntas === 'IGUAL_VALOR') {
      numericValue = valor === 1 ? 1 : 0
    } else {
      numericValue = valor === '' ? null : typeof valor === 'number' ? valor : parseFloat(valor)
      
      if (numericValue !== null) {
        if (numericValue > maxPuntos) {
          numericValue = maxPuntos
        } else if (numericValue < 0) {
          numericValue = 0
        }
      }
    }

    const newEvaluaciones = {
      ...evaluacionesPsi,
      [preguntaId]: numericValue
    }

    setEvaluacionesPsi(newEvaluaciones)
    setPuntajeActual(calcularPuntajeTotal(newEvaluaciones))
  }

  const handleSubmitEvaluacion = async () => {
    setIsLoading(true)
    try {
      const preguntasActualizadas = preguntas.map(pregunta => ({
        ...pregunta,
        eva_psi: (pesoPreguntas === 'IGUAL_VALOR' || pesoPreguntas === 'BAREMO') 
          ? evaluacionesPsi[pregunta.id!] !== undefined 
            ? evaluacionesPsi[pregunta.id!] 
            : typeof pregunta.eva_psi === 'string'
              ? parseFloat(pregunta.eva_psi) || 0
              : pregunta.eva_psi || 0
          : null
      }))
      
      await onEvaluar(preguntasActualizadas, comentario, total_resultados);
    } finally {
      setIsLoading(false)
    }
  }

  const renderEvaluacionInput = (preguntaId: number, maxPuntos: number, currentValue: number | null) => {
    if (pesoPreguntas === 'IGUAL_VALOR') {
      return (
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name={`eval-${preguntaId}`}
              checked={currentValue === 1}
              onChange={() => handleEvaluacionPsiChange(preguntaId, 1, maxPuntos)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Sí ({maxPuntos} puntos)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name={`eval-${preguntaId}`}
              checked={currentValue === 0}
              onChange={() => handleEvaluacionPsiChange(preguntaId, 0, maxPuntos)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">No (0 puntos)</span>
          </label>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Puntuación (max {maxPuntos}):</span>
          <input
            type="number"
            min="0"
            max={maxPuntos}
            step="1"
            value={currentValue ?? ''}
            onChange={(e) => handleEvaluacionPsiChange(preguntaId, e.target.value, maxPuntos)}
            className="w-20 px-2 py-1 border rounded text-sm"
            placeholder="0"
          />
        </div>
      )
    }
  }

  const renderRespuesta = (pregunta: PreguntaData) => {
    const respuestasPregunta = getRespuestasForPregunta(pregunta.id!)
    const maxPuntos = pregunta.peso || 10
    const currentEval = evaluacionesPsi[pregunta.id!] ?? null
    
    if (respuestasPregunta.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">
          Sin respuesta
        </div>
      )
    }

    switch (TipoPreguntaMap[pregunta.id_tipo]) {
      case TipoPreguntaNombre.OPCION_UNICA:
      case TipoPreguntaNombre.SELECT:
        const respuesta = respuestasPregunta[0]
        const textoOpcion = getTextoOpcion(respuesta)
        const valorOpcion = getValorOpcion(respuesta)
        
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
              {textoOpcion || 'Ninguna opción seleccionada'} 
            </div>
          </div>
        )
      
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        const opcionesSeleccionadas = respuestasPregunta.map(r => ({
          texto: getTextoOpcion(r),
          valor: getValorOpcion(r),
          textoAdicional: r.texto_respuesta
        })).filter(op => op.texto !== null)
        
        return (
          <div className="space-y-2">
            {opcionesSeleccionadas.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {opcionesSeleccionadas.map((op, index) => (
                    <div key={index} className="flex flex-col">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${op.valor > 0 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                        {op.texto} 
                      </span>
                    </div>
                  ))}
                </div>
                {pesoPreguntas !== 'SIN_VALOR' && (
                  <div className="text-sm text-gray-600">
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">No se seleccionaron opciones</span>
            )}
          </div>
        )
      
      case TipoPreguntaNombre.RESPUESTA_CORTA:
        return (
          <div className="space-y-2">
            {respuestasPregunta.map((respuesta, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 whitespace-pre-wrap">
                  {respuesta.texto_respuesta || 'Sin texto proporcionado'}
                </div>
                
                {(pesoPreguntas === 'IGUAL_VALOR' || pesoPreguntas === 'BAREMO') && estado === 'COMPLETADO' && (
                  renderEvaluacionInput(pregunta.id!, maxPuntos, currentEval)
                )}
              </div>
            ))}
          </div>
        )
      
      case TipoPreguntaNombre.RANGO:
        const respuestaRango = respuestasPregunta[0]
        const valor = respuestaRango.valor_rango || 0
        const min = pregunta.min || 0
        const max = pregunta.max || 10
        const porcentaje = ((valor - min) / (max - min)) * 100
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 flex-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {valor} / {max}
              </span>
            </div>
            {(pesoPreguntas === 'IGUAL_VALOR' || pesoPreguntas === 'BAREMO') && estado === 'COMPLETADO' && (
              renderEvaluacionInput(pregunta.id!, maxPuntos, currentEval)
            )}
          </div>
        )
      
      default:
        return (
          <div className="text-sm text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
            Tipo de respuesta no soportado (ID: {pregunta.id_tipo} {TipoPreguntaMap[pregunta.id_tipo]})
          </div>
        )
    }
  }

  // Group questions by grupo if grupos array is provided
  const groupQuestions = () => {
    console.log(grupos.length);
    if (grupos.length === 0) {
      return (
        <div className="space-y-6">
          {preguntas.map((pregunta, index) => (
            <div key={`pregunta-${pregunta.id}`} className="space-y-3 pb-4 border-b last:border-b-0">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-800 flex-1">
                  <span className="font-semibold text-gray-900">{index + 1}.</span> {pregunta.texto_pregunta}
                  {pregunta.obligatoria && (
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                  )}
                </h3>
              </div>
              {renderRespuesta(pregunta)}
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {grupos.map(grupo => {
          const groupQuestions = preguntas.filter(p => p.id_grupo === grupo.id)

          return (
            <details key={`grupo-${grupo.id}`} open={expandedGroups[grupo.id]} className="border rounded-lg overflow-hidden">
              <summary 
                className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault()
                  toggleGroup(grupo.id)
                }}
              >
                <div className="flex items-center gap-3">
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${!expandedGroups[grupo.id]? 'rotate-0' : '-rotate-90'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <h3 className="font-medium text-gray-800">{grupo.nombre}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    {grupo.total_resp_valida}/{grupo.total_resp} respuestas válidas
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    grupo.interpretacion.includes('bajo') ? 'bg-red-100 text-red-800' :
                    grupo.interpretacion.includes('promedio') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {grupo.interpretacion}
                  </span>
                </div>
              </summary>
              
              <div className="p-4 space-y-4 bg-white">
                {groupQuestions.map((pregunta, index) => (
                  <div key={`pregunta-${pregunta.id}`} className="space-y-3 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-800 flex-1">
                        <span className="font-semibold text-gray-900">{index + 1}.</span> {pregunta.texto_pregunta}
                        {pregunta.obligatoria && (
                          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                        )}
                      </h3>
                    </div>
                    {renderRespuesta(pregunta)}
                  </div>
                ))}
              </div>
            </details>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 _color_four bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col items-center mx-auto">
              <Image
                src="/logos/logo_texto.svg"
                width={180}
                height={90}
                alt="Logo de la empresa"
                priority
                className="mb-2 w-[180px] h-[90px]"
              />
              <h2 className="text-xl font-semibold text-gray-800">
                {estado === 'EVALUADO' ? 'Resultados Evaluados' : 'Resultados del Test'}
              </h2>
              {
                
                <h2 className="text-xl font-semibold text-gray-800">
                  {interp_resul_sis}, con el puntaje {total_resultados.toString()}
                 </h2>
                
              }
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {(estado === 'COMPLETADO' || estado  === 'EVALUADO')&&(
              <div className='grid place-items-center'>
                <Image
                src="/imagenes/imagen_tabla_Brown.png"
                width={600}
                height={300}
                alt="tabla-brown"
                priority
                className="mb-2 w-[600px] h-[300px]"
                />
              </div>
          )}
 
          {groupQuestions()}

          {comentarios_psicologo != "" && comentarios_psicologo != undefined &&(
             <div className='m-4'>
                <p className='text-sm text-gray-600'>
                  Comentario al evaluar el test: 
                </p>
                <p>
                  {comentarios_psicologo}
                </p>
              </div>
          )}

          {estado === 'COMPLETADO' && (
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios adicionales
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                  placeholder="Escribe tus observaciones sobre el test..."
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-gray-600">
                  {pesoPreguntas === 'IGUAL_VALOR' ? (
                    <span>Marque "Sí" para asignar los puntos completos a cada respuesta válida</span>
                  ) : pesoPreguntas === 'BAREMO' ? (
                    <span>Asigne puntuación específica a cada respuesta según corresponda</span>
                  ) : (
                    <span>Revise las respuestas del paciente</span>
                  )}
                </div>
                <button
                  onClick={handleSubmitEvaluacion}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Procesando...' : 'Terminar Evaluación'}
                </button>
              </div>
            </div>
          )}

          {estado === 'EVALUADO' && (
            <div className="flex justify-center pt-6">
              <button
                onClick={onClose}
                className="px-12 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Volver al listado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}