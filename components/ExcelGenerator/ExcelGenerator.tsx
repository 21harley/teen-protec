'use client'
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { utils, writeFile } from 'xlsx';

interface ExcelGeneratorProps {
  userData: any;
}

interface ExcelData {
  userInfo: any;
  psychologistInfo: any;
  traces: any[];
  sessions: any[];
  psychologistsInfo: any[];
}

export const ExcelGenerator = ({ userData }: ExcelGeneratorProps) => {
  const [options, setOptions] = useState({
    includeTraces: false,
    includeSessions: false,
  });
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState<ExcelData>({
    userInfo: null,
    psychologistInfo: null,
    traces: [],
    sessions: [],
    psychologistsInfo: []
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.data?.[0]?.usuario_id) {
        setError('No se encontró información del usuario');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos del usuario principal
        const userRes = await fetch(`/api/usuario?id=${userData.data[0].usuario_id}`);
        if (!userRes.ok) throw new Error('Error al obtener datos del usuario');
        const userDataRes = await userRes.json();

        // Obtener datos del psicólogo si existe
        let psychologistData = null;
        if (userData.data[0].psicologo_id) {
          const psychoRes = await fetch(`/api/usuario?id=${userData.data[0].psicologo_id}`);
          if (!psychoRes.ok) throw new Error('Error al obtener datos del psicólogo');
          psychologistData = await psychoRes.json();
        }

        // Obtener información de todos los psicólogos relacionados con las trazabilidades
        let psychologistsInfo = [];
        if (userData.data[0].trazabilidades?.length > 0) {
          const psychologistIds = userData.data[0].trazabilidades
            .map((t: any) => t.psicologo_id)
            .filter((id: number, index: number, self: number[]) => self.indexOf(id) === index);
          
          if (psychologistIds.length > 0) {
            const psychologistsRes = await fetch(`/api/usuario?ids=${psychologistIds.join(',')}`);
            if (!psychologistsRes.ok) throw new Error('Error al obtener datos de psicólogos');
            
            // Leer la respuesta solo una vez
            const psychologistsData = await psychologistsRes.json();
            psychologistsInfo = Array.isArray(psychologistsData) 
              ? psychologistsData 
              : [psychologistsData];
          }
        }

        setExcelData({
          userInfo: userDataRes,
          psychologistInfo: psychologistData,
          traces: userData.data[0].trazabilidades || [],
          sessions: userData.data[0].sesiones || [],
          psychologistsInfo
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setOptions(prev => ({ ...prev, [name]: checked }));
  };

  const getPsychologistName = (psychologistId: number) => {
    const psychologist = excelData.psychologistsInfo.find(p => p.id === psychologistId);
    return psychologist ? psychologist.nombre : `Psicólogo #${psychologistId}`;
  };

  const generateExcel = () => {
    if (!excelData.userInfo) {
      setError('No hay datos de usuario para generar el Excel');
      return;
    }

    try {
      setLoading(true);
      
      // Crear un nuevo libro de trabajo
      const wb = XLSX.utils.book_new();
      const generationDate = new Date().toLocaleDateString('es-ES');
      
      // Hoja de información del usuario
      const userInfoSheetData = [
        ['Información del Usuario', ''],
        ['Nombre', excelData.userInfo.nombre],
        ['Email', excelData.userInfo.email],
        ['Cédula', excelData.userInfo.cedula],
        ['Teléfono', excelData.userInfo.telefono],
        ['Fecha de registro', new Date(userData.data[0].fecha_registro).toLocaleDateString()],
        ['Sexo', userData.data[0].sexo],
        ['Fecha de nacimiento', new Date(userData.data[0].fecha_nacimiento).toLocaleDateString()],
        ['Tipo de usuario', excelData.userInfo.tipo_usuario?.nombre || 'No especificado'],
        ['Total tests', userData.data[0].total_tests],
        ['', ''],
        ['Información del Sistema', ''],
        ['Fecha de generación', generationDate],
        ['Generado por', 'Sistema PsicoSoft']
      ];
      
      const userInfoSheet = XLSX.utils.aoa_to_sheet(userInfoSheetData);
      XLSX.utils.book_append_sheet(wb, userInfoSheet, "Información Usuario");
      
      // Hoja de información del psicólogo (si existe)
      if (excelData.psychologistInfo) {
        const psychologistSheetData = [
          ['Información del Psicólogo', ''],
          ['Nombre', excelData.psychologistInfo.nombre],
          ['Email', excelData.psychologistInfo.email],
          ['Número de título', excelData.psychologistInfo.psicologo?.numero_de_titulo || 'No especificado'],
          ['Universidad', excelData.psychologistInfo.psicologo?.nombre_universidad || 'No especificado'],
          ['Teléfono de trabajo', excelData.psychologistInfo.psicologo?.telefono_trabajo || 'No especificado'],
          ['Monto de consulta', excelData.psychologistInfo.psicologo?.monto_consulta || 'No especificado']
        ];
        
        const psychologistSheet = XLSX.utils.aoa_to_sheet(psychologistSheetData);
        XLSX.utils.book_append_sheet(wb, psychologistSheet, "Información Psicólogo");
      }
      
      // Hoja de trazabilidades (si está seleccionada)
      if (options.includeTraces && excelData.traces.length > 0) {
        const tracesSheetData = [
          ['Historial de Trazabilidades'],
          ['Psicólogo', 'Fecha Inicio', 'Fecha Fin', 'Estado']
        ];
        
        excelData.traces.forEach((trace: any) => {
          tracesSheetData.push([
            getPsychologistName(trace.psicologo_id),
            new Date(trace.fecha_inicio).toLocaleDateString(),
            trace.fecha_fin ? new Date(trace.fecha_fin).toLocaleDateString() : 'N/A',
            trace.fecha_fin ? 'Finalizada' : 'Activa'
          ]);
        });
        
        // Agregar resumen
        tracesSheetData.push(['', '', '', '']);
        tracesSheetData.push(['Total de trazabilidades:', excelData.traces.length.toString()]);
        
        const tracesSheet = XLSX.utils.aoa_to_sheet(tracesSheetData);
        XLSX.utils.book_append_sheet(wb, tracesSheet, "Trazabilidades");
      }
      
      // Hoja de sesiones (si está seleccionada)
      if (options.includeSessions && excelData.sessions.length > 0) {
        const sessionsSheetData = [
          ['Historial de Sesiones'],
          ['Fecha', 'Hora Inicio', 'Hora Fin', 'Duración (min)']
        ];
        
        excelData.sessions.forEach((session: any) => {
          sessionsSheetData.push([
            new Date(session.fecha_inicio).toLocaleDateString(),
            new Date(session.fecha_inicio).toLocaleTimeString(),
            new Date(session.fecha_fin).toLocaleTimeString(),
            session.duracion
          ]);
        });
        
        // Agregar resumen
        const totalDuration = excelData.sessions.reduce((acc: number, curr: any) => acc + curr.duracion, 0);
        const averageDuration = Math.round(totalDuration / excelData.sessions.length);
        
        sessionsSheetData.push(['', '', '', '']);
        sessionsSheetData.push(['Total de sesiones:', excelData.sessions.length.toString()]);
        sessionsSheetData.push(['Duración total:', `${totalDuration} minutos`]);
        sessionsSheetData.push(['Promedio por sesión:', `${averageDuration} minutos`]);
        
        const sessionsSheet = XLSX.utils.aoa_to_sheet(sessionsSheetData);
        XLSX.utils.book_append_sheet(wb, sessionsSheet, "Sesiones");
      }
      
      // Generar el archivo Excel
      const fileName = `informe-${excelData.userInfo.nombre}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      writeFile(wb, fileName);
      
    } catch (err) {
      console.error('Error generating Excel:', err);
      setError('Error al generar el Excel');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !excelData.userInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <p>Cargando datos del usuario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Generar Reporte Excel</h2>
 
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Selecciona qué incluir en el Excel:</h3>
        
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="includeTraces"
            name="includeTraces"
            checked={options.includeTraces}
            onChange={handleOptionChange}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!excelData.traces.length}
          />
          <label htmlFor="includeTraces" className="text-sm font-medium text-gray-700">
            Incluir Trazabilidades ({excelData.traces.length || 0})
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeSessions"
            name="includeSessions"
            checked={options.includeSessions}
            onChange={handleOptionChange}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!excelData.sessions.length}
          />
          <label htmlFor="includeSessions" className="text-sm font-medium text-gray-700">
            Incluir Sesiones ({excelData.sessions.length || 0})
          </label>
        </div>
      </div>

      <button 
        onClick={generateExcel}
        className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
          loading || !excelData.userInfo ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={loading || !excelData.userInfo}
      >
        {loading ? 'Generando Excel...' : 'Descargar Excel'}
      </button>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
};