import { useState, useEffect, useRef } from 'react';

import { UsuarioInfo } from '@/app/types/user';

interface RegistroProps {
  usuario: UsuarioInfo;
}

interface PacienteAsignado {
  id: number;
  nombre: string;
  cedula?: string;
  email?: string;
}

const RegistroPsicologo: React.FC<RegistroProps> = ({usuario})  => {
   console.log(usuario);
  const [pacientesAsignados, setPacientesAsignados] = useState<PacienteAsignado[]>([]);
  // Estados para pacientes asignados
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await cargarPacientesAsignados(usuario.id);

      } catch (error) {
        console.error('Error loading initial data:', error);
      } 
    };

    loadInitialData();
  }, []);

  const cargarPacientesAsignados = async (idPsicologo: number) => {
    try {
      const response = await fetch(`/api/usuario?id_psicologo=${idPsicologo}`);
      if (!response.ok) throw new Error('Error al cargar pacientes');
      const data = await response.json();
      setPacientesAsignados(data);
      console.log(data)
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } 
  };

  return (
    <div>
      <p>Bienvenido, {usuario.nombre}</p>
      <ul>
        {
            (pacientesAsignados ? (          
            pacientesAsignados.map((paciente) => (
              <li key={paciente.id}> { paciente.nombre}- { paciente.cedula}</li>
            ))
            ):(<></>))
        }
      </ul>

    </div>
  );
}

export default RegistroPsicologo;