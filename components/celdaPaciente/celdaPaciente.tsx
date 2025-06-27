import React, { useState } from 'react';
import Image from 'next/image';
import ModalPaciente from './../modalPacientes/modalPacientes';
import ModalGestionTestPacientes from './../modalGestionTestPacientes/modalGestionTestPacientes';
import { UsuarioCompleto } from './../../app/types/gestionPaciente/index';
import IconPacienteAddTest from "./../../app/public/logos/logo_asignar_test.svg";
import IconCardPacientes from "./../../app/public/logos/logo_card_pacientes.svg";
import IconAssignUser from "./../../app/public/logos/logo_asignar_test.svg";

interface PacienteCellProps {
  paciente: UsuarioCompleto;
  psicologoId: number;
  onRefresh: () => void;
  esAsignacion?: boolean;
}

const PacienteCell: React.FC<PacienteCellProps> = ({ 
  paciente, 
  psicologoId, 
  onRefresh,
  esAsignacion = false 
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Safe age calculation
  const calcularEdad = (fechaNacimiento: string | Date | null): string => {
    if (!fechaNacimiento) return 'No disponible';
    
    try {
      const fechaNac = new Date(fechaNacimiento);
      // Handle invalid dates
      if (isNaN(fechaNac.getTime())) return 'No disponible';
      
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }
      
      return `${edad} años`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'No disponible';
    }
  };

  // Safe test extraction
  const getUltimoTest = () => {
    try {
      if (!paciente?.tests || !Array.isArray(paciente.tests) || paciente.tests.length === 0) {
        return null;
      }

      return paciente.tests.reduce((latest, current) => {
        try {
          const latestDate = latest?.fecha_creacion ? new Date(latest.fecha_creacion) : new Date(0);
          const currentDate = current?.fecha_creacion ? new Date(current.fecha_creacion) : new Date(0);
          return currentDate > latestDate ? current : latest;
        } catch (e) {
          return latest;
        }
      });
    } catch (error) {
      console.error('Error processing tests:', error);
      return null;
    }
  };

  const ultimoTest = getUltimoTest();

  const handleAssignPatient = async () => {
    if (!paciente?.id) {
      console.error('No patient ID available');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/paciente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_paciente: paciente.id,
          id_psicologo: psicologoId
        })
      });

      if (!response.ok) {
        throw new Error('Error al asignar paciente');
      }

      onRefresh();
    } catch (error) {
      console.error('Error asignando paciente:', error);
      alert('Error al asignar paciente');
    } finally {
      setIsAssigning(false);
    }
  };

  // Safely get patient name
  const getPatientName = () => {
    if (typeof paciente?.nombre === 'string') return paciente.nombre;
    if (paciente?.nombre && typeof paciente.nombre === 'object') {
      return JSON.stringify(paciente.nombre); // Fallback for unexpected object
    }
    return 'Nombre no disponible';
  };

  // Safely get test status display
  const getTestStatusDisplay = (test: any) => {
    if (!test) return null;
    
    const status = test?.estado || 'unknown';
    const testName = test?.nombre || 'Test';
    
    return (
      <p className="text-sm text-black mt-1">
        Último test: <span className="font-medium">{testName}</span> - 
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
          status === 'completado' ? 'bg-green-100 text-green-800' :
          status === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status === 'completado' ? 'Completado' : 
           status === 'en_progreso' ? 'En progreso' : 'No iniciado'}
        </span>
      </p>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col justify-between items-start relative gap-1">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {getPatientName()}
          </h3>
          <p className="text-sm text-gray-600">
            {paciente?.cedula ? `Cédula: ${paciente.cedula}` : 'Sin cédula registrada'}
          </p>
          <p className="text-sm text-black mt-1">
            Edad: {calcularEdad(paciente?.fecha_nacimiento)}
          </p>
          {!esAsignacion && getTestStatusDisplay(ultimoTest)}
        </div>
        
        <div className="relative w-full">
          <Image
            className="absolute w-[100px] h-[60px] right-0 button-[5px] top-[-60px]"
            src={IconCardPacientes}
            width={180}
            height={90}
            alt="Logo"
          />
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row justify-between w-full p-1 mt-3">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="m-auto w-full max-w-[200px] sm:m-0 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
          >
            Ver detalles
          </button>
          
          {esAsignacion ? (
            <button
              onClick={handleAssignPatient}
              disabled={isAssigning}
              className={`m-auto sm:m-0 w-full max-w-[200px] cursor-pointer p-2 px-4 text-sm rounded-md transition flex justify-center gap-1 items-center ${
                isAssigning 
                  ? 'bg-gray-300 text-gray-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isAssigning ? 'Asignando...' : 'Asignar paciente'}
              {!isAssigning && <Image src={IconAssignUser} alt="Asignar" width={16} height={16} />}
            </button>
          ) : (
            <button
              onClick={() => setShowTestsModal(true)}
              className="m-auto sm:m-0 w-full max-w-[200px] cursor-pointer p-2 px-4 text-black-700 border border-black text-sm rounded-md transition flex justify-center gap-1 items-center hover:bg-gray-100"
            >
              Gestionar tests <Image src={IconPacienteAddTest} alt="Icono de ver más" width={16} height={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modals with additional checks */}
      {showDetailsModal && paciente && (
        <ModalPaciente
          paciente={paciente}
          psicologoId={psicologoId}
          onClose={() => setShowDetailsModal(false)}
          onRefresh={onRefresh}
          esAsignacion={esAsignacion}
        />
      )}

      {showTestsModal && !esAsignacion && paciente && (
        <ModalGestionTestPacientes
          isOpen={showTestsModal}
          user={paciente}
          onClose={() => setShowTestsModal(false)}
          idPsicologo={psicologoId}
        />
      )}
    </div>
  );
};

export default PacienteCell;