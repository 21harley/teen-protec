'use client'
import React, { useState, useEffect } from "react"
import CeldaTest from "./../celdaTestUser/celdaTestUser"
import useUserStore from "@/app/store/store"
import { TestResponse, PaginatedResponse, TestStatus } from "./../../app/types/test"
import Link from "next/link"
import { LoginResponse } from "./../../app/types/user/index"
import { StorageManager } from "@/app/lib/storageManager"

export default function UserTests() {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const user = useUserStore((state) => state.user)
  let userId = user?.id

  const fetchTests = async () => {
    if (!userId) {
      const storageManager = new StorageManager('local')
      const data = storageManager.load<LoginResponse>('userData')
      if (data) {
        userId = data.user.id
      } else {
        setError("No se pudo obtener el ID del usuario")
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/test?id_usuario=${userId}&page=${pagination.page}&pageSize=${pagination.pageSize}`
      )
      
      if (!response.ok) {
        throw new Error('Error al obtener los tests')
      }

      const data: PaginatedResponse<TestResponse> = await response.json()
      
      const processedTests = data.data.map((test) => {
        // Mapeamos las preguntas con sus respuestas correspondientes
        const preguntasConRespuestas = test.preguntas.map(pregunta => {
          const respuestas = test.respuestas.filter(r => r.id_pregunta === pregunta.id)
          return { pregunta, respuestas }
        })

        // Calculamos preguntas respondidas válidamente
        const preguntasRespondidas = preguntasConRespuestas.filter(({ pregunta, respuestas }) => {
          // Preguntas obligatorias deben estar respondidas
          if (pregunta.obligatoria && respuestas.length === 0) {
            return false
          }

          // Validación por tipo de pregunta
          switch (pregunta.tipo.nombre) {
            case 'radio':
            case 'select':
              // Debe tener al menos una respuesta con id_opcion no nulo
              return respuestas.some(r => r.id_opcion !== null)
            
            case 'checkbox':
              // Debe tener al menos una opción seleccionada
              return respuestas.some(r => r.id_opcion !== null)
            
            case 'text':
              // Debe tener texto_respuesta no vacío
              return respuestas.some(r => r.texto_respuesta && r.texto_respuesta.trim() !== '')
            
            case 'range':
              // Debe tener valor_rango no nulo
              return respuestas.some(r => r.valor_rango !== null)
            
            default:
              return respuestas.length > 0
          }
        }).length
        
        const totalPreguntas = test.preguntas.length
        const progreso = totalPreguntas > 0
          ? Math.round((preguntasRespondidas / totalPreguntas) * 100)
          : 0

        let estado: TestStatus = test.estado || ('no_iniciado' as TestStatus);
        if (test.estado === undefined) {
          estado = progreso >= 100 ? 'completado' as TestStatus :
                   progreso > 0 ? 'en_progreso' as TestStatus :
                   'no_iniciado' as TestStatus
        }

        // Encontrar la fecha más reciente de respuesta
        const fechaUltimaRespuesta = test.respuestas.length > 0
          ? new Date(Math.max(...test.respuestas.map(r => new Date(r.fecha).getTime())))
          : null

        return {
          ...test,
          estado,
          progreso,
          fecha_ultima_respuesta: fechaUltimaRespuesta?.toISOString() || null
        }
      })

      setTests(processedTests)
      setPagination(prev => ({
        ...prev,
        total: data.total
      }))
    } catch (err) {
      console.error("Error fetching tests:", err)
      setError(err instanceof Error ? err.message : "Error al cargar los tests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [userId, pagination.page, pagination.pageSize])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleTestUpdated = async (testId: number, nuevoEstado?: TestStatus) => {
    // Actualización optimista del estado local
    if (nuevoEstado) {
      setTests(prevTests => prevTests.map(test => 
        test.id === testId ? { ...test, estado: nuevoEstado } : test
      ));
    }
    
    // Luego hacer el fetch para sincronizar con el servidor
    await fetchTests();
  }

  if (loading) {
    return (
      <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-medium mb-4">Tests</h1>
          <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
        </div>
        <hr className="mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-medium mb-4">Tests</h1>
        </div>
        <hr className="mb-4" />
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error al cargar los tests</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium">Tests</h1>
        <div className="text-sm text-gray-600">
          Mostrando {(pagination.page - 1) * pagination.pageSize + 1}-
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
        </div>
      </div>
      <hr className="mb-4" />

      {tests.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center">
          <p>No tienes tests asignados</p>
          <Link
            href="/tests/nuevo"
            className="inline-block mt-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
          >
            Crear nuevo test
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {tests.map((test) => (
              <CeldaTest
                key={test.id}
                {...test}
                onTestUpdated={(nuevoEstado) => handleTestUpdated(test.id, nuevoEstado)}
              />
            ))}
          </div>

          {pagination.total > pagination.pageSize && (
            <div className="flex justify-center mt-4">
              <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 border-t border-b border-gray-300 text-sm font-medium ${
                      pagination.page === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                  className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}