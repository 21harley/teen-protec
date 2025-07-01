'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IconEditar from "./../../app/public/logos/icon_editar.svg";
import IconEliminar from "./../../app/public/logos/icon_eliminar.svg";
import IconMas from "./../../app/public/logos/icon_mas.svg";
import Image from "next/image";
import FormUserAdmin from "./../formUserAdmin/formUserAdmin";
import { UsuarioCompleto } from "@/app/types/user/user";
import { adaptLoginResponseDBToUsuarioCompleto } from "@/app/lib/utils";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  fecha_nacimiento: string;
  tipo_usuario: {
    id: number;
    nombre: string;
  };
  adolecente?: {
    tutor: {
      id: number;
      nombre: string;
      cedula: string;
      profesion_tutor?: string;
      telefono_contacto?: string;
      correo_contacto?: string;
    };
  } | null;
  psicologo?: {
    numero_de_titulo: string;
    nombre_universidad: string;
    monto_consulta: number;
    telefono_trabajo: string;
    redes_sociales: {
      nombre_red: string;
      url_perfil: string;
    }[];
  } | null;
}

interface TipoUsuario {
  id: number;
  nombre: string;
}

interface PaginatedResponse {
  data: Usuario[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CrudUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [loading, setLoading] = useState({
    table: false,
    initial: true,
    tiposUsuario: false,
    modalDelete: false
  });
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState({
    delete: ''
  });
  
  const [windowWidth, setWindowWidth] = useState<number>(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
  const [usuarioToEdit, setUsuarioToEdit] = useState<UsuarioCompleto | null>(null);
  
  // Filters state
  const [filtros, setFiltros] = useState({
    id: "",
    nombre: "",
    tipoUsuarioId: ""
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

  useEffect(() => {
    const fetchData = async () => {
      if (!showCreateModal || !showDeleteModal) {
        await fetchUsuarios();
      }
    };
    fetchData();
  }, [showCreateModal, showDeleteModal]);
  
  const fetchInitialData = async () => {
    try {
      setLoading(prev => ({ ...prev, tiposUsuario: true }));
      const tiposRes = await fetch('/api/tipo-usuario');
      if (!tiposRes.ok) throw new Error('Error al obtener tipos de usuario');
      const tiposData = await tiposRes.json();
      setTiposUsuario(tiposData);

      await fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(prev => ({ ...prev, initial: false, tiposUsuario: false }));
    }
  };

const fetchUsuarios = async () => {
  setLoading(prev => ({ ...prev, table: true }));
  try {
    const params = new URLSearchParams();
    if (filtros.id) params.append('id', filtros.id);
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.tipoUsuarioId) params.append('tipo', filtros.tipoUsuarioId);
    
    params.append('paginated', 'true');
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    const response = await fetch(`/api/usuario?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener usuarios');
    }

    const data: PaginatedResponse | Usuario = await response.json();
    console.log(data, "data");

    let normalizedData: Usuario[] = [];

    // Verifica si la respuesta es paginada
    if ('data' in data) {
      normalizedData = Array.isArray(data.data) ? data.data : [data.data].filter(Boolean);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        pageSize: data.pageSize || 10,
        totalPages: data.totalPages || 1
      });
    } else {
      // Es un único usuario sin paginación
      normalizedData = [data as Usuario];
      setPagination({
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
    }

    console.log(normalizedData, "normalizedData");
    setUsuarios(normalizedData);
    
  } catch (err) {
    setUsuarios([]);
    setPagination(prev => ({ 
      ...prev, 
      total: 0,
      totalPages: 1,
      page: 1
    }));
    // setError(err instanceof Error ? err.message : 'Error desconocido');
  } finally {
    setLoading(prev => ({ ...prev, table: false }));
  }
};

  
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!loading.initial) {
        fetchUsuarios();
      }
    }, 500); // Debounce de 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [filtros, pagination.page, pagination.pageSize]);

  useEffect(() => {
    // Resetear a la primera página cuando cambian los filtros
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filtros.id, filtros.nombre, filtros.tipoUsuarioId]);

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
    setUsuarioToEdit(null);
    fetchUsuarios();
  };

  const confirmDelete = (id: number) => {
    setUsuarioToDelete(id);
    setShowDeleteModal(true);
    setModalError(prev => ({ ...prev, delete: '' }));
  };

  const handleEliminarUsuario = async () => {
    if (!usuarioToDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, modalDelete: true }));
      
      const response = await fetch(`/api/usuario?id=${usuarioToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar usuario');
      
      await fetchUsuarios();
      setShowDeleteModal(false);
      setUsuarioToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar usuario';
      setModalError(prev => ({ ...prev, delete: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, modalDelete: false }));
    }
  };

  const handleEditUsuario = (usuario: UsuarioCompleto) => {
    setUsuarioToEdit(usuario);
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setUsuarioToEdit(null);
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };

  const getTipoUsuario = (usuario: Usuario) => {
    if (usuario.adolecente) return 'Adolescente';
    if (usuario.psicologo) return 'Psicólogo';
    return usuario.tipo_usuario.nombre;
  };

  if (loading.initial) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Usuarios</h1>
        <hr className="w-full max-h-[600px] h-[0.5px] bg-black" />
      </div>
      
      {/* Filters */}
      <div 
        className="mb-6 p-4 bg-gray-50 rounded-lg"
        style={{ width: containerWidth }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por ID:</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="ID de usuario..."
              value={filtros.id}
              onChange={(e) => setFiltros({...filtros, id: e.target.value})}
            />
          </div>
          
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Nombre:</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Nombre de usuario..."
              value={filtros.nombre}
              onChange={(e) => setFiltros({...filtros, nombre: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <button
            className="w-full md:w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center"
            onClick={openCreateModal}
          >
            Crear Usuario <span className="font-bold text-2xl">+</span>
          </button>
        </div>
      </div>
      
      {/* Table */}
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
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Email</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Tipo</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Cédula</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Nacimiento</th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 && !loading.table ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        {filtros.id || filtros.nombre || filtros.tipoUsuarioId 
                          ? "No se encontraron usuarios con los filtros aplicados"
                          : "No hay usuarios registrados"}
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((usuario) => (
                      <tr 
                        key={usuario.id} 
                        className="border-b bg-white"
                      >
                        <td className="p-3 whitespace-nowrap">{usuario.id}</td>
                        <td className="p-3 whitespace-nowrap">{usuario.nombre}</td>
                        <td className="p-3 whitespace-nowrap">{usuario.email}</td>
                        <td className="p-3 whitespace-nowrap">
                          {getTipoUsuario(usuario)}
                        </td>
                        <td className="p-3 whitespace-nowrap">{usuario.cedula}</td>
                        <td className="p-3 whitespace-nowrap">{formatDate(usuario.fecha_nacimiento)}</td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              className="p-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              onClick={() => handleEditUsuario(
                                adaptLoginResponseDBToUsuarioCompleto({ 
                                  user: { 
                                    ...usuario, 
                                    tipo_usuario: { 
                                      ...usuario.tipo_usuario, 
                                      menu: (usuario.tipo_usuario as any).menu ?? [] 
                                    } 
                                  } 
                                })
                              )}
                              title="Editar"
                            >
                              <Image src={IconEditar} alt="editar" width={20} height={20} />
                            </button>
                            <button
                              className="p-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
                              onClick={() => confirmDelete(usuario.id)}
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
      
      {/* Pagination Controls */}
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
      
      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            
            <FormUserAdmin 
              user={usuarioToEdit ?? undefined}
              isEdit={!!usuarioToEdit}
              onSubmit={()=>{
                handleFormSuccess()
              }}
              onToggleEditAndCreate={() =>{ 
                setShowCreateModal(false)
                handleFormSuccess()
              }}
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            <p>¿Estás seguro de que deseas eliminar este usuario?</p>
            
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
                onClick={handleEliminarUsuario}
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