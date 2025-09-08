import { useState, useEffect, useCallback } from 'react';
import { UsuarioInfo } from '@/app/types/user';
import BarChartComponent from '../barChartComponent/barChartComponent';
import { PDFGenerator } from '../PDFGenerator/PDFGenerator';
import { ExcelGenerator } from '../ExcelGenerator/ExcelGenerator';
import { format, subDays } from 'date-fns';
import { debounce } from 'lodash';

interface RegistroProps {
  usuario: UsuarioInfo;
}

interface PacienteAsignado {
  id: number;
  nombre: string;
  cedula?: string;
  email?: string;
}

interface RegistroUsuario {
  id: number;
  usuario_id: number;
  sexo: string;
  fecha_nacimiento: string;
  tipo_usuario: string;
  psicologo_id: number | null;
  fecha_registro: string;
  tests_ids: number[];
  total_tests: number;
  trazabilidades: {
    id: number;
    registro_usuario_id: number;
    psicologo_id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    secuencia: number;
  }[];
  metricas: any[];
  sesiones: {
    id: number;
    registro_usuario_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    duracion: number;
    ip_address: string;
    user_agent: string;
  }[];
}

interface ApiResponse {
  data: RegistroUsuario[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const RegistroAdmin: React.FC<RegistroProps> = ({ usuario }) => {
  const [pacientesAsignados, setPacientesAsignados] = useState<PacienteAsignado[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<number | null>(null);
  const [registrosPaciente, setRegistrosPaciente] = useState<RegistroUsuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usarIntervalo, setUsarIntervalo] = useState(false);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [fechaInicio, setFechaInicio] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [chartDataTests, setChartDataTests] = useState<any[]>([]);
  const [chartDataSesiones, setChartDataSesiones] = useState<any[]>([]);
  
  // Nuevos estados para el buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteAsignado[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Función para buscar pacientes con debounce
  const buscarPacientes = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await fetch(`/api/usuario?searchNombreCedula=${encodeURIComponent(term)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const data = await response.json();
        setSearchResults(data.map((user: any) => ({
          id: user.id,
          nombre: user.nombre,
          cedula: user.cedula,
          email: user.email
        })));
      } catch (error) {
        console.error('Error buscando pacientes:', error);
        setError('Error al realizar la búsqueda');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      buscarPacientes(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, buscarPacientes]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await cargarPacientesAsignados(usuario.id);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Error al cargar datos iniciales');
      }
    };

    loadInitialData();
  }, [usuario.id]);

  useEffect(() => {
    if (pacienteSeleccionado) {
      cargarRegistrosPaciente(pacienteSeleccionado);
    }
  }, [pacienteSeleccionado, fechaInicio, fechaFin, usarIntervalo]);

  useEffect(() => {
    if (registrosPaciente.length > 0) {
      prepararDatosGraficos();
    }
  }, [registrosPaciente]);

  const cargarPacientesAsignados = async (idPsicologo: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/usuario?id_psicologo=${idPsicologo}`);
      if (!response.ok) throw new Error('Error al cargar pacientes');
      const data = await response.json();
      setPacientesAsignados(data);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      setError('Error al cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  const cargarRegistrosPaciente = async (idPaciente: number) => {
    setLoading(true);
    try {
      let url = `/api/registro-usuario?usuarioId=${idPaciente}`;
      
      if (usarIntervalo) {
        url += `&fechaDesde=${fechaInicio}&fechaHasta=${fechaFin}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar registros');
      const data: ApiResponse = await response.json();
      setRegistrosPaciente(data.data);
      setResponseData(data);
    } catch (error) {
      console.error('Error cargando registros:', error);
      setError('Error al cargar los registros del paciente');
    } finally {
      setLoading(false);
    }
  };

  const prepararDatosGraficos = () => {
    const datosTests = registrosPaciente.map(registro => {
      const fecha = new Date(registro.fecha_registro);
      return {
        name: format(fecha, 'dd/MM/yyyy'),
        value: registro.total_tests || 0,
      };
    });
    
    const datosSesiones = registrosPaciente.map(registro => {
      const fecha = new Date(registro.fecha_registro);
      return {
        name: format(fecha, 'dd/MM/yyyy'),
        value: registro.sesiones.length || 0,
      };
    });
    
    setChartDataTests(datosTests);
    setChartDataSesiones(datosSesiones);
  };

  const handleBuscarClick = () => {
    if (pacienteSeleccionado) {
      cargarRegistrosPaciente(pacienteSeleccionado);
    }
  };

  const handleUltimos30DiasClick = () => {
    setUsarIntervalo(true);
    const nuevaFechaInicio = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const nuevaFechaFin = format(new Date(), 'yyyy-MM-dd');
    setFechaInicio(nuevaFechaInicio);
    setFechaFin(nuevaFechaFin);
  };

  const handleUltimos7DiasClick = () => {
    setUsarIntervalo(true);
    const nuevaFechaInicio = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const nuevaFechaFin = format(new Date(), 'yyyy-MM-dd');
    setFechaInicio(nuevaFechaInicio);
    setFechaFin(nuevaFechaFin);
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const handlePacienteSelect = (paciente: PacienteAsignado) => {
    setPacienteSeleccionado(paciente.id);
    setSearchTerm(`${paciente.nombre} - ${paciente.cedula}`);
    setShowSearchResults(false);
  };

  return (
    <div className="p-4 w-full max-w-[1200px]">
      <h1 className="text-2xl font-bold mb-4">Registro de Pacientes</h1>
      <p className="mb-6">Bienvenido, {usuario.nombre}</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6 relative">
        <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Paciente
        </label>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            id="paciente"
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            disabled={loading}
          />
          
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        
        {/* Resultados de búsqueda */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-auto">
            {searchResults.map((paciente) => (
              <div
                key={paciente.id}
                className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                onClick={() => handlePacienteSelect(paciente)}
              >
                <div className="font-medium">{paciente.nombre}</div>
                <div className="text-sm text-gray-500">Cédula: {paciente.cedula}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mostrar pacientes asignados si no hay término de búsqueda */}
        {!searchTerm && pacientesAsignados.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Pacientes asignados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pacientesAsignados.map((paciente) => (
                <div
                  key={paciente.id}
                  className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${pacienteSeleccionado === paciente.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setPacienteSeleccionado(paciente.id)}
                >
                  <div className="font-medium">{paciente.nombre}</div>
                  <div className="text-sm text-gray-500">Cédula: {paciente.cedula}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {
        !pacienteSeleccionado && (
          <div className='w-full h-[60vh] m-5'></div>
        )
      }

      {pacienteSeleccionado && (
        <>
          {/* Resto del componente permanece igual */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="usarIntervalo"
              checked={usarIntervalo}
              onChange={(e) => setUsarIntervalo(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="usarIntervalo" className="text-sm font-medium text-gray-700">
              Filtrar por intervalo de fechas
            </label>
          </div>
          
          {usarIntervalo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleBuscarClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Cargando...' : 'Buscar'}
                </button>
                
                <button
                  onClick={handleUltimos30DiasClick}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  disabled={loading}
                >
                  30 días
                </button>
                
                <button
                  onClick={handleUltimos7DiasClick}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  disabled={loading}
                >
                  7 días
                </button>
              </div>
            </div>
          )}
          
          {!usarIntervalo && (
            <div className="mb-6">
              <button
                onClick={handleBuscarClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Mostrar todos los registros'}
              </button>
            </div>
          )}
          
          {responseData && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Información del Paciente</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total de registros</p>
                  <p className="text-lg font-medium">{responseData.total}</p>
                </div>
                {registrosPaciente[0] && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Sexo</p>
                      <p className="text-lg font-medium">{registrosPaciente[0].sexo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Edad</p>
                      <p className="text-lg font-medium">
                        {registrosPaciente[0].fecha_nacimiento ? 
                          calcularEdad(registrosPaciente[0].fecha_nacimiento) + ' años' : 
                          'No disponible'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total de tests</p>
                      <p className="text-lg font-medium">{registrosPaciente[0].total_tests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sesiones realizadas</p>
                      <p className="text-lg font-medium">{registrosPaciente[0].sesiones.length}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Gráfico de Tests Completados */}
          {chartDataTests.length > 0 && (
            <div className="mb-8 bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Tests Completados</h2>
              <div className="h-[400px]">
                <BarChartComponent 
                  data={chartDataTests.map(item => ({
                    name: item.name,
                    value: item.value
                  }))}
                  barColors={['#4f46e5', '#4f46e5']}
                  height={400}
                  name='Tests Completados'
                />
              </div>
            </div>
          )}
          
          {/* Gráfico de Sesiones */}
          {chartDataSesiones.length > 0 && (
            <div className="mb-8 bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Sesiones Realizadas</h2>
              <div className="h-[400px]">
                <BarChartComponent 
                  data={chartDataSesiones.map(item => ({
                    name: item.name,
                    value: item.value
                  }))}
                  barColors={['#10b981','#10b981']}
                  height={400}
                  name='Sesiones activas en la plataforma'
                />
              </div>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Registros Detallados</h2>
            {registrosPaciente.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Fecha Registro</th>
                      <th className="py-2 px-4 border-b">Tests Completados</th>
                      <th className="py-2 px-4 border-b">Sesiones</th>
                      <th className="py-2 px-4 border-b">IP</th>
                      <th className="py-2 px-4 border-b">Navegador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosPaciente.map((registro) => (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-center">
                          {format(new Date(registro.fecha_registro), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {registro.total_tests || 0}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {registro.sesiones.length || 0}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {registro.sesiones[0]?.ip_address || 'N/A'}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {registro.sesiones[0]?.user_agent ? 
                            registro.sesiones[0].user_agent.split(' ')[0] : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {responseData && (
                  <div className='mt-4'>
                    <div className="container mx-auto py-2">
                      <PDFGenerator userData={responseData} />
                    </div>
                    <div className="container mx-auto py-2">
                      <ExcelGenerator userData={responseData} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No hay registros para el período seleccionado</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RegistroAdmin;