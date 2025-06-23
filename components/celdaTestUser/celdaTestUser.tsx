'use client'
import React, { useState } from "react"
import Link from "next/link"
import { TestResponse, TestStatus } from "./../../app/types/test"
import { ModalFormularioTest } from "./../modalFormulrioTestProps/modalFormularioTestProps"
import { ModalVerRespuestas } from "./../modalVerRepuestasProps/modalVerRespuestasProps"
import Image from "next/image"
import svgAzul from "./../../app/public/logos/fondo_azul_logo_celda.svg"
import svgBlanco from "./../../app/public/logos/fondo_blanco_logo_celda.svg"

interface CeldaTestProps extends TestResponse {
  onTestUpdated?: (nuevoEstado?: TestStatus) => Promise<void>;
}

export default function CeldaTest({
  id,
  psicologo,
  usuario,
  estado,
  progreso,
  preguntas = [],
  respuestas = [],
  fecha_creacion,
  fecha_ultima_respuesta,
  nombre,
  onTestUpdated
}: CeldaTestProps) {
  const [showFormModal, setShowFormModal] = useState(false)
  const [showRespuestasModal, setShowRespuestasModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bgColor = estado === 'completado' ? 'bg-white' : 'bg-[#6DC7E4]'
  const borderStyle = respuestas.length === 0 ? 'border-l-4 border-blue-500' : ''

  const nombrePsicologo = psicologo?.usuario.nombre || "Psicólogo no asignado"
  const especialidad = psicologo?.nombre_universidad || "Universidad no especificada"
  const nombreUsuario = usuario?.nombre || "Usuario no asignado"

  const handleSaveRespuestas = async (nuevasRespuestas: any[]) => {
    setIsSubmitting(true);
    console.log(nuevasRespuestas);
    
    try {
      const response = await fetch(`/api/test?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respuestas: nuevasRespuestas,
          id_usuario: usuario?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar las respuestas');
      }

      // Determine new status based on progress
      const preguntasRespondidas = nuevasRespuestas.filter(r => 
        r.id_opcion !== null || 
        (r.texto_respuesta && r.texto_respuesta.trim() !== '') ||
        r.valor_rango !== null
      ).length;
      
      const nuevoProgreso = Math.round((preguntasRespondidas / preguntas.length) * 100);
      const nuevoEstado = nuevoProgreso >= 100 ? 'completado' : 
                         nuevoProgreso > 0 ? 'en_progreso' : 'no_iniciado';

      // Call the parent component's update function
      if (onTestUpdated) {
        await onTestUpdated(nuevoEstado as TestStatus);
      }

      setShowFormModal(false);
    } catch (error) {
      console.error('Error guardando respuestas:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar las respuestas');
    } finally {
      setIsSubmitting(false);
    }
      
  }
  
  return (
    <>
      <div className={`${bgColor} ${borderStyle} w-full rounded-xl p-4 mb-3 shadow-sm relative`}>
      <div className="relative">
        <Image
          className="absolute w-[200px] h-[200px] right-0 button-[10px]"
          src={estado === 'completado' ? svgBlanco:svgAzul}
          width={180}
          height={90}
          alt="Logo"
        />
      </div>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">
              {nombre ? `Sesión ${nombre}` : `Test #${id}`}
            </h3>
            <p className="text-sm text-gray-600">
              Creado: {fecha_creacion ? new Date(fecha_creacion).toLocaleDateString() : "Fecha no disponible"}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            estado === 'completado' 
              ? 'bg-green-100 text-green-800' 
              : estado === 'en_progreso' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-blue-100 text-blue-800'
          }`}>
            {estado === 'completado' ? 'Completado' : estado === 'en_progreso' ? 'En progreso' : 'No iniciado'}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {psicologo && (
            <>
              <p className="text-sm">
                <span className="font-semibold">Psicólogo:</span> {nombrePsicologo}
              </p>
            </>
          )}
          <p className="text-sm">
            <span className="font-semibold">Progreso:</span> {progreso}% ({preguntas.length} preguntas, {respuestas.length} respuestas)
          </p>
        </div>

        {fecha_ultima_respuesta && (
          <p className="text-xs text-gray-500 mt-1">
            Última respuesta: {new Date(fecha_ultima_respuesta).toLocaleString()}
          </p>
        )}

        <div className="flex justify-center mt-3 p-2">
          {estado === 'completado' ? (
            <button
              onClick={() => setShowRespuestasModal(true)}
              className="cursor-pointer p-2 px-10   text-black-700 border border-black text-sm rounded-md transition"
            >
              Resivar test
            </button>
          ) : (
            <button
              onClick={() => setShowFormModal(true)}
              className="cursor-pointer p-2 px-10 bg-white text-blue text-sm rounded-md transition"
            >
              {estado === 'no_iniciado' ? 'Comenzar test' : 'Continuar test'}
            </button>
          )}
        </div>
      </div>

      {/* Modales */}
      {showFormModal && (
        <ModalFormularioTest
          preguntas={preguntas}
          onSave={handleSaveRespuestas}
          onClose={() => setShowFormModal(false)}
          initialRespuestas={respuestas.map(r => ({
            id_pregunta: r.id_pregunta,
            id_opcion: r.id_opcion,
            texto_respuesta: r.texto_respuesta,
            valor_rango: r.valor_rango
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