'use client'
import React, { useState, useEffect } from 'react'
import { UsuarioData, PsicologoData, PreguntaData, RespuestaData, TestStatus, PesoPreguntaTipo } from "@/app/types/test"
import { UsuarioCompleto, TutorInfo } from "./../../app/types/gestionPaciente/index"
import Image from 'next/image'
import { ModalVerPacientesTestResultados } from './../modalVerPacientesTestResultados/modalVerPacientesTestResultados'
import FormPacientes from './../formPacientes/formPacientes'

interface TestAsignado {
  id: number
  nombre: string
  estado: TestStatus
  fecha_creacion: string | Date
  preguntas?: PreguntaData[]
  respuestas?: RespuestaData[]
  progreso?: number
  peso_preguntas?: PesoPreguntaTipo
  id_usuario?: number
  id_psicologo?: number
  grupos?: GrupoData[] | undefined
  comentarios_psicologo?: string
  interp_resul_sis?:string
  ponderacion_final?:Number
}


interface GrupoData {
  id: number;
  nombre: string;
  total_resp_valida: number;
  total_resp: number;
  interpretacion: string;
}
interface ModalPacienteProps {
  paciente: UsuarioCompleto
  psicologoId: number
  onClose: () => void
  onRefresh: () => void
  esAsignacion?: boolean
}

export default function ModalPaciente({ 
  paciente, 
  psicologoId, 
  onClose, 
  onRefresh,
  esAsignacion = false 
}: ModalPacienteProps) {
  const [tests, setTests] = useState<TestAsignado[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedTest, setSelectedTest] = useState<TestAsignado | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Obtener los tests del paciente
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(
          `/api/paciente?id_psicologo=${psicologoId}&id_paciente=${paciente.id}&conTests=true`
        )
        if (!response.ok) throw new Error('Error al obtener tests')
        
        const data = await response.json()
        setTests(data.tests || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!esAsignacion) {
      fetchTests()
    } else {
      setLoading(false)
    }
  }, [paciente.id, psicologoId, esAsignacion])

  const handleDeleteTest = async (testId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este test? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingTestId(testId)
    try {
      const response = await fetch(`/api/test?id=${testId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar test')

      setTests(prev => prev.filter(t => t.id !== testId))
      onRefresh()
    } catch (error) {
      console.error('Error eliminando test:', error)
      alert('Error al eliminar el test')
    } finally {
      setDeletingTestId(null)
    }
  }

  const handleViewTest = (test: TestAsignado) => {
    if (test.estado === TestStatus.COMPLETADO || test.estado === TestStatus.EVALUADO) {
      setSelectedTest(test)
      setShowTestModal(true)
    }
  }

  const handleEvaluarTest = async (preguntasActualizadas: PreguntaData[], comentario: string,totalPuntaje:number) => {
    if (!selectedTest) return

    setIsEvaluating(true)
    try {
      const response = await fetch(`/api/test?id=${selectedTest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluado: true,
          fecha_evaluacion: new Date().toISOString(),
          ponderacion_final: totalPuntaje,
          comentarios_psicologo: comentario,
          estado: TestStatus.EVALUADO,
          preguntas:preguntasActualizadas,
        })
      })

      if (!response.ok) {
        throw new Error('Error al evaluar el test')
      }

      // Actualizar el estado local
      setTests(prev => prev.map(t => 
        t.id === selectedTest.id ? { 
          ...t, 
          estado: TestStatus.EVALUADO,
          respuestas: t.respuestas?.map(r => ({
            ...r,
            puntaje: totalPuntaje
          }))
        } : t
      ))

      setShowTestModal(false)
      onRefresh()
      alert('Test evaluado correctamente')
    } catch (error) {
      console.error('Error evaluando test:', error)
      alert('Error al evaluar el test')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleEditUser = () => {
    setShowEditModal(true)
  }

  const handleCloseEdit = () => {
    setShowEditModal(false)
  }

  const handleUserUpdated = async (updatedUser: UsuarioData) => {
    try {
      const response = await fetch('/api/usuario', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(updatedUser)
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Error al actualizar el paciente')
      }

      // Actualizar los datos del paciente en el modal principal
      Object.assign(paciente, updatedUser)
      setShowEditModal(false)
      onRefresh()
      alert('Paciente actualizado correctamente')
    } catch (error) {
      console.error('Error al actualizar paciente:', error)
      alert('Error al actualizar el paciente')
    }
  }

  const handleDarDeAlta = async () => {
    const message = esAsignacion 
      ? '¿Estás seguro de asignar este paciente?'
      : '¿Estás seguro de dar de alta a este paciente? Esto eliminará todos sus tests asignados.'
    
    if (!confirm(message)) return

    setIsDeleting(true)
    try {
      const url = esAsignacion
        ? `/api/paciente`
        : `/api/paciente?id_paciente=${paciente.id}&id_psicologo=${psicologoId}`

      const method = esAsignacion ? 'POST' : 'DELETE'
      const body = esAsignacion 
        ? JSON.stringify({ id_paciente: paciente.id, id_psicologo: psicologoId })
        : undefined

      const response = await fetch(url, {
        method,
        headers: esAsignacion ? { 'Content-Type': 'application/json' } : undefined,
        body
      })

      if (!response.ok) throw new Error(
        esAsignacion ? 'Error al asignar paciente' : 'Error al dar de alta al paciente'
      )

      onClose()
      onRefresh()
    } catch (error) {
      console.error('Error:', error)
      alert(esAsignacion ? 'Error al asignar paciente' : 'Error al dar de alta al paciente')
    } finally {
      setIsDeleting(false)
    }
  }

  const getTestColor = (estado: TestStatus) => {
    switch (estado) {
      case TestStatus.COMPLETADO:
        return 'bg-[#6DC7E4]'
      case TestStatus.EVALUADO:
        return 'bg-green-100'
      case TestStatus.EN_PROGRESO:
        return 'bg-yellow-100'
      default:
        return 'bg-white'
    }
  }

  const calcularEdad = (fechaNacimiento?: string | Date) => {
    if (!fechaNacimiento) return null
    const fechaNac = new Date(fechaNacimiento)
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const mes = hoy.getMonth() - fechaNac.getMonth()
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }
    
    return edad
  }

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal principal */}
      <div className="bg-white rounded-lg shadow-xl max-w-[650px] w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Encabezado */}
          <div className="flex justify-between mb-2">
            <h2 className="font-medium text-lg">
              {esAsignacion ? 'Asignar Paciente' : 'Datos del Paciente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <hr className='w-full max-h-[600px] h-[0.5px] bg-black'/>
          
          {/* Datos del paciente */}
          <div className="space-y-4">
            <div className="space-y-2 p-2 bg-gray-50 rounded-lg m-0">
              <p><span className="font-medium">Nombre y Apellido:</span> {paciente.nombre}</p>
              <p><span className="font-medium">Email:</span> {paciente.email}</p>
              <p><span className="font-medium">Cédula:</span> {paciente.cedula || 'No especificado'}</p>
              <p><span className="font-medium">Telefono:</span> {paciente.telefono|| 'No especificado'}</p>
              <p>
                <span className="font-medium">Fecha de Nacimiento:</span>{' '}
                {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString() : 'No especificado'}
              </p>
              <p>
                <span className="font-medium">Edad:</span>{' '}
                {calcularEdad(paciente.fecha_nacimiento ?? undefined) ?? 'No especificado'}
                {calcularEdad(paciente.fecha_nacimiento ?? undefined) ? ' años' : ''}
              </p>
            </div>

            {/* Datos del tutor si es adolescente */}
            {paciente.adolecente && (
              <div className="space-y-2 p-2 bg-gray-50 rounded-lg m-0">
                <div className="flex flex-col justify-start items-start">               
                  <h3 className="font-medium text-lg">Información del Tutor</h3>
                  <hr className='w-full max-h-[600px] h-[0.5px] bg-black'/>
                </div>
                <div className="space-y-1 border border-black rounded-2xl p-2">
                  <p><span className="font-medium">Nombre y Apellido:</span> {paciente.adolecente.tutor?.nombre_tutor || 'No especificado'}</p>
                  <p><span className="font-medium">Cédula:</span> {paciente.adolecente.tutor?.cedula_tutor || 'No especificado'}</p>
                  <p><span className="font-medium">Profesión:</span> {paciente.adolecente.tutor?.profesion_tutor || 'No especificado'}</p>
                  <p><span className="font-medium">Teléfono:</span> {paciente.adolecente.tutor?.telefono_contacto || 'No especificado'}</p>
                  <p><span className="font-medium">Email:</span> {paciente.adolecente.tutor?.correo_contacto || 'No especificado'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Listado de tests (solo si no es modo asignación) */}
          {!esAsignacion && (
            <div className="mb-2">
              <div className='space-y-2 p-2 bg-gray-50 rounded-lg m-0'>
                <h3 className="text-lg font-medium mb-0">Tests Asignados</h3>
                <hr className='w-full max-h-[600px] h-[0.5px] bg-black'/>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : tests.length === 0 ? (
                  <p className="text-gray-500 italic">No hay tests asignados a este paciente</p>
                ) : (
                  <div className="space-y-3">
                    {tests.map((test) => (
                      <div 
                        key={test.id}
                        className={`${getTestColor(test.estado)} p-3 rounded-lg flex justify-between items-center transition-colors border border-gray-200`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{test.nombre || "Test sin nombre"}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {test.estado === TestStatus.COMPLETADO
                                ? 'Completado' 
                                : test.estado === TestStatus.EVALUADO
                                  ? 'Evaluado'
                                  : test.estado === TestStatus.EN_PROGRESO 
                                    ? 'En progreso' 
                                    : 'No iniciado'}
                            </span>
                            {typeof test.progreso === 'number' && (
                              <span className="text-xs bg-white px-2 py-0.5 rounded-full">
                                {Math.round(test.progreso)}% completado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Asignado el: {test.fecha_creacion 
                              ? new Date(test.fecha_creacion).toLocaleDateString() 
                              : "Fecha no disponible"}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {(test.estado === TestStatus.COMPLETADO || test.estado === TestStatus.EVALUADO) && (
                            <button
                              onClick={() => handleViewTest(test)}
                              className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                              title="Ver resultados"
                              aria-label="Ver resultados del test"
                            >
                              <Image src="/logos/lupa.svg" className='w-[20px] h-[20px]' width={0} height={0} alt="Ver test" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => test.id && handleDeleteTest(test.id)}
                            disabled={deletingTestId === test.id}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 cursor-pointer"
                            title="Eliminar test"
                            aria-label="Eliminar test"
                          >
                            {deletingTestId === test.id ? (
                              <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Image src="/logos/icon_eliminar.svg" className='w-[20px] h-[20px]' width={0} height={0} alt="Eliminar test" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200">
            {!esAsignacion && (
              <button
                onClick={handleEditUser}
                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-[#E0F8F0] rounded-md hover:bg-[#C0F0E0] transition-colors"
                aria-label="Editar paciente"
              >
                <Image src="/logos/icon_editar.svg" className='w-[16px] h-[16px]' width={0} height={0} alt="Editar" />
                Editar Paciente
              </button>
            )}
            
            <button
              onClick={handleDarDeAlta}
              disabled={isDeleting}
              className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                esAsignacion
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-[#E0F8F0] hover:bg-[#C0F0E0]'
              }`}
              aria-label={esAsignacion ? "Asignar paciente" : "Dar de alta paciente"}
            >
              {isDeleting ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  {esAsignacion ? 'Asignando...' : 'Procesando...'}
                </>
              ) : (
                <>
                  <Image 
                    src="/logos/user-dar-alta.svg"
                    width={0} 
                    height={0}
                    className='w-[16px] h-[16px]' 
                    alt={esAsignacion ? "Asignar" : "Dar de alta"} 
                  />
                  {esAsignacion ? 'Asignar Paciente' : 'Dar de Alta'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal para ver test */}
      {showTestModal && selectedTest && (
        <ModalVerPacientesTestResultados
          preguntas={selectedTest.preguntas ?? []}
          respuestas={selectedTest.respuestas ?? []}
          estado={selectedTest.estado}
          pesoPreguntas={selectedTest.peso_preguntas ?? PesoPreguntaTipo.SIN_VALOR}
          onClose={() => setShowTestModal(false)}
          onEvaluar={handleEvaluarTest}
          grupos={selectedTest.grupos ? selectedTest.grupos :  undefined}
          comentarios_psicologo={selectedTest.comentarios_psicologo}
          interp_resul_sis= {selectedTest.interp_resul_sis}
          total_resultados={selectedTest.ponderacion_final}
        />
      )}

      {/* Modal para editar paciente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <div className='flex justify-start flex-col'>
                  <h2 className="text-2xl font-medium">Editar Paciente</h2>
                </div>
                <button onClick={handleCloseEdit} className="text-gray-500 hover:text-gray-700 cursor-pointer" aria-label="Cerrar modal de edición">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <hr className='w-full max-h-[600px] h-[0.5px] bg-black'/>
              <FormPacientes
                user={paciente}
                onSubmit={handleUserUpdated}
                onToggleEdit={handleCloseEdit}
                psicologoId={psicologoId}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}