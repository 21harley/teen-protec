'use client'
import React, { useState, useEffect } from "react"
import CeldaTest from "./../celdaTestUser/celdaTestUser"
import useUserStore from "@/app/store/store"
import { TestStatus, TipoPreguntaNombre, FullTestData, PaginatedResponse } from "./../../app/types/test"
import { UsuarioInfo } from "./../../app/types/user"
import { StorageManager } from "@/app/lib/storageManager"

export default function UserTests() {
  const [tests, setTests] = useState<FullTestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const user = useUserStore((state) => state.user)
  let userId = user?.id

  const fetchTests = async (): Promise<void> => {
    if (!userId) {
      const storageManager = new StorageManager('local')
      const data = storageManager.load<UsuarioInfo>('userData')
      if (data) {
        userId = data.id
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

      const data: PaginatedResponse<FullTestData> = await response.json()
      
      const processedTests = data.data.map((test): FullTestData => {
        const preguntasConRespuestas = test.preguntas?.map((pregunta) => {
          const respuestas = test.respuestas?.filter((r) => r.id_pregunta === pregunta.id) || []
          return { pregunta, respuestas }
        }) || []

        const preguntasRespondidas = preguntasConRespuestas.filter(({ pregunta, respuestas }) => {
          if (pregunta.obligatoria && respuestas.length === 0) return false
          if (!pregunta.tipo) return false
          switch (pregunta.tipo.nombre) {
            case TipoPreguntaNombre.OPCION_MULTIPLE:
            case TipoPreguntaNombre.OPCION_UNICA:
            case TipoPreguntaNombre.SELECT:
              return respuestas.some(r => r.id_opcion != null)
            case TipoPreguntaNombre.RESPUESTA_CORTA:
              return respuestas.some(r => r.texto_respuesta?.trim() !== '')
            case TipoPreguntaNombre.RANGO:
              return respuestas.some(r => r.valor_rango != null)
            default:
              return respuestas.length > 0
          }
        }).length
        
        const totalPreguntas = test.preguntas?.length || 0
        const progreso = totalPreguntas > 0
          ? Math.round((preguntasRespondidas / totalPreguntas) * 100)
          : 0

        let estado: TestStatus = test.estado || TestStatus.NO_INICIADO;
        if (test.estado === undefined) {
          estado = progreso >= 100 ? TestStatus.COMPLETADO :
                   progreso > 0 ? TestStatus.EN_PROGRESO :
                   TestStatus.NO_INICIADO
        }

        const fechaUltimaRespuesta = test.respuestas?.length
          ? new Date(Math.max(...test.respuestas.map(r => new Date(r.fecha || '').getTime())))
          : null

        return {
          ...test,
          id: test.id || 0,
          nombre: test.nombre || 'Test sin nombre',
          estado,
          fecha_creacion: test.fecha_creacion || new Date().toISOString(),
          fecha_ultima_respuesta: fechaUltimaRespuesta?.toISOString() || null,
          preguntas: test.preguntas || [],
          respuestas: test.respuestas || [],
          psicologo: test.psicologo,
          usuario: test.usuario
        }
      })
     
      console.log(processedTests,"ProcessedTests");
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

  const handlePageChange = (newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleTestUpdated = async (testId: number, nuevoEstado?: TestStatus): Promise<void> => {
    if (nuevoEstado) {
      setTests(prevTests => prevTests.map(test => 
        test.id === testId ? { ...test, estado: nuevoEstado } : test
      ))
    }
    await fetchTests()
  }

  if (loading) {
    return (
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-medium">Tests</h1>
          <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
        </div>
        <hr className="mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-32" />
          ))}
        </div>
      </div>
      </section>

    )
  }

  if (error) {
    return (
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
              <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-medium">Tests</h1>
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
      </section>

    )
  }

  return (
    <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-start p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium">Tests</h1>
        </div>
        <div className="text-sm text-gray-600">
          Mostrando {(pagination.page - 1) * pagination.pageSize + 1}-
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
        </div>
      </div>
      <hr className="mb-4" />

      {tests.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center">
          <p>No tienes tests asignados</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {tests.map((test) => (
<CeldaTest
  key={test.id}
  id={test.id}
  nombre={test.nombre}
  estado={test.estado}
  fecha_creacion={test.fecha_creacion}
  fecha_ultima_respuesta={test.fecha_ultima_respuesta}
  preguntas={test.preguntas}
  respuestas={test.respuestas}
  psicologo={test.psicologo}
  usuario={test.usuario}
  onTestUpdated={async (nuevoEstado) => {
    if (test.id) {
      await handleTestUpdated(test.id, nuevoEstado);
    }
  }}
  comentarios_psicologo={test.comentarios_psicologo}
  interp_resul_sis={test.interp_resul_sis}
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
    </section>
  )
}