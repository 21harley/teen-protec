'use client'
import React, { useState } from 'react'
import { PreguntaData, RespuestaData, TestStatus, PesoPreguntaTipo, TipoPreguntaNombre, TipoPreguntaMap } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalVerPacientesTestResultadosProps {
  preguntas: PreguntaData[]
  respuestas: RespuestaData[]
  estado: TestStatus
  pesoPreguntas: PesoPreguntaTipo
  onClose: () => void
  onEvaluar: (puntajes: Record<number, number>, comentario: string) => Promise<void>
}

export function ModalVerPacientesTestResultados({ 
  preguntas, 
  respuestas, 
  estado,
  pesoPreguntas,
  onClose, 
  onEvaluar 
}: ModalVerPacientesTestResultadosProps) {
  const [puntajes, setPuntajes] = useState<Record<number, number>>({})
  const [comentario, setComentario] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getRespuestasForPregunta = (preguntaId: number) => {
    return respuestas.filter(r => r.id_pregunta === preguntaId)
  }

  const getTextoOpcion = (pregunta: PreguntaData, idOpcion: number | null) => {
    if (!idOpcion || !pregunta.opciones) return null
    const opcion = pregunta.opciones.find(o => o.id === idOpcion)
    return opcion?.texto || `Opción ${idOpcion}`
  }

  const getValorOpcion = (pregunta: PreguntaData, idOpcion: number | null) => {
    if (!idOpcion || !pregunta.opciones) return 0
    const opcion = pregunta.opciones.find(o => o.id === idOpcion)
    return opcion?.valor ? parseFloat(opcion.valor) : 0
  }

  const calcularPuntajeTotal = () => {
    if (estado === 'EVALUADO') {
      return preguntas.reduce((total, pregunta) => {
        const respuestasPregunta = getRespuestasForPregunta(pregunta.id!)
        if (respuestasPregunta.length === 0) return total
        
        if (pesoPreguntas === 'IGUAL_VALOR') {
          return total + (pregunta.peso || 0)
        } else if (pesoPreguntas === 'BAREMO') {
          return respuestasPregunta.reduce((subTotal, respuesta) => {
            return subTotal + (puntajes[respuesta.id_pregunta!] || 0)
          }, total)
        }
        return total
      }, 0)
    }
    return 0
  }

  const handlePuntajeChange = (preguntaId: number, valor: number) => {
    setPuntajes(prev => ({
      ...prev,
      [preguntaId]: valor
    }))
  }

  const handleSubmitEvaluacion = async () => {
    setIsLoading(true)
    try {
      await onEvaluar(puntajes, comentario)
    } finally {
      setIsLoading(false)
    }
  }

  const renderRespuesta = (pregunta: PreguntaData) => {
    const respuestasPregunta = getRespuestasForPregunta(pregunta.id!)
    
    if (respuestasPregunta.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">
          Sin respuesta
        </div>
      )
    }
    console.log(pregunta);
    switch (TipoPreguntaMap[pregunta.id_tipo]) {
      case TipoPreguntaNombre.OPCION_UNICA:
      case TipoPreguntaNombre.SELECT:
        const respuesta = respuestasPregunta[0]
        const textoOpcion = getTextoOpcion(pregunta, respuesta.id_opcion ?? null)
        const valorOpcion = getValorOpcion(pregunta, respuesta.id_opcion ?? null)
        const textoAdicional = respuesta.texto_respuesta ? ` - ${respuesta.texto_respuesta}` : ''
        
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
              {textoOpcion || 'Ninguna opción seleccionada'}{textoAdicional}
            </div>
            {estado === 'COMPLETADO' && pesoPreguntas === 'BAREMO' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Puntaje:</span>
                <input
                  type="number"
                  min="0"
                  max={pregunta.peso || 10}
                  value={puntajes[pregunta.id!] || 0}
                  onChange={(e) => handlePuntajeChange(pregunta.id!, parseFloat(e.target.value))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm text-gray-500">/ {pregunta.peso || '?'}</span>
              </div>
            )}
            {estado === 'EVALUADO' && pesoPreguntas === 'BAREMO' && (
              <div className="text-sm text-gray-600">
                Puntaje asignado: {puntajes[pregunta.id!] || 0} / {pregunta.peso || '?'}
              </div>
            )}
          </div>
        )
      
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        const opcionesSeleccionadas = respuestasPregunta
          .map(r => ({
            texto: getTextoOpcion(pregunta, r.id_opcion ?? null),
            valor: getValorOpcion(pregunta, r.id_opcion ?? null),
            textoAdicional: r.texto_respuesta
          }))
          .filter(op => op.texto !== null)

        return (
          <div className="space-y-2">
            {opcionesSeleccionadas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {opcionesSeleccionadas.map((op, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      {op.texto} {pesoPreguntas === 'BAREMO' && `(${op.valor})`}
                    </span>
                    {op.textoAdicional && (
                      <span className="text-xs text-gray-500 mt-1">{op.textoAdicional}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">No se seleccionaron opciones</span>
            )}
            {estado === 'COMPLETADO' && pesoPreguntas === 'BAREMO' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Puntaje total:</span>
                <span className="text-sm font-medium">
                  {opcionesSeleccionadas.reduce((sum, op) => sum + op.valor, 0)}
                </span>
              </div>
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
                {estado === 'COMPLETADO' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Asignar puntaje:</span>
                    <input
                      type="number"
                      min="0"
                      max={pregunta.peso || 10}
                      value={puntajes[pregunta.id!] || 0}
                      onChange={(e) => handlePuntajeChange(pregunta.id!, parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm text-gray-500">/ {pregunta.peso || '?'}</span>
                  </div>
                )}
                {estado === 'EVALUADO' && (
                  <div className="text-sm text-gray-600">
                    Puntaje asignado: {puntajes[pregunta.id!] || 0} / {pregunta.peso || '?'}
                  </div>
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
            {estado === 'EVALUADO' && pesoPreguntas === 'IGUAL_VALOR' && (
              <div className="text-sm text-gray-600">
                Puntaje: {pregunta.peso || 0}
              </div>
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

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col items-center mx-auto">
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de la empresa"
                priority
                className="mb-2"
              />
              <h2 className="text-xl font-semibold text-gray-800">
                {estado === 'EVALUADO' ? 'Resultados Evaluados' : 'Resultados del Test'}
              </h2>
              {estado === 'EVALUADO' && (
                <div className="text-lg font-bold text-blue-600 mt-1">
                  Puntaje Total: {calcularPuntajeTotal()}
                </div>
              )}
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

          {/* Listado de preguntas y respuestas */}
          <div className="space-y-6">
            {preguntas.map((pregunta, index) => (
              <div 
                key={`pregunta-${pregunta.id}`} 
                className="space-y-3 pb-4 border-b last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-gray-800 flex-1">
                    <span className="font-semibold text-gray-900">{index + 1}.</span> {pregunta.texto_pregunta}
                    {pregunta.obligatoria && (
                      <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                    )}
                  </h3>
                  {pesoPreguntas === 'IGUAL_VALOR' && pregunta.peso !== undefined && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Puntos: {pregunta.peso}
                    </span>
                  )}
                </div>
                {renderRespuesta(pregunta)}
              </div>
            ))}
          </div>

          {/* Sección de evaluación para psicólogo */}
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
                    <span>Puntaje automático por pregunta respondida</span>
                  ) : (
                    <span>Asigne puntaje a cada respuesta según corresponda</span>
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

          {/* Botón de cierre cuando ya está evaluado */}
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