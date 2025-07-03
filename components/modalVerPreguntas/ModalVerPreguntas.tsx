'use client'
import React from 'react'
import { PreguntaData, TipoPreguntaNombre, OpcionData } from "@/app/types/test"
import Image from 'next/image'
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import svg from "./../../app/public/logos/logo_texto.svg"

interface ModalVerPreguntasProps {
  preguntas: PreguntaData[]
  testId: number
  onClose: () => void
  onEdit: () => void
}

export function ModalVerPreguntas({ preguntas, testId, onClose, onEdit }: ModalVerPreguntasProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const renderEjemploRespuesta = (pregunta: PreguntaData) => {
    switch (pregunta.tipo.nombre) {
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        return (
          <div className="text-sm text-gray-500 italic">
            {pregunta.opciones?.length ? 
              `Ejemplo: ${pregunta.opciones[0]?.texto || 'Opción'}` : 
              'Opción de selección única'}
          </div>
        )
      
case TipoPreguntaNombre.OPCION_UNICA:
  return (
    <div className="text-sm text-gray-500 italic">
      {pregunta.opciones?.length ? 
        `Selección única: ${pregunta.opciones[0]?.texto || 'Opción'}` : 
        'Botones de radio (selección única)'}
    </div>
  )
      
      case TipoPreguntaNombre.RESPUESTA_CORTA:
        return (
          <div className="text-sm text-gray-500 italic">
            Campo de texto libre{pregunta.placeholder ? ` (${pregunta.placeholder})` : ''}
          </div>
        )
      
      case TipoPreguntaNombre.SELECT:
        return (
          <div className="text-sm text-gray-500 italic">
            Menú desplegable con opciones
          </div>
        )
      
      case TipoPreguntaNombre.RANGO:
        return (
          <div className="text-sm text-gray-500 italic">
            Escala de {pregunta.min ?? 0} a {pregunta.max ?? 100}{pregunta.paso ? ` (paso: ${pregunta.paso})` : ''}
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el test')
      }

      onClose()
    } catch (error) {
      console.error('Error eliminando test:', error)
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar el test. Por favor, inténtalo de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 h-full w-full">
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
              <h2 className="text-xl font-medium text-gray-900 mt-2">Preguntas del Test</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 cursor-pointer"
              aria-label="Cerrar modal"
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
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-gray-700">
                    {index + 1}. {pregunta.texto_pregunta}
                    {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
                {renderEjemploRespuesta(pregunta)}
                {pregunta.opciones && pregunta.opciones.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-600">Opciones:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-500 pl-2">
                      {pregunta.opciones.map((opcion: OpcionData) => (
                        <li key={opcion.id}>
                          {opcion.texto} {opcion.es_otro && "(Otra opción)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(pregunta.min !== null || pregunta.max !== null || pregunta.paso !== null) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {pregunta.min !== null && <span>Mín: {pregunta.min} </span>}
                    {pregunta.max !== null && <span>Máx: {pregunta.max} </span>}
                    {pregunta.paso !== null && <span>Paso: {pregunta.paso}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {deleteError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              aria-label="Volver sin realizar cambios"
            >
              Volver
            </button>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                aria-label="Editar test"
              >
                <Image
                  src={IconLogoEditar}
                  width={16}
                  height={16}
                  alt="Icono editar"
                  className="w-4 h-4"
                />
                Editar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isDeleting ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                aria-label={isDeleting ? "Eliminando test..." : "Eliminar test"}
              >
                {isDeleting ? (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Image
                    src={IconLogoCerrar}
                    width={16}
                    height={16}
                    alt="Icono eliminar"
                    className="w-4 h-4"
                  />
                )}
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}