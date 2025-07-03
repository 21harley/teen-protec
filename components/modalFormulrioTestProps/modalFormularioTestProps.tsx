'use client'
import React, { useState, useEffect } from 'react'
import { PreguntaData, RespuestaData, TipoPreguntaNombre, OpcionData, TipoPregunta } from "@/app/types/test"
import svg from "./../../app/public/logos/logo_texto.svg"
import Image from 'next/image'

interface ModalFormularioTestProps {
  preguntas: PreguntaData[]
  onSave: (respuestas: RespuestaData[]) => Promise<void>
  onClose: () => void
  initialRespuestas?: RespuestaData[]
  isSubmitting?: boolean
}

export function ModalFormularioTest({ 
  preguntas, 
  onSave, 
  onClose,
  initialRespuestas = [],
  isSubmitting = false
}: ModalFormularioTestProps) {
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaData[]>>(() => {
    const initialData: Record<number, RespuestaData[]> = {};
    preguntas.forEach(pregunta => {
      initialData[pregunta.id] = initialRespuestas
        .filter(r => r.id_pregunta === pregunta.id)
        .map(r => ({ ...r }));
    });
    return initialData;
  })
  const [error, setError] = useState<string | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [estaCompletado, setEstaCompletado] = useState(false)
  const [respuestasGuardadas, setRespuestasGuardadas] = useState(false)

  // Calcular progreso inicial
  useEffect(() => {
    const nuevoProgreso = calcularProgresoActual()
    setProgreso(nuevoProgreso)
    setEstaCompletado(nuevoProgreso === 100)
  }, [respuestas])

  const calcularProgresoActual = () => {
    const preguntasRespondidas = new Set<number>()
    
    Object.entries(respuestas).forEach(([idPregunta, respuestasPreg]) => {
      const preguntaId = Number(idPregunta)
      const pregunta = preguntas.find(p => p.id === preguntaId)
      
      if (!pregunta) return
      
      // Verificar si la pregunta está respondida adecuadamente según su tipo
      const estaRespondida = respuestasPreg.some(r => {
        switch (pregunta.tipo.nombre) {
          case TipoPreguntaNombre.OPCION_MULTIPLE:
            return r.id_opcion !== null
          
          case TipoPreguntaNombre.OPCION_UNICA:
            return respuestasPreg.length > 0
          
          case TipoPreguntaNombre.RESPUESTA_CORTA:
            return r.texto_respuesta && r.texto_respuesta.trim() !== ''
          
          case TipoPreguntaNombre.RANGO:
            return r.valor_rango !== null
          
          case TipoPreguntaNombre.SELECT:
            return r.id_opcion !== null
          
          default:
            return true
        }
      })
      
      // Si es obligatoria, debe estar respondida
      if (pregunta.obligatoria && !estaRespondida) {
        return
      }
      
      if (estaRespondida) {
        preguntasRespondidas.add(preguntaId)
      }
    })

    return Math.round((preguntasRespondidas.size / preguntas.length) * 100)
  }

  const handleChange = (idPregunta: number, value: any, idOpcion?: number, isCheckbox = false) => {
    setRespuestas(prev => {
      const pregunta = preguntas.find(p => p.id === idPregunta);
      if (!pregunta) return prev;

      if (isCheckbox) {
        const currentAnswers = prev[idPregunta] || [];
        const existingIndex = currentAnswers.findIndex(r => r.id_opcion === idOpcion);
        
        if (existingIndex >= 0) {
          // Remove if unchecked
          return {
            ...prev,
            [idPregunta]: currentAnswers.filter(r => r.id_opcion !== idOpcion)
          };
        } else {
          // Add if checked
          return {
            ...prev,
            [idPregunta]: [
              ...currentAnswers,
              {
                id_pregunta: idPregunta,
                id_opcion: idOpcion,
                texto_respuesta: null,
                valor_rango: null,
                fecha: new Date().toISOString()
              }
            ]
          };
        }
      } else {
        // For non-checkbox inputs
        return {
          ...prev,
          [idPregunta]: [{
            id_pregunta: idPregunta,
            id_opcion: idOpcion || null,
            texto_respuesta: typeof value === 'string' ? value : null,
            valor_rango: typeof value === 'number' ? value : null,
            fecha: new Date().toISOString()
          }]
        };
      }
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validación de preguntas obligatorias
    const faltanObligatorias = preguntas.some(pregunta => {
      if (!pregunta.obligatoria) return false;
      
      const respuestasPreg = respuestas[pregunta.id] || [];
      
      // Diferentes validaciones según el tipo de pregunta
      switch (pregunta.tipo.nombre) {
        case TipoPreguntaNombre.OPCION_MULTIPLE:
          return respuestasPreg.length === 0;
        case TipoPreguntaNombre.OPCION_UNICA:
          return respuestasPreg.length === 0;
        case TipoPreguntaNombre.RESPUESTA_CORTA:
          return !respuestasPreg[0]?.texto_respuesta?.trim();
        case TipoPreguntaNombre.RANGO:
          return respuestasPreg[0]?.valor_rango === null;
        case TipoPreguntaNombre.SELECT:
          return respuestasPreg[0]?.id_opcion === null;
        default:
          return false;
      }
    });

    if (faltanObligatorias) {
      setError('Por favor responde todas las preguntas obligatorias');
      return;
    }

    // Preparar respuestas para enviar
    const respuestasArray = Object.values(respuestas)
      .flat()
      .filter(r => {
        const pregunta = preguntas.find(p => p.id === r.id_pregunta);
        if (!pregunta) return false;
        
        // Filtrar respuestas vacías
        switch (pregunta.tipo.nombre) {
          case TipoPreguntaNombre.RESPUESTA_CORTA:
            return r.texto_respuesta?.trim();
          case TipoPreguntaNombre.RANGO:
            return r.valor_rango !== null;
          case TipoPreguntaNombre.OPCION_MULTIPLE:
          case TipoPreguntaNombre.OPCION_UNICA:
          case TipoPreguntaNombre.SELECT:
            return r.id_opcion !== null;
          default:
            return true;
        }
      });

    console.log('Respuestas preparadas para enviar:', respuestasArray);

    try {
      await onSave(respuestasArray);
      setRespuestasGuardadas(true);
    } catch (err) {
      setError('Error al guardar las respuestas. Por favor intenta nuevamente.');
      console.error('Error saving answers:', err);
    }
  }

  const isOptionChecked = (idPregunta: number, idOpcion: number) => {
    return (respuestas[idPregunta] || []).some(r => r.id_opcion === idOpcion)
  }

  const renderPregunta = (pregunta: PreguntaData) => {
    const estaRespondida = (respuestas[pregunta.id]?.length ?? 0) > 0
    const claseInput = (estaCompletado && respuestasGuardadas) 
      ? 'bg-gray-100 cursor-not-allowed' 
      : 'focus:border-blue-500 focus:ring-blue-500'

    switch (pregunta.tipo.nombre) {
      case TipoPreguntaNombre.OPCION_MULTIPLE:
        return (
          <div className="space-y-2">
            {pregunta.opciones?.map(opcion => (
              <div key={opcion.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`p${pregunta.id}_o${opcion.id}`}
                  checked={isOptionChecked(pregunta.id, opcion.id)}
                  onChange={() => !(estaCompletado && respuestasGuardadas) && handleChange(pregunta.id, opcion.valor, opcion.id, true)}
                  disabled={estaCompletado && respuestasGuardadas}
                  className={`h-4 w-4 text-blue-600 ${claseInput}`}
                />
                <label htmlFor={`p${pregunta.id}_o${opcion.id}`} className="ml-2 block text-sm text-gray-700">
                  {opcion.texto}
                </label>
              </div>
            ))}
          </div>
        )
      
      case TipoPreguntaNombre.OPCION_UNICA:
        return (
          <div className="space-y-2">
            {pregunta.opciones?.map(opcion => (
              <div key={opcion.id} className="flex items-center">
                <input
                  type="radio"
                  id={`p${pregunta.id}_o${opcion.id}`}
                  name={`pregunta_radio_${pregunta.id}`}
                  value={opcion.valor}
                  checked={isOptionChecked(pregunta.id, opcion.id)}
                  onChange={() => !(estaCompletado && respuestasGuardadas) && handleChange(pregunta.id, opcion.valor, opcion.id)}
                  disabled={estaCompletado && respuestasGuardadas}
                  className={`h-4 w-4 text-blue-600 ${claseInput}`}
                />
                <label htmlFor={`p${pregunta.id}_o${opcion.id}`} className="ml-2 block text-sm text-gray-700">
                  {opcion.texto}
                </label>
              </div>
            ))}
          </div>
        )
      
      case TipoPreguntaNombre.RESPUESTA_CORTA:
        const textAnswer = respuestas[pregunta.id]?.[0] || {
          id_pregunta: pregunta.id,
          id_opcion: null,
          texto_respuesta: null,
          valor_rango: null,
          fecha: new Date().toISOString()
        }
        return (
          <input
            type="text"
            value={textAnswer.texto_respuesta || ''}
            onChange={(e) => !(estaCompletado && respuestasGuardadas) && handleChange(pregunta.id, e.target.value)}
            placeholder={pregunta.placeholder || 'Escribe tu respuesta...'}
            disabled={estaCompletado && respuestasGuardadas}
            className={`mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm sm:text-sm ${claseInput}`}
          />
        )
      
      case TipoPreguntaNombre.SELECT:
        const selectAnswer = respuestas[pregunta.id]?.[0] || {
          id_pregunta: pregunta.id,
          id_opcion: null,
          texto_respuesta: null,
          valor_rango: null,
          fecha: new Date().toISOString()
        }
        return (
          <select
            value={selectAnswer.id_opcion || ''}
            onChange={(e) => {
              if (estaCompletado && respuestasGuardadas) return
              const opcionId = parseInt(e.target.value)
              const opcion = pregunta.opciones?.find(o => o.id === opcionId)
              handleChange(pregunta.id, opcion?.valor || '', opcionId)
            }}
            disabled={estaCompletado && respuestasGuardadas}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm ${claseInput}`}
          >
            <option value="">Selecciona una opción</option>
            {pregunta.opciones?.map(opcion => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.texto}
              </option>
            ))}
          </select>
        )
      
      case TipoPreguntaNombre.RANGO:
        const rangeAnswer = respuestas[pregunta.id]?.[0] || {
          id_pregunta: pregunta.id,
          id_opcion: null,
          texto_respuesta: null,
          valor_rango: pregunta.min || 0,
          fecha: new Date().toISOString()
        }
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={pregunta.min || 0}
              max={pregunta.max || 100}
              step={pregunta.paso || 1}
              value={rangeAnswer.valor_rango || 0}
              onChange={(e) => !(estaCompletado && respuestasGuardadas) && handleChange(pregunta.id, parseInt(e.target.value))}
              disabled={estaCompletado && respuestasGuardadas}
              className={`w-full  ${(estaCompletado && respuestasGuardadas) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="text-sm text-gray-600">
              Valor seleccionado: {rangeAnswer.valor_rango}
            </div>
          </div>
        )
      
      default:
        return <div className="text-red-500">Tipo de pregunta no soportado: {pregunta.tipo.nombre}</div>
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
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Cerrar modal"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {estaCompletado && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">¡Formulario completado!</p>
                <p className="text-sm">
                  {respuestasGuardadas 
                    ? "Has respondido todas las preguntas. Ya no puedes modificar tus respuestas."
                    : "Has respondido todas las preguntas. Por favor haz clic en 'Concluir Test' para guardar tus respuestas."}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className={`space-y-2 ${(estaCompletado && respuestasGuardadas) ? 'opacity-90' : ''}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {index + 1}. {pregunta.texto_pregunta}
                  {pregunta.obligatoria && <span className="text-red-500"> *</span>}
                  {(respuestas[pregunta.id]?.length > 0) && (
                    <span className="ml-2 text-green-500 text-xs">✓ Respondida</span>
                  )}
                </label>
                {renderPregunta(pregunta)}
              </div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-500">
                Progreso: {progreso}%
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cursor-pointer p-2 px-10 border border-gray-300 text-sm rounded-md transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (estaCompletado && respuestasGuardadas)}
                  className={`cursor-pointer p-2 px-5 text-white text-sm rounded-md transition ${
                    isSubmitting 
                      ? 'bg-gray-400 opacity-50' 
                      : estaCompletado && respuestasGuardadas
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-[#6DC7E4] hover:bg-[#5ab3d0]'
                  }`}
                >
                  {isSubmitting 
                    ? 'Guardando...' 
                    : estaCompletado && respuestasGuardadas
                      ? <>
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completado
                        </>
                      : estaCompletado
                        ? 'Concluir Test'
                        : 'Guardar Respuestas'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}