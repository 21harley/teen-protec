'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Alarma {
  id: number;
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  tipo_alerta?: {
    id: number;
    nombre: string;
    url_destino?: string;
    id_tipo_usuario: number;
    tipo_usuario: {
      nombre: string;
    };
  } | null;
  usuario?: {
    nombre: string;
    tipo_usuario: {
      nombre: string;
    };
  } | null;
  mensaje: string;
  fecha_creacion: string;
  fecha_vista?: string | null;
  vista: boolean;
}

interface Usuario {
  id: number;
  nombre: string;
  tipo_usuario: {
    nombre: string;
  };
}

interface TipoAlerta {
  id: number;
  nombre: string;
  url_destino?: string;
  id_tipo_usuario: number;
  tipo_usuario: {
    nombre: string;
  };
}

interface PaginatedResponse {
  data: Alarma[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CrudAlert() {
  const router = useRouter();
  const [alarmas, setAlarmas] = useState<Alarma[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tiposAlerta, setTiposAlerta] = useState<TipoAlerta[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [loading, setLoading] = useState({
    table: false,
    initial: true,
    usuarios: false,
    tiposAlerta: false,
    modalCreate: false,
    modalDelete: false,
    markingAsSeen: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState({
    create: '',
    delete: ''
  });
  
  // Estado para el ancho de la ventana
  const [windowWidth, setWindowWidth] = useState<number>(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertaToDelete, setAlertaToDelete] = useState<number | null>(null);
  
  // Alert form state
  const [alertaForm, setAlertaForm] = useState({
    id: null as number | null,
    id_usuario: "",
    id_tipo_alerta: "",
    mensaje: "",
    vista: false
  });
  
  // Filters state
  const [filtros, setFiltros] = useState({
    usuarioId: "",
    tipoAlertaId: "",
    paraMi: false,
    search: "",
    noVistas: false
  });

  // Efecto para manejar el resize de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Establecer el valor inicial
    handleResize();
    
    // Agregar event listener
    window.addEventListener('resize', handleResize);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calcular el ancho para los contenedores (150px menos que el ancho total)
  const containerWidth = windowWidth > 0 ? `${Math.min(windowWidth - 80, 900)}px` : '700px';

  // Fetch all necessary data
  const fetchInitialData = async () => {
    try {
      // Fetch users for select
      setLoading(prev => ({ ...prev, usuarios: true }));
      const usersRes = await fetch('/api/usuario');
      if (!usersRes.ok) throw new Error('Error al obtener usuarios');
      const usersData = await usersRes.json();
      setUsuarios(usersData);

      // Fetch alert types
      setLoading(prev => ({ ...prev, tiposAlerta: true }));
      const tiposRes = await fetch('/api/tipo-alerta');
      if (!tiposRes.ok) throw new Error('Error al obtener tipos de alerta');
      const tiposData = await tiposRes.json();
      const tiposArray = Array.isArray(tiposData.data) ? tiposData.data : [];
      setTiposAlerta(tiposArray);

      // Fetch initial alerts
      await fetchAlarmas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(prev => ({ ...prev, initial: false, usuarios: false, tiposAlerta: false }));
    }
  };

  // Fetch alerts with filters and pagination
  const fetchAlarmas = async () => {
    setLoading(prev => ({ ...prev, table: true }));
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId);
      if (filtros.tipoAlertaId) params.append('tipoAlertaId', filtros.tipoAlertaId);
      if (filtros.paraMi) params.append('paraMi', 'true');
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.noVistas) params.append('noVistas', 'true');
      
      // Add pagination params
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/alerta?${params.toString()}`);
      if (!response.ok) throw new Error('Error al obtener alarmas');
      const data: PaginatedResponse = await response.json();
      
      setAlarmas(data.data);
      setPagination({
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages
      });
    } catch (err) {
      setPagination({
        total: 0,
        page: 0,
        pageSize: 0,
        totalPages:0
      });
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  };
  
  // Fetch data on component mount and when filters or pagination change
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!loading.initial) {
      fetchAlarmas();
    }
  }, [filtros, pagination.page, pagination.pageSize]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newSize,
      page: 1
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!alertaForm.mensaje) {
      errors.mensaje = "El mensaje es requerido";
    }
    
    if (!alertaForm.id_tipo_alerta) {
      errors.id_tipo_alerta = "El tipo de alerta es requerido";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/update alert
  const handleSubmitAlerta = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(prev => ({ ...prev, modalCreate: true }));
      setModalError(prev => ({ ...prev, create: '' }));
      
      const method = alertaForm.id ? 'PATCH' : 'POST';
      const url = '/api/alerta';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alertaForm.id,
          id_usuario: alertaForm.id_usuario ? parseInt(alertaForm.id_usuario) : null,
          id_tipo_alerta: parseInt(alertaForm.id_tipo_alerta),
          mensaje: alertaForm.mensaje,
          vista: alertaForm.vista
        })
      });
      
      if (!response.ok) throw new Error(`Error al ${alertaForm.id ? 'actualizar' : 'crear'} alarma`);
      
      await fetchAlarmas();
      setShowCreateModal(false);
      setAlertaForm({
        id: null,
        id_usuario: "",
        id_tipo_alerta: "",
        mensaje: "",
        vista: false
      });
      setFormErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al ${alertaForm.id ? 'actualizar' : 'crear'} alarma`;
      setModalError(prev => ({ ...prev, create: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, modalCreate: false }));
    }
  };

  // Prepare delete confirmation
  const confirmDelete = (id: number) => {
    setAlertaToDelete(id);
    setShowDeleteModal(true);
    setModalError(prev => ({ ...prev, delete: '' }));
  };

  // Handle alert deletion
  const handleEliminarAlerta = async () => {
    if (!alertaToDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, modalDelete: true }));
      
      const response = await fetch(`/api/alerta?id=${alertaToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar alarma');
      
      await fetchAlarmas();
      setShowDeleteModal(false);
      setAlertaToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar alarma';
      setModalError(prev => ({ ...prev, delete: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, modalDelete: false }));
    }
  };

  // Open edit modal with alert data
  const handleEditAlerta = (alarma: Alarma) => {
    setAlertaForm({
      id: alarma.id,
      id_usuario: alarma.id_usuario?.toString() || "",
      id_tipo_alerta: alarma.id_tipo_alerta?.toString() || "",
      mensaje: alarma.mensaje,
      vista: alarma.vista || false
    });
    setShowCreateModal(true);
    setModalError(prev => ({ ...prev, create: '' }));
  };

  // Reset form when create modal is opened
  const openCreateModal = () => {
    setAlertaForm({
      id: null,
      id_usuario: "",
      id_tipo_alerta: "",
      mensaje: "",
      vista: false
    });
    setShowCreateModal(true);
    setFormErrors({});
    setModalError(prev => ({ ...prev, create: '' }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Combined date and status display
  const renderCombinedInfo = (alarma: Alarma) => {
    return (
      <div className="flex flex-col">
        <span className="text-sm"><strong>Creado:</strong> {formatDate(alarma.fecha_creacion)}</span>
        {alarma.vista && alarma.fecha_vista && (
          <span className="text-sm">
            <strong>Visto:</strong> {formatDate(alarma.fecha_vista)}
          </span>
        )}
        <span className={`text-sm ${!alarma.vista ? 'text-gray-500 italic' : ''}`}>
          <strong>Estado:</strong> {alarma.vista ? 'Visto' : 'No visto'}
        </span>
      </div>
    );
  };

  if (loading.initial) return (
    <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </section>
  );

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
          <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Alertas</h1>
        <hr className="w-full max-h-[600px] h-[0.5px] bg-black" />
      </div>
      
      {/* Filters - Con ancho dinámico */}
      <div 
        className="mb-6 p-4 bg-gray-50 rounded-lg"
        style={{ width: containerWidth }}
      >
        {/* Primera fila: Buscador y botón */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div className="w-full md:w-auto md:flex-1">
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Buscar en mensaje o usuario..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value})}
            />
          </div>
          <button
            className="w-full md:w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center"
            onClick={openCreateModal}
          >
            Crear Alerta <span className="font-bold text-2xl">+</span>
          </button>
        </div>
        
        {/* Segunda fila: Filtros en grid responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
          {/* Usuario */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario:</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filtros.usuarioId}
              onChange={(e) => setFiltros({...filtros, usuarioId: e.target.value})}
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.tipo_usuario.nombre})
                </option>
              ))}
            </select>
          </div>
          
          {/* Tipo Alerta */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Alerta:</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filtros.tipoAlertaId}
              onChange={(e) => setFiltros({...filtros, tipoAlertaId: e.target.value})}
            >
              <option value="">Todos los tipos</option>
              {tiposAlerta.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Table - Con ancho dinámico */}
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
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Tipo Alerta</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Usuario</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Mensaje</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">URL Destino</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Información</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alarmas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        No hay alertas para mostrar con los filtros actuales
                      </td>
                    </tr>
                  ) : (
                    alarmas.map((alarma) => (
                      <tr 
                        key={alarma.id} 
                        className={`border-b ${!alarma.vista ? 'bg-blue-50' : 'bg-white'}`}
                      >
                        <td className="p-3 whitespace-nowrap">{alarma.id}</td>
                        <td className="p-3 whitespace-nowrap">
                          {alarma.tipo_alerta?.nombre || 'N/A'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {alarma.usuario 
                            ? `${alarma.usuario.nombre} (${alarma.usuario.tipo_usuario.nombre})` 
                            : "Sistema"}
                        </td>
                        <td className="p-3 max-w-[300px] overflow-hidden text-ellipsis" title={alarma.mensaje}>
                          {alarma.mensaje}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {alarma.tipo_alerta?.url_destino || 'N/A'}
                        </td>
                        <td className="p-3 max-w-[300px] overflow-hidden text-ellipsis">
                          {renderCombinedInfo(alarma)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              className="p-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              onClick={() => handleEditAlerta(alarma)}
                              title="Editar"
                            >
                              <Image src="/logos/icon_editar.svg" alt="editar" className="w-[20px] h-[20px]" width={20} height={20} />
                            </button>
                            <button
                              className="p-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
                              onClick={() => confirmDelete(alarma.id)}
                              title="Eliminar"
                            >
                              <Image src="/logos/icon_eliminar.svg" alt="eliminar" className="w-[20px] h-[20px]" width={20} height={20} />
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
      
      {/* Pagination Controls */}
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
      
      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {alertaForm.id ? 'Editar Alerta' : 'Crear Nueva Alerta'}
            </h2>
            
            {modalError.create && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {modalError.create}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Alerta:*</label>
                <select
                  className={`w-full p-2 border rounded ${formErrors.id_tipo_alerta ? 'border-red-500' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                  value={alertaForm.id_tipo_alerta}
                  onChange={(e) => setAlertaForm({...alertaForm, id_tipo_alerta: e.target.value})}
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposAlerta.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
                {formErrors.id_tipo_alerta && <p className="text-red-500 text-sm mt-1">{formErrors.id_tipo_alerta}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario:</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={alertaForm.id_usuario}
                  onChange={(e) => setAlertaForm({...alertaForm, id_usuario: e.target.value})}
                >
                  <option value="">Seleccionar usuario (opcional)</option>
                  {usuarios.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.tipo_usuario.nombre})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje:*</label>
                <textarea
                  className={`w-full p-2 border rounded resize-none ${formErrors.mensaje ? 'border-red-500' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                  rows={3}
                  value={alertaForm.mensaje}
                  onChange={(e) => setAlertaForm({...alertaForm, mensaje: e.target.value})}
                  placeholder="Mensaje descriptivo de la alerta"
                />
                {formErrors.mensaje && <p className="text-red-500 text-sm mt-1">{formErrors.mensaje}</p>}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vista"
                  checked={alertaForm.vista}
                  onChange={(e) => setAlertaForm({...alertaForm, vista: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="vista" className="text-sm font-medium text-gray-700">
                  Marcar como vista
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormErrors({});
                  setModalError(prev => ({ ...prev, create: '' }));
                }}
                disabled={loading.modalCreate}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[100px]"
                onClick={handleSubmitAlerta}
                disabled={loading.modalCreate}
              >
                {loading.modalCreate ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {alertaForm.id ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  alertaForm.id ? 'Actualizar' : 'Crear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar esta alerta?</p>
            
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
                onClick={handleEliminarAlerta}
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
    </section>
  );
}