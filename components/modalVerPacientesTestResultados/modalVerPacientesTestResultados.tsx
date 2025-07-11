'use client'
import React from 'react'
import { PreguntaData, RespuestaData } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalVerPacientesTestResultadosProps {
  preguntas: PreguntaData[]
  respuestas: RespuestaData[]
  onClose: () => void
}

const TIPOS_PREGUNTA = {
  RADIO: 1,
  CHECKBOX: 2,
  TEXTO: 3,
  SELECT: 4,
  RANGO: 5
} as const

export function ModalVerPacientesTestResultados({ preguntas, respuestas, onClose }: ModalVerPacientesTestResultadosProps) {
  /**
   * Obtiene todas las respuestas para una pregunta específica
   * @param preguntaId ID de la pregunta
   * @returns Array de respuestas correspondientes
   */
  const getRespuestasForPregunta = (preguntaId: number) => {
    return respuestas.filter(r => r.id_pregunta === preguntaId)
  }

  /**
   * Obtiene el texto de una opción seleccionada
   * @param pregunta Pregunta que contiene las opciones
   * @param idOpcion ID de la opción seleccionada
   * @returns Texto de la opción o null si no existe
   */
  const getTextoOpcion = (pregunta: PreguntaData, idOpcion: number | null) => {
    if (!idOpcion || !pregunta.opciones) return null
    const opcion = pregunta.opciones.find(o => o.id === idOpcion)
    return opcion?.texto || `Opción ${idOpcion}`
  }

  /**
   * Renderiza la respuesta según el tipo de pregunta
   * @param pregunta Pregunta a renderizar
   * @returns Componente JSX con la respuesta formateada
   */
  const renderRespuesta = (pregunta: PreguntaData) => {
    const respuestasPregunta = getRespuestasForPregunta(pregunta.id)
    
    if (respuestasPregunta.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">
          Sin respuesta
        </div>
      )
    }

    switch (pregunta.id_tipo) {
      case TIPOS_PREGUNTA.RADIO:
      case TIPOS_PREGUNTA.SELECT:
        // Para radio/select solo mostramos la primera respuesta (no debería haber múltiples)
        const respuesta = respuestasPregunta[0]
        const textoOpcion = getTextoOpcion(pregunta, respuesta.id_opcion ?? null)
        const textoAdicional = respuesta.texto_respuesta ? ` - ${respuesta.texto_respuesta}` : ''
        
        return (
          <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
            {textoOpcion || 'Ninguna opción seleccionada'}{textoAdicional}
          </div>
        )
      
      case TIPOS_PREGUNTA.CHECKBOX:
        // Para checkbox mostramos todas las opciones seleccionadas
        const opcionesSeleccionadas = respuestasPregunta
          .map(r => ({
            texto: getTextoOpcion(pregunta, r.id_opcion ?? null),
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
                      {op.texto}
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
          </div>
        )
      
      case TIPOS_PREGUNTA.TEXTO:
        // Para texto mostramos todas las respuestas de texto (puede haber múltiples)
        return (
          <div className="space-y-2">
            {respuestasPregunta.map((respuesta, index) => (
              <div 
                key={index}
                className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 whitespace-pre-wrap"
              >
                {respuesta.texto_respuesta || 'Sin texto proporcionado'}
              </div>
            ))}
          </div>
        )
      
      case TIPOS_PREGUNTA.RANGO:
        // Para rango mostramos el valor (solo debería haber una respuesta)
        const respuestaRango = respuestasPregunta[0]
        const valor = respuestaRango.valor_rango || 0
        const min = pregunta.min || 0
        const max = pregunta.max || 10
        const porcentaje = ((valor - min) / (max - min)) * 100
        
        return (
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
        )
      
      default:
        return (
          <div className="text-sm text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
            Tipo de respuesta no soportado (ID: {pregunta.id_tipo})
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
              <h2 className="text-xl font-semibold text-gray-800">Resultados del Test</h2>
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
                <h3 className="text-sm font-medium text-gray-800">
                  <span className="font-semibold text-gray-900">{index + 1}.</span> {pregunta.texto_pregunta}
                  {pregunta.obligatoria && (
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                  )}
                </h3>
                {renderRespuesta(pregunta)}
              </div>
            ))}
          </div>

          {/* Botón de cierre */}
          <div className="flex justify-center pt-6">
            <button
              onClick={onClose}
              className="px-12 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Volver al listado
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}