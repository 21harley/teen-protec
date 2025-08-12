'use client'
import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
// Cambiado a imagen PNG en lugar de SVG
import Logo from "./../../app/public/logos/logo_texto.svg";

// Estilos mejorados para el PDF
const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontFamily: 'Helvetica',
    position: 'relative'
  },
  watermark: {
    position: 'absolute',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1
  },
  watermarkImage: {
    width: '60%',
    height: 'auto',
    objectFit: 'contain'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10
  },
  dateText: {
    fontSize: 10,
    color: '#666'
  },
  section: { marginBottom: 15 },
  title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginBottom: 5, fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginVertical: 10 },
  table: { display: 'flex', width: '100%', marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingVertical: 5 },
  tableHeader: { fontWeight: 'bold', width: '25%', fontSize: 10 },
  tableCell: { width: '25%', fontSize: 9 },
});

const Button = ({ 
  onClick, 
  children, 
  className = '',
  disabled = false
}: { 
  onClick: () => void, 
  children: React.ReactNode,
  className?: string,
  disabled?: boolean
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${className} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {children}
  </button>
);

const PDFDocument = ({ 
  data, 
  includeTraces, 
  includeSessions,
  userData,
  psychologistData,
  psychologistsInfo = [],
  generationDate = new Date()
}: {
  data: any;
  includeTraces: boolean;
  includeSessions: boolean;
  userData: any;
  psychologistData: any;
  psychologistsInfo?: any[];
  generationDate?: Date;
}) => {
  const getPsychologistName = (psychologistId: number) => {
    const psychologist = psychologistsInfo.find(p => p.id === psychologistId);
    return psychologist ? psychologist.nombre : `Psicólogo #${psychologistId}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Marca de agua ajustada */}
        <View style={styles.watermark} fixed>
          <Image src={{ uri: Logo.src }}  style={styles.watermarkImage} />
        </View>

        {/* Encabezado con fecha */}
        <View style={styles.header}>
          <Text style={styles.dateText}>
            Generado el: {generationDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Información del usuario */}
        <View style={styles.section}>
          <Text style={styles.title}>Información del Usuario</Text>
          <Text style={styles.text}>Nombre: {userData.nombre}</Text>
          <Text style={styles.text}>Email: {userData.email}</Text>
          <Text style={styles.text}>Cédula: {userData.cedula}</Text>
          <Text style={styles.text}>Teléfono: {userData.telefono}</Text>
          <Text style={styles.text}>Fecha de registro: {new Date(data.fecha_registro).toLocaleDateString()}</Text>
          <Text style={styles.text}>Sexo: {data.sexo}</Text>
          <Text style={styles.text}>Fecha de nacimiento: {new Date(data.fecha_nacimiento).toLocaleDateString()}</Text>
          <Text style={styles.text}>Tipo de usuario: {userData.tipo_usuario?.nombre || 'No especificado'}</Text>
          <Text style={styles.text}>Total tests: {data.total_tests}</Text>
        </View>

        {/* Información del psicólogo (si existe) */}
        {psychologistData && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.title}>Información del Psicólogo</Text>
              <Text style={styles.text}>Nombre: {psychologistData.nombre}</Text>
              <Text style={styles.text}>Email: {psychologistData.email}</Text>
              <Text style={styles.text}>Número de título: {psychologistData.psicologo?.numero_de_titulo || 'No especificado'}</Text>
              <Text style={styles.text}>Universidad: {psychologistData.psicologo?.nombre_universidad || 'No especificado'}</Text>
              <Text style={styles.text}>Teléfono de trabajo: {psychologistData.psicologo?.telefono_trabajo || 'No especificado'}</Text>
              <Text style={styles.text}>Monto de consulta: {psychologistData.psicologo?.monto_consulta || 'No especificado'}</Text>
            </View>
          </>
        )}

        {/* Trazabilidades */}
        {includeTraces && data.trazabilidades && data.trazabilidades.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.title}>Historial de Trazabilidades</Text>
              
              <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={styles.tableHeader}>Psicólogo</Text>
                  <Text style={styles.tableHeader}>Fecha Inicio</Text>
                  <Text style={styles.tableHeader}>Fecha Fin</Text>
                  <Text style={styles.tableHeader}>Estado</Text>
                </View>
                
                {data.trazabilidades.map((trace: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{getPsychologistName(trace.psicologo_id)}</Text>
                    <Text style={styles.tableCell}>{new Date(trace.fecha_inicio).toLocaleDateString()}</Text>
                    <Text style={styles.tableCell}>
                      {trace.fecha_fin ? new Date(trace.fecha_fin).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.tableCell}>
                      {trace.fecha_fin ? 'Finalizada' : 'Activa'}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={[styles.text, { marginTop: 10 }]}>
                Total de trazabilidades: {data.trazabilidades.length}
              </Text>
            </View>
          </>
        )}

        {/* Sesiones */}
        {includeSessions && data.sesiones && data.sesiones.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.title}>Historial de Sesiones</Text>
              
              <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={styles.tableHeader}>Fecha</Text>
                  <Text style={styles.tableHeader}>Hora Inicio</Text>
                  <Text style={styles.tableHeader}>Hora Fin</Text>
                  <Text style={styles.tableHeader}>Duración</Text>
                </View>
                
                {data.sesiones.map((session: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{new Date(session.fecha_inicio).toLocaleDateString()}</Text>
                    <Text style={styles.tableCell}>{new Date(session.fecha_inicio).toLocaleTimeString()}</Text>
                    <Text style={styles.tableCell}>{new Date(session.fecha_fin).toLocaleTimeString()}</Text>
                    <Text style={styles.tableCell}>{session.duracion} minutos</Text>
                  </View>
                ))}
              </View>
              
              <View style={{ marginTop: 10 }}>
                <Text style={styles.text}>
                  Total de sesiones: {data.sesiones.length}
                </Text>
                <Text style={styles.text}>
                  Duración total: {data.sesiones.reduce((acc: number, curr: any) => acc + curr.duracion, 0)} minutos
                </Text>
                <Text style={styles.text}>
                  Promedio por sesión: {Math.round(data.sesiones.reduce((acc: number, curr: any) => acc + curr.duracion, 0) / data.sesiones.length)} minutos
                </Text>
              </View>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};

export const PDFGenerator = ({ userData }: { userData: any }) => {
  const [options, setOptions] = useState({
    includeTraces: false,
    includeSessions: false,
  });
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [psychologistDetails, setPsychologistDetails] = useState<any>(null);
  const [psychologistsInfo, setPsychologistsInfo] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationDate, setGenerationDate] = useState<Date>(new Date());

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
        setUserDetails(userDataRes);

        // Obtener datos del psicólogo si existe
        if (userData.data[0].psicologo_id) {
          const psychoRes = await fetch(`/api/usuario?id=${userData.data[0].psicologo_id}`);
          if (!psychoRes.ok) throw new Error('Error al obtener datos del psicólogo');
          const psychoData = await psychoRes.json();
          setPsychologistDetails(psychoData);
        }

        // Obtener información de todos los psicólogos relacionados con las trazabilidades
        if (userData.data[0].trazabilidades?.length > 0) {
          const psychologistIds = userData.data[0].trazabilidades
            .map((t: any) => t.psicologo_id)
            .filter((id: number, index: number, self: number[]) => self.indexOf(id) === index);
          
          if (psychologistIds.length > 0) {
            const psychologistsRes = await fetch(`/api/usuario?ids=${psychologistIds.join(',')}`);
            if (!psychologistsRes.ok) throw new Error('Error al obtener datos de psicólogos');
            const psychologistsData = await psychologistsRes.json();
            setPsychologistsInfo(Array.isArray(psychologistsData) ? psychologistsData : [psychologistsData]);
          }
        }
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

  const handleDownload = async () => {
    if (!userDetails) {
      setError('No hay datos de usuario para generar el PDF');
      return;
    }

    try {
      setLoading(true);
      setGenerationDate(new Date());
      
      const blob = await pdf(
        <PDFDocument 
          data={userData.data[0]} 
          includeTraces={options.includeTraces} 
          includeSessions={options.includeSessions}
          userData={userDetails}
          psychologistData={psychologistDetails}
          psychologistsInfo={psychologistsInfo}
          generationDate={generationDate}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe-${userDetails.nombre}-${generationDate.toISOString().slice(0, 10)}.pdf`;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userDetails) {
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
      <h2 className="text-2xl font-bold mb-6">Generar Reporte PDF</h2>
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Selecciona qué incluir en el PDF:</h3>
        
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="includeTraces"
            name="includeTraces"
            checked={options.includeTraces}
            onChange={handleOptionChange}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!userData.data[0].trazabilidades?.length}
          />
          <label htmlFor="includeTraces" className="text-sm font-medium text-gray-700">
            Incluir Trazabilidades ({userData.data[0].trazabilidades?.length || 0})
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
            disabled={!userData.data[0].sesiones?.length}
          />
          <label htmlFor="includeSessions" className="text-sm font-medium text-gray-700">
            Incluir Sesiones ({userData.data[0].sesiones?.length || 0})
          </label>
        </div>
      </div>

      <Button 
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        disabled={loading || !userDetails}
      >
        {loading ? 'Generando PDF...' : 'Descargar PDF'}
      </Button>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
};