import React, { useState } from 'react';
import { TestStatus, PreguntaPlantillaBase, TestPlantilla } from "@/app/types/plantilla";
import { Usuario } from "../../app/types/plantilla";
import ModalRegistraTestPlantilla from "./../modalRegistrarTestPlantilla/modalRegistrarTestPlantilla";
import { ModalVerPreguntasPlantilla } from "./../modalVerPreguntasPlantilla/modalVerPreguntasPlantilla";
import IconEditar from "./../../app/public/logos/icon_editar.svg";
import IconLupa from "./../../app/public/logos/lupa.svg";
import IconCardPacientes from "./../../app/public/logos/logo_card_pacientes.svg";
import Image from "next/image";

interface Psicologo {
  id_usuario: number;
  usuario: Usuario;
}

interface CeldaTestPlantillaProps {
  plantilla: TestPlantilla;
  onPlantillaUpdated: (updatedPlantilla: TestPlantilla) => void;
  onPlantillaDeleted: (plantillaId: number) => void;
}

const CeldaTestPlantilla: React.FC<CeldaTestPlantillaProps> = ({ 
  plantilla, 
  onPlantillaUpdated, 
  onPlantillaDeleted
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

const handleEditPlantilla = async (plantillaData: any) => {
  try {
    setIsLoading(true);
    
    // Preparar el cuerpo de la petición con todos los campos necesarios
    const requestBody = {
      id: plantilla.id,
      nombre: plantillaData.nombre,
      estado: plantilla.estado, // Mantener el estado original
      peso_preguntas: plantillaData.peso_preguntas,
      config_baremo: plantillaData.config_baremo || null,
      valor_total: plantillaData.valor_total || null,
      preguntas: plantillaData.preguntas?.map((p: any) => ({
        id: p.id || undefined, // Incluir ID si existe (para actualización)
        texto_pregunta: p.texto_pregunta,
        id_tipo: p.id_tipo,
        orden: p.orden,
        obligatoria: p.obligatoria,
        placeholder: p.placeholder ?? null,
        min: p.min ?? null,
        max: p.max ?? null,
        paso: p.paso ?? null,
        peso: p.peso ?? null, // Incluir peso
        baremo_detalle: p.baremo_detalle || null, // Incluir baremo
        opciones: p.opciones?.map((o: any) => ({
          id: o.id || undefined, // Incluir ID si existe
          texto: o.texto,
          valor: o.valor,
          orden: o.orden,
          es_otro: o.es_otro ?? false
        })) ?? []
      }))
    };

    const response = await fetch(`/api/plantilla?id=${plantilla.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar la plantilla');
    }
    
    const data = await response.json();
    onPlantillaUpdated(data);
    setIsEditModalOpen(false);
  } catch (error) {
    console.error("Error updating plantilla:", error);
    alert(error instanceof Error ? error.message : "Error al actualizar la plantilla");
  } finally {
    setIsLoading(false);
  }
};

  const handleDeletePlantilla = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plantilla?id=${plantilla.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar la plantilla');
      
      onPlantillaDeleted(plantilla.id);
    } catch (error) {
      console.error("Error deleting plantilla:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar la plantilla");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusMap = {
      [TestStatus.NoIniciado]: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'no iniciado' },
      [TestStatus.EnProgreso]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'en progreso' },
      [TestStatus.Completado]: { bg: 'bg-green-100', text: 'text-green-800', label: 'completado' }
    };

    const currentStatus = statusMap[plantilla.estado];
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
        {currentStatus.label}
      </span>
    );
  };

  const getPsicologoInfo = () => {
    if (plantilla.psicologo?.usuario) {
      return `Creado por: ${plantilla.psicologo.usuario.nombre}`;
    }
    return null;
  };

  return (
    <>
      {/* Overlay y Loader */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-55 h-full w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      <div className="rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow bg-white">
        <div className="relative">
          <Image
            className="absolute w-[200px] h-[150px] right-0 button-[5px] top-[-20px]"
            src={IconCardPacientes}
            width={180}
            height={90}
            alt="Logo"
          />
        </div>
        <div className="flex justify-between flex-col items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg truncate">{plantilla.nombre}</h3>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getStatusBadge()}
              <span className="text-sm text-gray-600">
                Preguntas: {plantilla.preguntas?.length || 0}
              </span>
            </div>
            
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-600">
                Creado: {plantilla.fecha_creacion ? new Date(plantilla.fecha_creacion).toLocaleDateString() : "Fecha desconocida"}
              </p>
              {getPsicologoInfo() && (
                <p className="text-sm text-gray-600 truncate">
                  {getPsicologoInfo()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex m-auto justify-around gap-2 flex-shrink-0 flex-col sm:flex-row sm:justify-between sm:w-full sm:gap-0">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full max-w-[180px] cursor-pointer p-2 px-10 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-1"
              aria-label="Editar test"
              disabled={isLoading}
            >
              Editar <Image src={IconEditar} alt="Icono de editar" width={20} height={20} />
            </button>
            <button 
              onClick={() => setIsViewModalOpen(true)}
              className="w-full max-w-[180px]  cursor-pointer p-2 px-10 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-1"
              aria-label="Ver detalles del test"
              disabled={isLoading}
            >
              Ver más <Image src={IconLupa} alt="Icono de ver más" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <ModalRegistraTestPlantilla
          isAdmin={false}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditPlantilla}
          onDelete={handleDeletePlantilla}
          plantillaToEdit={plantilla}
        />
      )}

      {isViewModalOpen && (
        <ModalVerPreguntasPlantilla
          plantilla={plantilla}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onDelete={handleDeletePlantilla}
        />
      )}
    </>
  );
};

export default CeldaTestPlantilla;