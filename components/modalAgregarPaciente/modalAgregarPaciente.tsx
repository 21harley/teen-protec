import { useState, useEffect } from 'react';
import useUserStore from '../../app/store/store';
import Image from 'next/image';
import IconClose from './../../app/public/logos/close_menu.svg';

interface Paciente {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  esAdolescente: boolean;
  fecha_nacimiento?: string;
}

interface ModalAgregarPacienteProps {
  visible: boolean;
  onClose: () => void;
  idPsicologo: number;
  onPacientesAgregados: () => void;
  mostrarSinAsignar?: boolean;
}

const ModalAgregarPaciente = ({ 
  visible, 
  onClose, 
  onPacientesAgregados,
  mostrarSinAsignar = false 
}: ModalAgregarPacienteProps) => {
  const { user } = useUserStore();
  const idPsicologo = user?.id;
  
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacientes, setSelectedPacientes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (visible && idPsicologo) {
      fetchPacientesSinPsicologo() 
    }
  }, [visible, idPsicologo, mostrarSinAsignar]);

  const fetchAllPacientes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuario?tipo=paciente');
      if (!response.ok) throw new Error('Error al obtener pacientes');
      
      const data = await response.json();
      setPacientes(data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        cedula: u.cedula,
        esAdolescente: !!u.adolecente,
        fecha_nacimiento: u.fecha_nacimiento
      })));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientesSinPsicologo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/paciente?disponibles=true');
      if (!response.ok) throw new Error('Error al obtener pacientes sin asignar');
      
      const data = await response.json();
      setPacientes(data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        cedula: u.cedula,
        esAdolescente: !!u.adolecente,
        fecha_nacimiento: u.fecha_nacimiento
      })));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pacientes sin asignar');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (idPaciente: number) => {
    setSelectedPacientes(prev => 
      prev.includes(idPaciente)
        ? prev.filter(id => id !== idPaciente)
        : [...prev, idPaciente]
    );
  };

  const handleAsignarPacientes = async () => {
    if (selectedPacientes.length === 0) {
      alert('Seleccione al menos un paciente');
      return;
    }

    if (!idPsicologo) {
      alert('No se pudo identificar al psicólogo');
      return;
    }

    setAsignando(true);
    try {
      const promises = selectedPacientes.map(idPaciente => 
        fetch('/api/paciente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_paciente: idPaciente,
            id_psicologo: idPsicologo
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every(r => r.ok);

      if (!allSuccessful) {
        throw new Error('Error al asignar algunos pacientes');
      }

      alert('Pacientes asignados correctamente');
      onPacientesAgregados();
      onClose();
      setSelectedPacientes([]);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar pacientes');
    } finally {
      setAsignando(false);
    }
  };

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.cedula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularEdad = (fechaNacimiento?: string) => {
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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 _color_four bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col p-4">
        <div className="flex justify-between items-center ">
            <h2 className="text-xl font-medium">
            {mostrarSinAsignar ? 'Asignar Pacientes Existentes' : 'Agregar Nuevos Pacientes'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
        </div>
<hr className="w-full max-h-[600px] h-[0.1px] bg-black mb-4"  />
       {
        filteredPacientes.length > 0 ? (
        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        ) : 
        (<></>)
       }


        <div className="flex-1 overflow-y-auto p-4 border border-black rounded-2xl">
          {loading ? (
            <div className="text-center py-8">Cargando pacientes...</div>
          ) : filteredPacientes.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm 
                ? 'No se encontraron pacientes con ese criterio'
                : 'No hay pacientes disponibles'}
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredPacientes.map(paciente => (
                <div 
                  key={paciente.id} 
                  className="flex items-center p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPacientes.includes(paciente.id)}
                    onChange={() => handleCheckboxChange(paciente.id)}
                    className="mr-3 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{paciente.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {paciente.cedula} • {paciente.email}
                      {paciente.fecha_nacimiento && (
                        <span> • {calcularEdad(paciente.fecha_nacimiento)} años</span>
                      )}
                    </div>
                  </div>
                  {paciente.esAdolescente && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      Adolescente
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 ">
          <div className="text-sm text-gray-600">
            {selectedPacientes.length} {selectedPacientes.length === 1 ? 'paciente seleccionado' : 'pacientes seleccionados'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleAsignarPacientes}
              disabled={asignando || selectedPacientes.length === 0}
              className={`px-4 py-2 rounded text-white transition-colors cursor-pointer ${
                selectedPacientes.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${asignando ? 'opacity-75' : ''}`}
            >
              {asignando 
                ? 'Asignando...' 
                : mostrarSinAsignar 
                  ? 'Asignar Pacientes' 
                  : 'Registrar Pacientes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregarPaciente;