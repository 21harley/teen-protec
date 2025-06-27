'use client'
import React, { useState, useEffect } from 'react';
import { UsuarioCompleto } from "./../../app/types/gestionPaciente/index";
import Image from 'next/image';
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import IconLupa from "./../../app/public/logos/lupa.svg";
import IconLogoDarAlta from "./../../app/public/logos/user-dar-alta.svg.svg";
import { ModalVerPacientesTestResultados } from './../modalVerPacientesTestResultados/modalVerPacientesTestResultados';
import FormPacientes from './../formPacientes/formPacientes';
import { PreguntaResponse, RespuestaResponse } from '@/app/types/test';

export interface TestAsignado {
  id: number;
  nombre: string;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  fecha_creacion: string | Date;
  preguntas?: PreguntaResponse[];
  respuestas?: RespuestaResponse[];
  progreso?: number;
}

interface ModalPacienteProps {
  paciente: UsuarioCompleto;
  psicologoId: number;
  onClose: () => void;
  onRefresh: () => void;
  esAsignacion?: boolean;
}

export default function ModalPaciente({ 
  paciente, 
  psicologoId, 
  onClose, 
  onRefresh,
  esAsignacion = false 
}: ModalPacienteProps) {
  const [tests, setTests] = useState<TestAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestAsignado | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Obtener los tests del paciente
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(
          `/api/paciente?id_psicologo=${psicologoId}&id_paciente=${paciente.id}&conTests=true`
        );
        if (!response.ok) throw new Error('Error al obtener tests');
        
        const data = await response.json();
        setTests(data.tests || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!esAsignacion) {
      fetchTests();
    } else {
      setLoading(false);
    }
  }, [paciente.id, psicologoId, esAsignacion]);

  const handleDeleteTest = async (testId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este test? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingTestId(testId);
    try {
      const response = await fetch(`/api/test?id=${testId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar test');

      setTests(prev => prev.filter(t => t.id !== testId));
      onRefresh();
    } catch (error) {
      console.error('Error eliminando test:', error);
      alert('Error al eliminar el test');
    } finally {
      setDeletingTestId(null);
    }
  };

  const handleViewTest = (test: TestAsignado) => {
    if (test.estado === 'completado') {
      setSelectedTest(test);
      setShowTestModal(true);
    }
  };

  const handleEditUser = () => {
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
  };

  const handleUserUpdated = () => {
    onRefresh();
    setShowEditModal(false);
  };

  const handleDarDeAlta = async () => {
    const message = esAsignacion 
      ? '¿Estás seguro de asignar este paciente?'
      : '¿Estás seguro de dar de alta a este paciente? Esto eliminará todos sus tests asignados.';
    
    if (!confirm(message)) return;

    setIsDeleting(true);
    try {
      const url = esAsignacion
        ? `/api/paciente` // POST para asignar
        : `/api/paciente?id_paciente=${paciente.id}&id_psicologo=${psicologoId}`; // DELETE para dar de alta

      const method = esAsignacion ? 'POST' : 'DELETE';
      const body = esAsignacion 
        ? JSON.stringify({ id_paciente: paciente.id, id_psicologo: psicologoId })
        : undefined;

      const response = await fetch(url, {
        method,
        headers: esAsignacion ? { 'Content-Type': 'application/json' } : undefined,
        body
      });

      if (!response.ok) throw new Error(
        esAsignacion ? 'Error al asignar paciente' : 'Error al dar de alta al paciente'
      );

      onClose();
      onRefresh();
    } catch (error) {
      console.error('Error:', error);
      alert(esAsignacion ? 'Error al asignar paciente' : 'Error al dar de alta al paciente');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTestColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-[#6DC7E4]';
      case 'en_progreso':
        return 'bg-yellow-100';
      default:
        return 'bg-white';
    }
  };

  const calcularEdad = (fechaNacimiento?: string | Date) => {
    if (!fechaNacimiento) return null;
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad;
  };

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal principal */}
      <div className="bg-white rounded-lg shadow-xl max-w-[650px] w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-black">
              {esAsignacion ? 'Asignar Paciente' : 'Datos del Paciente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Datos del paciente */}
          <div className="mb-6 space-y-4">
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <p><span className="font-medium">Nombre:</span> {paciente.nombre}</p>
              <p><span className="font-medium">Email:</span> {paciente.email}</p>
              <p><span className="font-medium">Cédula:</span> {paciente.cedula}</p>
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
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg">Información del Tutor</h3>
                <div className="space-y-1">
                  <p><span className="font-medium">Nombre:</span> {paciente.adolecente.tutor?.nombre || 'No especificado'}</p>
                  <p><span className="font-medium">Cédula:</span> {paciente.adolecente.tutor?.cedula || 'No especificado'}</p>
                  <p><span className="font-medium">Profesión:</span> {paciente.adolecente.tutor?.profesion_tutor || 'No especificado'}</p>
                  <p><span className="font-medium">Teléfono:</span> {paciente.adolecente.tutor?.telefono_contacto || 'No especificado'}</p>
                  <p><span className="font-medium">Email:</span> {paciente.adolecente.tutor?.correo_contacto || 'No especificado'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Listado de tests (solo si no es modo asignación) */}
{/* Listado de tests (solo si no es modo asignación) */}
{!esAsignacion && (
  <div className="mb-6">
    <h3 className="text-lg font-medium mb-2">Tests Asignados</h3>
    <div className="p-4 border border-gray-200 rounded-lg">
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : !tests || tests.length === 0 ? (
        <p className="text-gray-500 italic">No hay tests asignados a este paciente</p>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div 
              key={test.id || `test-${Math.random().toString(36).substr(2, 9)}`}
              className={`${getTestColor(test.estado)} p-3 rounded-lg flex justify-between items-center transition-colors border border-gray-200`}
            >
              <div className="flex-1">
                <p className="font-medium">{test.nombre || "Test sin nombre"}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {!test.estado 
                      ? "Estado desconocido" 
                      : test.estado === 'completado' 
                        ? 'Completado' 
                        : test.estado === 'en_progreso' 
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
                {test.estado === 'completado' && (
                  <button
                    onClick={() => test.id && handleViewTest(test)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Ver resultados"
                  >
                    {IconLupa ? (
                      <Image src={IconLupa} width={20} height={20} alt="Ver test" />
                    ) : (
                      <span>👁️</span>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => test.id && handleDeleteTest(test.id)}
                  disabled={deletingTestId === test.id}
                  className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Eliminar test"
                >
                  {deletingTestId === test.id ? (
                    <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : IconLogoCerrar ? (
                    <Image src={IconLogoCerrar} width={20} height={20} alt="Eliminar test" />
                  ) : (
                    <span>🗑️</span>
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E0F8F0] rounded-md hover:bg-[#C0F0E0] transition-colors"
              >
                <Image src={IconLogoEditar} width={16} height={16} alt="Editar" />
                Editar Paciente
              </button>
            )}
            
            <button
              onClick={handleDarDeAlta}
              disabled={isDeleting}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                esAsignacion
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-[#E0F8F0] hover:bg-[#C0F0E0]'
              }`}
            >
              {isDeleting ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  {esAsignacion ? 'Asignando...' : 'Procesando...'}
                </>
              ) : (
                <>
                  <Image 
                    src={IconLogoDarAlta} 
                    width={16} 
                    height={16} 
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
          onClose={() => setShowTestModal(false)}
        />
      )}

      {/* Modal para editar paciente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-medium">Editar Paciente</h2>
                <button onClick={handleCloseEdit} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FormPacientes
                user={paciente}
                onSubmit={handleUserUpdated}
                psicologoId={psicologoId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}