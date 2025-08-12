'use client'
import React, { useState } from "react"
import { TestStatus, FullTestData, RespuestaData } from "./../../app/types/test"
import { ModalFormularioTest } from "./../modalFormulrioTestProps/modalFormularioTestProps"
import { ModalVerRespuestas } from "./../modalVerRepuestasProps/modalVerRespuestasProps"
import Image from "next/image"
import svgAzul from "./../../app/public/logos/fondo_azul_logo_celda.svg"
import svgBlanco from "./../../app/public/logos/fondo_blanco_logo_celda.svg"

interface CeldaTestProps extends FullTestData {
  onTestUpdated?: (nuevoEstado?: TestStatus) => Promise<void>;
}

export default function CeldaTest({
  id,
  psicologo,
  usuario,
  estado = TestStatus.NO_INICIADO,
  preguntas = [],
  respuestas = [],
  fecha_creacion = new Date().toISOString(),
  fecha_ultima_respuesta,
  nombre = 'Test sin nombre',
  onTestUpdated
}: CeldaTestProps) {
  const [showFormModal, setShowFormModal] = useState(false)
  const [showRespuestasModal, setShowRespuestasModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bgColor = estado === TestStatus.COMPLETADO || estado === TestStatus.EVALUADO 
    ? 'bg-white' 
    : 'bg-[#6DC7E4]'
  const borderStyle = respuestas.length === 0 ? 'border-l-4 border-blue-500' : ''

  const nombrePsicologo = psicologo?.usuario?.nombre || "Psicólogo no asignado"
  const nombreUsuario = usuario?.nombre || "Usuario no asignado"

  const handleSaveRespuestas = async (nuevasRespuestas: RespuestaData[]) => {
    if (!usuario?.id) {
      alert('Usuario no identificado')
      return
    }

    setIsSubmitting(true)
    
    try {
      const payload = {
        id_usuario: usuario.id,
        respuestas: nuevasRespuestas.map(r => ({
          id_pregunta: r.id_pregunta,
          ...(r.id_opcion !== undefined && { id_opcion: r.id_opcion }),
          ...(r.texto_respuesta !== undefined && { texto_respuesta: r.texto_respuesta }),
          ...(r.valor_rango !== undefined && { valor_rango: r.valor_rango })
        }))
      }

      const response = await fetch(`/api/test?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      // Calcular nuevo estado basado en respuestas
      const respuestasValidas = nuevasRespuestas.filter(r => 
        (r.id_opcion !== null && r.id_opcion !== undefined) ||
        (r.texto_respuesta && r.texto_respuesta.trim() !== '') ||
        (r.valor_rango !== null && r.valor_rango !== undefined)
      ).length

      const nuevoProgreso = Math.round((respuestasValidas / preguntas.length) * 100)
      let nuevoEstado = estado

      if (nuevoProgreso >= 100) {
        nuevoEstado = TestStatus.COMPLETADO
      } else if (nuevoProgreso > 0) {
        nuevoEstado = TestStatus.EN_PROGRESO
      }

      if(nuevoEstado){
        if (onTestUpdated) {
         await onTestUpdated(nuevoEstado);
        }
      }

      setShowFormModal(false)
    } catch (error) {
      console.error('Error guardando respuestas:', error)
      alert('Error al guardar las respuestas: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const safeFechaUltimaRespuesta = fecha_ultima_respuesta ? new Date(fecha_ultima_respuesta) : null
  const safeFechaCreacion = fecha_creacion ? new Date(fecha_creacion) : null

  return (
    <>
      <div className={`${bgColor} ${borderStyle} w-full rounded-xl p-4 mb-3 shadow-sm relative`}>
        <div className="relative">
          <Image
            className="absolute w-[200px] h-[200px] right-0 button-[10px]"
            src={estado === TestStatus.COMPLETADO || estado === TestStatus.EVALUADO ? svgBlanco : svgAzul}
            width={180}
            height={90}
            alt="Logo"
            priority
          />
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">
              {nombre}
            </h3>
            <p className="text-sm text-gray-600">
              Creado: {safeFechaCreacion?.toLocaleString() || "Fecha no disponible"}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            estado === TestStatus.COMPLETADO || estado === TestStatus.EVALUADO
              ? 'bg-green-100 text-green-800' 
              : estado === TestStatus.EN_PROGRESO
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-blue-100 text-blue-800'
          }`}>
            {estado === TestStatus.COMPLETADO ? 'Completado' : 
             estado === TestStatus.EVALUADO ? 'Evaluado' :
             estado === TestStatus.EN_PROGRESO ? 'En progreso' : 'No iniciado'}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-sm">
            <span className="font-semibold">Psicólogo:</span> {nombrePsicologo}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Paciente:</span> {nombreUsuario}
          </p>
        </div>

        {safeFechaUltimaRespuesta && (
          <p className="text-xs text-gray-500 mt-1">
            Última respuesta: {safeFechaUltimaRespuesta.toLocaleString()}
          </p>
        )}

        <div className="flex justify-center mt-3 p-2">
          {estado === TestStatus.COMPLETADO || estado === TestStatus.EVALUADO ? (
            <button
              onClick={() => setShowRespuestasModal(true)}
              className="cursor-pointer p-2 px-10 text-black-700 border border-black text-sm rounded-md transition hover:bg-gray-100"
            >
              Revisar test
            </button>
          ) : (
            <button
              onClick={() => setShowFormModal(true)}
              className={`cursor-pointer p-2 px-10 text-sm rounded-md transition ${
                estado === TestStatus.NO_INICIADO
                  ? 'bg-white text-blue-700 border border-blue-500 hover:bg-blue-50' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 
               estado === TestStatus.NO_INICIADO ? 'Comenzar test' : 'Continuar test'}
            </button>
          )}
        </div>
      </div>

      {showFormModal && (
        <ModalFormularioTest
          preguntas={preguntas}
          onSave={handleSaveRespuestas}
          onClose={() => setShowFormModal(false)}
          initialRespuestas={respuestas.map(r => ({
            id_pregunta: r.id_pregunta,
            id_opcion: r.id_opcion ?? null,
            texto_respuesta: r.texto_respuesta ?? null,
            valor_rango: r.valor_rango ?? null
          }))}
          isSubmitting={isSubmitting}
        />
      )}

      {showRespuestasModal && (
        <ModalVerRespuestas
          preguntas={preguntas}
          respuestas={respuestas}
          onClose={() => setShowRespuestasModal(false)}
        />
      )}
    </>
  )
}