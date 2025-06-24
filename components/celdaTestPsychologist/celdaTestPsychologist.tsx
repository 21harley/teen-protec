import React, { useState } from 'react';
import { TestStatus, PreguntaData, PreguntaResponse, TestResponse } from "@/app/types/test";
import { UsuarioResponse } from "../../app/types/test";
import ModalRegistraTest from "./../modalRegistrarTest/modalRegistraTest";
import { ModalVerPreguntas } from "./../modalVerPreguntas/ModalVerPreguntas";
import IconEditar from "./../../app/public/logos/icon_editar.svg";
import IconLupa from "./../../app/public/logos/lupa.svg";
import IconCardPacientes from "./../../app/public/logos/logo_card_pacientes.svg";
import Image from "next/image";

interface Psicologo {
  id: number;
  id_usuario: number;
  especialidad?: string;
  usuario: UsuarioResponse;
  redes_sociales?: any[];
}

interface TestResponseCompleto extends TestResponse {
  usuario: UsuarioResponse | null;
  psicologo: Psicologo | null;
  preguntas: PreguntaResponse[];
  respuestas: any[];
}

interface CeldaTestPsychologistTestProps {
  test: TestResponseCompleto;
  onTestUpdated: (updatedTest: TestResponseCompleto) => void;
  onTestDeleted: (testId: number) => void;
  isPsychologist?: boolean;
}

const CeldaTestPsychologistTest: React.FC<CeldaTestPsychologistTestProps> = ({ 
  test, 
  onTestUpdated, 
  onTestDeleted,
  isPsychologist = false 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditTest = async (testData: { name: string; questions: PreguntaData[] }) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/test?id=${test.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_psicologo: test.psicologo?.id_usuario,
          nombre: testData.name,
          preguntas: testData.questions.map(q => ({
            texto_pregunta: q.texto_pregunta,
            id_tipo: q.id_tipo,
            orden: q.orden,
            obligatoria: q.obligatoria,
            placeholder: q.placeholder ?? null,
            min: q.min ?? null,
            max: q.max ?? null,
            paso: q.paso ?? null,
            opciones: q.opciones?.map(o => ({
              texto: o.texto,
              valor: o.valor,
              orden: o.orden,
              es_otro: o.es_otro ?? false
            })) ?? []
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el test');
      }
      
      const updatedTest = await response.json();
      onTestUpdated(updatedTest);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating test:", error);
      alert(error instanceof Error ? error.message : "Error al actualizar el test");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/test?id=${test.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar el test');
      
      onTestDeleted(test.id);
    } catch (error) {
      console.error("Error deleting test:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el test");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusMap = {
      [TestStatus.no_iniciado]: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'no iniciado' },
      [TestStatus.en_progreso]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'en progreso' },
      [TestStatus.completado]: { bg: 'bg-green-100', text: 'text-green-800', label: 'completado' }
    };

    const estadoKey = (test.estado !== undefined ? test.estado : TestStatus.no_iniciado) as TestStatus;
    const currentStatus = statusMap[estadoKey];
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
        {currentStatus.label}
      </span>
    );
  };

  const getUsuarioInfo = () => {
    if (isPsychologist && test.usuario) {
      return `Paciente: ${test.usuario.nombre}`;
    }
    if (!isPsychologist && test.psicologo?.usuario) {
      return `Psicólogo: ${test.psicologo.usuario.nombre}`;
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

      <div className=" rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
        <div className="relative">
          <Image
            className="absolute w-[200px] h-[200px] right-0 button-[5px] top-[-30px]"
            src={IconCardPacientes}
            width={180}
            height={90}
            alt="Logo"
          />
        </div>
        <div className="flex justify-between flex-col items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg truncate">{test.nombre}</h3>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getStatusBadge()}
              <span className="text-sm text-gray-600">
                Progreso: {test.progreso}%
              </span>
            </div>
            
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-600">
                Creado: {test.fecha_creacion ? new Date(test.fecha_creacion).toLocaleDateString() : "Fecha desconocida"}
              </p>
              {getUsuarioInfo() && (
                <p className="text-sm text-gray-600 truncate">
                  {getUsuarioInfo()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-around w-full flex-shrink-0 flex-col  sm:flex-row   ">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full max-w-[180px] m-auto cursor-pointer p-2 px-10   text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-1"
              aria-label="Editar test"
              disabled={isLoading}
            >
              Editar <Image src={IconEditar} alt="Icono de crear alerta" width={20} height={20} />
            </button>
            <button 
              onClick={() => setIsViewModalOpen(true)}
              className="w-full max-w-[180px] m-auto cursor-pointer p-2 px-10   text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-1"
              aria-label="Ver detalles del test"
              disabled={isLoading}
            >
              Ver mas  <Image src={IconLupa} alt="Icono de crear alerta" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <ModalRegistraTest
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditTest}
          onDelete={handleDeleteTest}
          testToEdit={{
            id: test.id,
            name: test.nombre ?? "",
            questions: test.preguntas.map(p => ({
              ...p,
              placeholder: p.placeholder ?? undefined,
              min: p.min ?? undefined,
              max: p.max ?? undefined,
              paso: p.paso ?? undefined
            })),
            status: test.estado === TestStatus.no_iniciado ? 'draft' : 
                   test.estado === TestStatus.en_progreso ? 'published' : 'archived'
          }}
        />
      )}

      {isViewModalOpen && (
        <ModalVerPreguntas
          preguntas={test.preguntas}
          testId={test.id}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}
    </>
  );
};

export default CeldaTestPsychologistTest;