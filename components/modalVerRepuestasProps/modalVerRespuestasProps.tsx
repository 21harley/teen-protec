'use client'
import React from 'react'
import { PreguntaData, RespuestaData, TipoPreguntaNombre, OpcionData } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalVerRespuestasProps {
  preguntas: PreguntaData[]
  respuestas: RespuestaData[]
  onClose: () => void
}

export function ModalVerRespuestas({ preguntas, respuestas, onClose }: ModalVerRespuestasProps) {
  // Función para obtener respuestas de una pregunta específica
  const getRespuestasForPregunta = (preguntaId: number | undefined): RespuestaData[] => {
    if(preguntaId == undefined ) return []
    return respuestas.filter(r => r.id_pregunta === preguntaId)
  }

  // Función para renderizar la respuesta según el tipo de pregunta
  const renderRespuesta = (pregunta: PreguntaData) => {
    const respuestasPregunta = getRespuestasForPregunta(pregunta.id)
    
    if (respuestasPregunta.length === 0) {
      return <div className="text-sm text-gray-500 italic">Sin respuesta</div>
    }
    if(!pregunta.tipo) return false
    switch (pregunta.tipo.nombre) {
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        // Mostrar todas las opciones seleccionadas para checkboxes
        const opcionesSeleccionadas = respuestasPregunta
          .map(r => r.opcion?.texto)
          .filter(Boolean)
          .join(', ')
        
        return (
          <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
            {opcionesSeleccionadas || 'Ninguna opción seleccionada'}
          </div>
        )
      
      case TipoPreguntaNombre.SELECT:
      case TipoPreguntaNombre.OPCION_UNICA:
        return (
          <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
            {respuestasPregunta[0]?.opcion?.texto || 'No seleccionado'}
          </div>
        )
      
      case TipoPreguntaNombre.RESPUESTA_CORTA:
        return (
          <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
            {respuestasPregunta[0]?.texto_respuesta || 'Sin texto proporcionado'}
          </div>
        )
      
      case TipoPreguntaNombre.RANGO:
        const valor = respuestasPregunta[0]?.valor_rango ?? 0
        const min = pregunta.min ?? 0
        const max = pregunta.max ?? 100
        const porcentaje = ((valor - min) / (max - min)) * 100
        
        return (
          <div className="flex items-center space-x-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-700">{valor}</span>
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500">Tipo de respuesta no soportado: {pregunta.tipo.nombre}</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className='flex flex-col m-auto'>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de la empresa"
                priority
              />
              <h2 className="text-xl font-medium text-gray-900 mt-2">Respuestas del Test</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 cursor-pointer"
              aria-label="Cerrar modal de respuestas"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {preguntas.map((pregunta, index) => (
              <div key={`pregunta-${pregunta.id}`} className="space-y-2 border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-gray-700">
                    {index + 1}. {pregunta.texto_pregunta}
                    {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
                {renderRespuesta(pregunta)}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={onClose}
              className="cursor-pointer p-2 px-[100px] bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              aria-label="Volver al listado"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}