'use client'
import React from 'react'
import { PreguntaPlantilla, TestPlantilla } from "@/app/types/plantilla"
import { TipoPreguntaNombre } from '@/app/types/test';
import Image from 'next/image'

interface ModalVerPreguntasPlantillaProps {
  plantilla: TestPlantilla
  onClose: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
}

export function ModalVerPreguntasPlantilla({ plantilla, onClose, onEdit, onDelete }: ModalVerPreguntasPlantillaProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const renderEjemploRespuesta = (pregunta: PreguntaPlantilla) => {
    switch (pregunta.tipo?.nombre) {
      case TipoPreguntaNombre.OPCION_UNICA:
      case TipoPreguntaNombre.SELECT:
        return (
          <div className="text-sm text-gray-500 italic">
            {pregunta.opciones?.length ? 
              `Ejemplo: ${pregunta.opciones[0].texto}` : 
              'Opción de selección única'}
          </div>
        )
      
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        return (
          <div className="text-sm text-gray-500 italic">
            {pregunta.opciones?.length ? 
              `Ejemplo: [✓] ${pregunta.opciones[0].texto}` : 
              'Opción de selección múltiple'}
          </div>
        )
      
      case TipoPreguntaNombre.RESPUESTA_CORTA:
        return (
          <div className="text-sm text-gray-500 italic">
            Campo de texto libre{pregunta.placeholder ? ` (${pregunta.placeholder})` : ''}
          </div>
        )
      
      case TipoPreguntaNombre.RANGO:
        return (
          <div className="text-sm text-gray-500 italic">
            Escala de {pregunta.min || 0} a {pregunta.max || 100}{pregunta.paso ? `, paso ${pregunta.paso}` : ''}
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500 italic">Tipo de pregunta: {pregunta.tipo?.nombre || 'Desconocido'}</div>
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este test? Esta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onDelete()
      onClose()
    } catch (error) {
      console.error('Error eliminando test:', error)
      setDeleteError('Error al eliminar la test. Por favor, inténtalo de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50 h-full w-full">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className='flex flex-col m-auto'>
              <div>
                <Image
                  src="/logos/logo_texto.svg"
                  width={180}
                  height={90}
                  className='w-[180px] h-[90px]'
                  alt="Logo de la empresa"
                  priority
                />
              </div>
              <h2 className="text-xl font-medium text-gray-900">
                Test: {plantilla.nombre}
              </h2>
              <div className="text-sm text-gray-500 mt-1">
                Estado: {plantilla.estado}
              </div>
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
            {plantilla.preguntas?.map((pregunta, index) => (
              <div key={pregunta.id} className="space-y-2 border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      {index + 1}. {pregunta.texto_pregunta}
                      {pregunta.obligatoria && (
                        <span className="ml-2 text-xs text-red-500">(Obligatoria)</span>
                      )}
                    </h3>
                    <div className="text-xs text-gray-500">
                      Tipo: {pregunta.tipo?.nombre || 'Desconocido'}
                    </div>
                    {renderEjemploRespuesta(pregunta)}
                  </div>
                </div>
                
                {(pregunta.opciones?.length ?? 0) > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-600">Opciones:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-500 pl-2">
                      {pregunta.opciones?.map(opcion => (
                        <li key={opcion.id}>
                          {opcion.texto}
                          {opcion.es_otro && <span className="text-gray-400 ml-1">(Opción "Otro")</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {deleteError && (
            <div className="mt-4 text-red-500 text-sm text-center">
              {deleteError}
            </div>
          )}

          <div className="flex flex-col h-[150px] sm:h-auto sm:flex-row sm:gap-4 justify-between pt-6 space-x-4">
            <button
              onClick={onClose}
              className="w-full max-w-[180px] m-auto cursor-pointer p-2 bg-blue-500 text-white text-sm rounded-md transition hover:bg-blue-600"
            >
              Volver
            </button>
            <button
              onClick={handleEdit}
              className="w-full max-w-[180px] m-auto cursor-pointer p-2 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-10 items-center"
            >
              Editar
              <Image
                className="w-[20px] h-[20px] cursor-pointer"
                src="/logos/icon_editar.svg"
                width={0}
                height={0}
                alt="Editar"
              />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`w-full max-w-[180px] m-auto cursor-pointer p-2 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-10 items-center ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
              <Image
                className="w-[20px] h-[20px] cursor-pointer"
                src="/logos/icon_eliminar.svg"
                width={0}
                height={0}
                alt="Eliminar"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}