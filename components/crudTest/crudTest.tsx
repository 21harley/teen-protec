'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IconEditar from "./../../app/public/logos/icon_editar.svg";
import IconEliminar from "./../../app/public/logos/icon_eliminar.svg";
import IconMas from "./../../app/public/logos/icon_mas.svg";
import Image from "next/image";

interface Test {
  id: number;
  nombre: string;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  progreso: number;
  fecha_creacion: string;
  fecha_ultima_respuesta?: string;
  id_psicologo?: number;
  id_usuario?: number;
  psicologo?: {
    usuario: {
      nombre: string;
    };
  };
  usuario?: {
    nombre: string;
  };
  preguntas?: Pregunta[];
  respuestas?: Respuesta[];
}

interface Plantilla {
  id: number;
  nombre: string;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  fecha_creacion: string;
  id_psicologo: number;
  psicologo?: {
    usuario: {
      nombre: string;
    };
  };
  preguntas?: PreguntaPlantilla[];
}

interface Pregunta {
  id: number;
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria: boolean;
  tipo: {
    nombre: string;
  };
  opciones?: Opcion[];
}

interface PreguntaPlantilla {
  id: number;
  texto_pregunta: string;
  id_tipo: number;
  orden: number;
  obligatoria: boolean;
  tipo: {
    nombre: string;
  };
  opciones?: OpcionPlantilla[];
}

interface Opcion {
  id: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro: boolean;
}

interface OpcionPlantilla {
  id: number;
  texto: string;
  valor: string;
  orden: number;
  es_otro: boolean;
}

interface Respuesta {
  id: number;
  id_pregunta: number;
  id_opcion?: number;
  texto_respuesta?: string;
  valor_rango?: number;
  fecha: string;
}

interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type CrudMode = 'tests' | 'plantillas';

export default function CrudTestsPlantillas() {
  const router = useRouter();
  const [mode, setMode] = useState<CrudMode>('tests');
  const [data, setData] = useState<(Test | Plantilla)[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [loading, setLoading] = useState({
    table: false,
    initial: true,
    modalDelete: false
  });
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState({
    delete: ''
  });
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Test | Plantilla | null>(null);
  const [filtros, setFiltros] = useState({
    id: "",
    nombre: "",
    estado: "",
    id_psicologo: "",
    id_usuario: ""
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const containerWidth = windowWidth > 0 ? `${Math.min(windowWidth - 80, 900)}px` : '700px';

  const fetchData = async () => {
    setLoading(prev => ({ ...prev, table: true }));
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filtros.id) params.append('id', filtros.id);
      if (filtros.nombre) params.append('nombre', filtros.nombre);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.id_psicologo) params.append('id_psicologo', filtros.id_psicologo);
      if (mode === 'tests' && filtros.id_usuario) params.append('id_usuario', filtros.id_usuario);
      
      params.append('paginated', 'true');
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const endpoint = mode === 'tests' ? '/api/test' : '/api/plantilla';
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener datos');
      }
      
      const result: PaginatedResponse = await response.json();
      
      setData(Array.isArray(result.data) ? result.data : []);
      setPagination({
        total: result.total || 0,
        page: result.page || 1,
        pageSize: result.pageSize || 10,
        totalPages: result.totalPages || 1
      });
      
    } catch (err) {
      setData([]);
      setPagination(prev => ({ 
        ...prev, 
        total: 0,
        totalPages: 1,
        page: 1
      }));
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(prev => ({ ...prev, table: false, initial: false }));
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [mode]);

  useEffect(() => {
    if (!loading.initial) {
      fetchData();
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!loading.initial) {
        fetchData();
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filtros]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filtros.id, filtros.nombre, filtros.estado, filtros.id_psicologo, filtros.id_usuario]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newSize,
      page: 1
    }));
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setItemToEdit(null);
    fetchData();
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
    setModalError(prev => ({ ...prev, delete: '' }));
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, modalDelete: true }));
      
      const endpoint = mode === 'tests' ? '/api/test' : '/api/plantilla';
      const response = await fetch(`${endpoint}?id=${itemToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      await fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar';
      setModalError(prev => ({ ...prev, delete: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, modalDelete: false }));
    }
  };

  const handleEditItem = (item: Test | Plantilla) => {
    setItemToEdit(item);
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setItemToEdit(null);
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'no_iniciado': return 'bg-gray-100 text-gray-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading.initial) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 p-4">
      <p>Error: {error}</p>
      <button 
        onClick={() => {
          setError(null);
          fetchData();
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-medium">
          {mode === 'tests' ? 'Tests' : 'Plantillas de Tests'}
        </h1>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${mode === 'tests' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('tests')}
          >
            Tests
          </button>
          <button
            className={`px-4 py-2 rounded ${mode === 'plantillas' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('plantillas')}
          >
            Plantillas
          </button>
        </div>
      </div>
      <hr className="w-full max-h-[600px] h-[1px] bg-black mb-6" />
      
      <div 
        className="mb-6 p-4 bg-gray-50 rounded-lg"
        style={{ width: containerWidth }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por ID:</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder={`ID de ${mode === 'tests' ? 'test' : 'plantilla'}...`}
              value={filtros.id}
              onChange={(e) => setFiltros({...filtros, id: e.target.value})}
            />
          </div>
          
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Nombre:</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder={`Nombre de ${mode === 'tests' ? 'test' : 'plantilla'}...`}
              value={filtros.nombre}
              onChange={(e) => setFiltros({...filtros, nombre: e.target.value})}
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado:</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            >
              <option value="">Todos</option>
              <option value="no_iniciado">No iniciado</option>
              <option value="en_progreso">En progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Psicólogo:</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="ID de psicólogo..."
              value={filtros.id_psicologo}
              onChange={(e) => setFiltros({...filtros, id_psicologo: e.target.value})}
            />
          </div>

          {mode === 'tests' && (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Usuario:</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="ID de usuario..."
                value={filtros.id_usuario}
                onChange={(e) => setFiltros({...filtros, id_usuario: e.target.value})}
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <button
            className="w-full md:w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center"
            onClick={openCreateModal}
          >
            Crear {mode === 'tests' ? 'Test' : 'Plantilla'} 
            <Image src={IconMas} alt="Icono de crear" width={20} height={20} />
          </button>
        </div>
      </div>
      
      <div 
        className="w-full border rounded-lg shadow-sm overflow-auto"
        style={{ width: containerWidth, maxWidth: '900px' }}
      >
        {loading.table ? (
          <div className="flex justify-center items-center p-8 min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] relative">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[800px] w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">ID</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Nombre</th>
                    {mode === 'tests' && (
                      <>
                        <th className="p-3 text-left font-semibold whitespace-nowrap">Usuario</th>
                        <th className="p-3 text-left font-semibold whitespace-nowrap">Progreso</th>
                      </>
                    )}
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Psicólogo</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Estado</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Creación</th>
                    {mode === 'tests' && (
                      <th className="p-3 text-left font-semibold whitespace-nowrap">Última respuesta</th>
                    )}
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && !loading.table ? (
                    <tr>
                      <td colSpan={mode === 'tests' ? 8 : 6} className="p-4 text-center text-gray-500">
                        {filtros.id || filtros.nombre || filtros.estado || filtros.id_psicologo || filtros.id_usuario
                          ? `No se encontraron ${mode === 'tests' ? 'tests' : 'plantillas'} con los filtros aplicados`
                          : `No hay ${mode === 'tests' ? 'tests' : 'plantillas'} registrados`}
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr 
                        key={item.id} 
                        className="border-b bg-white hover:bg-gray-50"
                      >
                        <td className="p-3 whitespace-nowrap">{item.id}</td>
                        <td className="p-3 whitespace-nowrap">{item.nombre}</td>
                        
                        {mode === 'tests' && (
                          <>
                            <td className="p-3 whitespace-nowrap">
                              {(item as Test).usuario?.nombre || 'N/A'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(item as Test).progreso}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{(item as Test).progreso}%</span>
                            </td>
                          </>
                        )}
                        
                        <td className="p-3 whitespace-nowrap">
                          {item.psicologo?.usuario.nombre || 'N/A'}
                        </td>
                        
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(item.estado)}`}>
                            {item.estado.replace('_', ' ')}
                          </span>
                        </td>
                        
                        <td className="p-3 whitespace-nowrap">{formatDate(item.fecha_creacion)}</td>
                        
                        {mode === 'tests' && (
                          <td className="p-3 whitespace-nowrap">
                            {formatDate((item as Test).fecha_ultima_respuesta)}
                          </td>
                        )}
                        
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              className="p-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              onClick={() => handleEditItem(item)}
                              title="Editar"
                            >
                              <Image src={IconEditar} alt="editar" width={20} height={20} />
                            </button>
                            <button
                              className="p-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
                              onClick={() => confirmDelete(item.id)}
                              title="Eliminar"
                            >
                              <Image src={IconEliminar} alt="eliminar" width={20} height={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {pagination.total > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
              className="p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-600">registros</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
          </div>
          
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              «
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ‹
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 border rounded ${pagination.page === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              ›
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreateModal(false)}
              aria-label="Cerrar modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">
              {itemToEdit ? 'Editar' : 'Crear'} {mode === 'tests' ? 'Test' : 'Plantilla'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={itemToEdit?.nombre || ''}
                  onChange={(e) => itemToEdit && setItemToEdit({...itemToEdit, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado:</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={itemToEdit?.estado || 'no_iniciado'}
                  onChange={(e) => itemToEdit && setItemToEdit({...itemToEdit, estado: e.target.value as any})}
                >
                  <option value="no_iniciado">No iniciado</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleFormSuccess}
                >
                  {itemToEdit ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowDeleteModal(false);
                setModalError(prev => ({ ...prev, delete: '' }));
              }}
              aria-label="Cerrar modal"
              disabled={loading.modalDelete}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este {mode === 'tests' ? 'test' : 'plantilla'}?</p>
            
            {modalError.delete && (
              <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                {modalError.delete}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setModalError(prev => ({ ...prev, delete: '' }));
                }}
                disabled={loading.modalDelete}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center min-w-[100px]"
                onClick={handleDeleteItem}
                disabled={loading.modalDelete}
              >
                {loading.modalDelete ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}