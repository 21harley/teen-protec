'use client'
import React from 'react'
import { PreguntaResponse, RespuestaResponse, TipoPreguntaNombre } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalVerPacientesTestResultadosProps {
  preguntas: PreguntaResponse[]
  respuestas: RespuestaResponse[]
  onClose: () => void
}

export function ModalVerPacientesTestResultados({ preguntas, respuestas, onClose }: ModalVerPacientesTestResultadosProps) {
  const getRespuestaForPregunta = (preguntaId: number) => {
    return respuestas.find(r => r.id_pregunta === preguntaId)
  }

  const renderRespuesta = (pregunta: PreguntaResponse) => {
    const respuesta = getRespuestaForPregunta(pregunta.id)
    
    if (!respuesta) return <div className="text-sm text-gray-500">Sin respuesta</div>

    switch (pregunta.id_tipo) {
      case 1: // Radio
      case 2: // Select
        return (
          <div className="text-sm text-gray-700">
            {respuesta.id_opcion ? `Opción seleccionada: ${respuesta.id_opcion}` : 'Ninguna opción seleccionada'}
          </div>
        )
      
      case 3: // Checkbox
        return (
          <div className="text-sm text-gray-700">
            {respuesta.id_opcion ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Opción seleccionada: {respuesta.id_opcion}
              </span>
            ) : (
              'No seleccionado'
            )}
          </div>
        )
      
      case 4: // Texto
        return (
          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            {respuesta.texto_respuesta || 'Sin texto proporcionado'}
          </div>
        )
      
      case 5: // Rango
        return (
          <div className="flex items-center space-x-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${((respuesta.valor_rango || 0) - (pregunta.min || 0)) / 
                          ((pregunta.max || 10) - (pregunta.min || 0)) * 100}%` 
                }}
              ></div>
            </div>
            <span className="text-sm text-gray-700">{respuesta.valor_rango}</span>
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500">Tipo de respuesta no soportado (Tipo: {pregunta.id_tipo})</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
              <div className='flex flex-col m-auto'>
                <div>
              <Image
                src={svg}
                width={180}
                height={90}
                alt="Logo de la empresa"
                priority
              />
            </div>
            <h2 className="text-xl font-medium text-gray-900">Respuestas del Test</h2>
              </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 cursor-pointer"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="space-y-2 border-b pb-4 last:border-b-0">
                <h3 className="text-sm font-medium text-gray-700">
                  {index + 1}. {pregunta.texto_pregunta} {pregunta.obligatoria && <span className="text-red-500">*</span>}
                </h3>
                {renderRespuesta(pregunta)}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={onClose}
              className="cursor-pointer p-2 px-[100px] bg-[#6DC7E4] text-white text-sm rounded-md transition"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}