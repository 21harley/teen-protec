import React, { useState, useEffect } from 'react';
import { TestPlantilla } from './../../app/types/plantilla/index';
import ModalRegistraTestPlantilla from './../modalRegistrarTestPlantilla/modalRegistrarTestPlantilla';
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import IconLogoEliminar from "./../../app/public/logos/icon_eliminar.svg";
import Image from "next/image";
import { UsuarioCompleto } from '@/app/types/gestionPaciente';

interface ModalGestionTestPacientesProps {
  isOpen: boolean;
  onClose: () => void;
  user: UsuarioCompleto;
  idPsicologo: number;
}

const ModalGestionTestPacientes: React.FC<ModalGestionTestPacientesProps> = ({ 
  isOpen, 
  onClose, 
  user,
  idPsicologo 
}) => {
  const [plantillas, setPlantillas] = useState<TestPlantilla[]>([]);
  const [selectedPlantillas, setSelectedPlantillas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [plantillaToEdit, setPlantillaToEdit] = useState<TestPlantilla | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlantillas();
    }
  }, [isOpen]);

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/plantilla?id_psicologo=${idPsicologo}`);
      if (!response.ok) throw new Error('Error al obtener plantillas');
      const data = await response.json();
      setPlantillas(data.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar las plantillas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlantilla = (id: number) => {
    setSelectedPlantillas(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleDeletePlantilla = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/plantilla?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      await fetchPlantillas();
      setSuccess('Plantilla eliminada correctamente');
    } catch (err) {
      setError('Error al eliminar la plantilla');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlantilla = async (plantillaData: any) => {
    setLoading(true);
    let error = "";
    try {
      const response = await fetch('/api/plantilla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...plantillaData,
          id_psicologo: idPsicologo
        })
      });
      
      if (!response.ok){
   // Intentar obtener el mensaje de error del cuerpo de la respuesta
    const errorData = await response.json().catch(() => ({})); // Si falla el json(), devuelve objeto vacío
    const errorMessage = errorData.message || 
                         errorData.error || 
                         `Error HTTP: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
      } 
      await fetchPlantillas();
      setShowCreateModal(false);
      setSuccess('Plantilla creada correctamente');
    } catch (err) {
      setError(`Error al crear el test ${err}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlantilla = async (plantillaData: any) => {
    if (!plantillaToEdit) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/plantilla?id=${plantillaToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...plantillaData,
          id_psicologo: idPsicologo
        })
      });
      
      if (!response.ok) throw new Error('Error al actualizar');
      await fetchPlantillas();
      setShowEditModal(false);
      setPlantillaToEdit(null);
      setSuccess('Plantilla actualizada correctamente');
    } catch (err) {
      setError('Error al actualizar la plantilla');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTests = async () => {
    if (selectedPlantillas.length === 0) {
      setError('Selecciona al menos una plantilla para asignar');
      return;
    }

    if (!user?.id) {
      setError('No se ha especificado un paciente');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Asignar cada plantilla seleccionada
      for (const plantillaId of selectedPlantillas) {
        const response = await fetch('/api/paciente', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_plantilla: plantillaId,
            id_paciente: user.id,
            id_psicologo: idPsicologo
          })
        });

        if (!response.ok) {
          throw new Error(`Error asignando test ${plantillaId}`);
        }
      }

      setSuccess(`Se asignaron ${selectedPlantillas.length} test(s) al paciente`);
      setSelectedPlantillas([]);
      onClose(); // Cerrar el modal después de asignar
    } catch (err) {
      setError(`Error al asignar los tests al paciente`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center z-50 w-full h-full">
        <div className="bg-white rounded-lg p-6 w-full max-w-[600px] max-h-[90vh] flex flex-col">
          <div className="flex items-end w-full justify-end mb-4">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex  justify-between items-center mb-4">
            <div className="flex flex-col w-full">
              <h2 className="text-xl font-medium ml-4">Test</h2>
              <hr className="w-full max-h-[600px] h-[1px] bg-black" />
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="flex justify-between mb-4">
            <div className="flex w-full justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
              >
                Crear Nuevo Test +
              </button>
              
            </div>
          </div>

<div className="border rounded-lg overflow-hidden flex-grow flex flex-col" style={{ maxHeight: '500px' }}> {/* Ajusta la altura máxima según necesites */}
  {loading && plantillas.length === 0 ? (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : plantillas.length === 0 ? (
    <div className="flex items-center justify-center h-12 text-gray-500 ">
      No hay plantillas registradas
    </div>
  ) : (
    <ul className="divide-y divide-gray-200 overflow-y-auto flex-1">
      {plantillas.map((plantilla) => (
        <li key={plantilla.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between min-w-0"> {/* min-w-0 ayuda con el truncado */}
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="min-w-0 overflow-hidden"> {/* Contenedor para el texto truncado */}
                <div className="font-medium text-gray-900 truncate" title={plantilla.nombre}>
                  {plantilla.nombre}
                </div>
                <div className="text-sm text-gray-500">
                  {plantilla.preguntas?.length || 0} preguntas
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 ml-4"> {/* flex-shrink-0 evita que se comprima */}
              {/* Checkbox */}
              <div className="rounded flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  checked={selectedPlantillas.includes(plantilla.id)}
                  onChange={() => handleSelectPlantilla(plantilla.id)}
                  className="h-[15px] w-[15px] text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  title='Asignar test usuario'
                />
              </div>
              
              {/* Botón Editar */}
              <button
                onClick={() => {
                  setPlantillaToEdit(plantilla);
                  setShowEditModal(true);
                }}
                className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                disabled={loading}
                title='Editar test'
              >
                <Image 
                  src={IconLogoEditar} 
                  alt="Icono de editar" 
                  width={20} 
                  height={20} 
                  className="w-5 h-5"
                />
              </button>
              
              {/* Botón Eliminar */}
              <button
                onClick={() => handleDeletePlantilla(plantilla.id)}
                className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                title='Eliminar test'
                disabled={loading}
              >
                <Image 
                  src={IconLogoEliminar} 
                  alt="Icono de eliminar" 
                  width={20} 
                  height={20} 
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
<div className='flex flex-col m-2 h-[80px]'>
  <div className="text-sm text-gray-600">
    {selectedPlantillas.length > 0 && (
      <span>
        {selectedPlantillas.length} {selectedPlantillas.length === 1 ? 'seleccionado' : 'seleccionados'}
      </span>
    )}
  </div>
  <button
    onClick={handleAssignTests}
    className={`flex items-center justify-center px-4 py-2 rounded w-[250px] m-4 transition-colors ${
      selectedPlantillas.length > 0
        ? "bg-green-500 text-white hover:bg-green-600"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
    disabled={selectedPlantillas.length === 0 || loading}
  >
    {loading ? (
      'Asignando...'
    ) : selectedPlantillas.length > 0 ? (
      `Asignar ${selectedPlantillas.length} test${selectedPlantillas.length !== 1 ? 's' : ''} al paciente`
    ) : (
      "Selecciona al menos un test"
    )}
  </button>
</div>
        </div>
      </div>

      {/* Modal para crear nueva plantilla */}
      {showCreateModal && (
        <ModalRegistraTestPlantilla
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePlantilla}
        />
      )}

      {/* Modal para editar plantilla */}
      {showEditModal && plantillaToEdit && (
        <ModalRegistraTestPlantilla
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setPlantillaToEdit(null);
          }}
          onSubmit={handleUpdatePlantilla}
          onDelete={() => handleDeletePlantilla(plantillaToEdit.id)}
          plantillaToEdit={plantillaToEdit}
        />
      )}
    </>
  );
};

export default ModalGestionTestPacientes;