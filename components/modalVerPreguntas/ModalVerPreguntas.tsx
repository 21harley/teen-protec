'use client'
import React from 'react'
import { PreguntaResponse, TipoPreguntaNombre } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalVerPreguntasProps {
  preguntas: PreguntaResponse[]
  testId: number // ID del test para eliminar
  onClose: () => void
  onEdit: () => void // Función para manejar la edición
}

export function ModalVerPreguntas({ preguntas, testId, onClose, onEdit }: ModalVerPreguntasProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const renderEjemploRespuesta = (pregunta: PreguntaResponse) => {
    switch (pregunta.tipo.nombre) {
      case TipoPreguntaNombre.radio:
      case TipoPreguntaNombre.select:
        return (
          <div className="text-sm text-gray-500 italic">
            {pregunta.opciones?.length ? 
              `Ejemplo: ${pregunta.opciones[0].texto}` : 
              'Opción de selección única'}
          </div>
        )
      
      case TipoPreguntaNombre.checkbox:
        return (
          <div className="text-sm text-gray-500 italic">
            {pregunta.opciones?.length ? 
              `Ejemplo: [✓] ${pregunta.opciones[0].texto}` : 
              'Opción de selección múltiple'}
          </div>
        )
      
      case TipoPreguntaNombre.text:
        return (
          <div className="text-sm text-gray-500 italic">
            Campo de texto libre
          </div>
        )
      
      case TipoPreguntaNombre.range:
        return (
          <div className="text-sm text-gray-500 italic">
            Escala de {pregunta.min || 0} a {pregunta.max || 100}
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500 italic">Tipo de pregunta: {pregunta.tipo.nombre}</div>
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este test? Esta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/test?id=${testId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el test')
      }

      // Cerrar el modal después de eliminar
      onClose()
    } catch (error) {
      console.error('Error eliminando test:', error)
      setDeleteError('Error al eliminar el test. Por favor, inténtalo de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit() // Llama a la función de edición del padre
    onClose() // Cierra el modal
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
              <h2 className="text-xl font-medium text-gray-900">Preguntas del Test</h2>
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
                  {index + 1}. {pregunta.texto_pregunta}
                </h3>
                <div className="text-xs text-gray-500">
                  Tipo: {pregunta.tipo.nombre}
                </div>
                {renderEjemploRespuesta(pregunta)}
                {pregunta.opciones?.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-600">Opciones:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-500 pl-2">
                      {pregunta.opciones.map(opcion => (
                        <li key={opcion.id}>{opcion.texto}</li>
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

          <div className="flex justify-between pt-6 space-x-4">
            <button
              onClick={onClose}
              className="cursor-pointer p-2 px-8 bg-gray-300 text-gray-800 text-sm rounded-md transition hover:bg-gray-400 flex-1"
            >
              Volver
            </button>
            <button
              onClick={handleEdit}
              className="cursor-pointer p-2 px-8 bg-blue-500 text-white text-sm rounded-md transition hover:bg-blue-600 flex-1"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`cursor-pointer p-2 px-8 text-white text-sm rounded-md transition flex-1 ${
                isDeleting ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}