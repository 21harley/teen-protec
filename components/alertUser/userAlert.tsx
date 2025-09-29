'use client'
import React, { useState, useEffect } from "react"
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "@/app/types/user"
import CeldaAlert from "../celdaAlerta/celdaAlerta"
import { Alarma } from "@/app/types/alarma"
import useUserStore from "@/app/store/store"

export default function UserAlert() {
  const [alertas, setAlertas] = useState<Alarma[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  })

  // Obtener datos del usuario del store o del storage
  const user = useUserStore((state) => state.user)
  const [userId, setUserId] = useState<number | null>(user?.id || null)

  useEffect(() => {
    if (!userId) {
      const storageManager = new StorageManager('local')
      const data = storageManager.load<UsuarioInfo>('userData')
      if (data) {
        setUserId(data.id)
      } else {
        setError("No se pudo obtener el ID del usuario")
        setLoading(false)
        return
      }
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchAlertas = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/alerta?usuarioId=${userId}&page=${pagination.page}&pageSize=${pagination.pageSize}`
        )
        
        if (!response.ok) {
          throw new Error('Error al obtener las alarmas')
        }

        const data = await response.json()
        setAlertas(data.data)
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages
        })
      } catch (err) {
        console.error("Error fetching alerts:", err)
        setError("Error al cargar las alarmas")
      } finally {
        setLoading(false)
      }
    }

    fetchAlertas()
  }, [userId, pagination.page])

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({...prev, page: newPage}))
    }
  }

  if (loading) {
    return (
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
        <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start">
        <h1 className="text-xl font-medium mb-4">Alertas</h1>
        <hr className="mb-4" />
        <p>Cargando alertas...</p>
      </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
        <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start">
        <h1 className="text-xl font-medium mb-4">Alertas</h1>
        <hr className="mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
      </section>
    )
  }

  return (
    <section className="_color_four h-auto min-h-[80dvh] grid place-items-center">
      <div className="w-full h-full max-w-[1000px] m-auto mt-3 p-[30px] flex flex-col justify-start  lg:p-0">
      <h1 className="text-xl font-medium mb-4">Alertas</h1>
      <hr className="mb-4" />
      
      {alertas.length === 0 ? (
        <p>No tienes alertas pendientes</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {alertas.map((alerta) => (
              <CeldaAlert
                key={alerta.id}
                id={alerta.id}
                id_usuario={alerta.id_usuario}
                id_tipo_alerta={alerta.id_tipo_alerta}
                mensaje={alerta.mensaje}
                vista={alerta.vista}
                fecha_creacion={alerta.fecha_creacion}
                fecha_vista={alerta.fecha_vista}
                tipo_alerta={alerta.tipo_alerta}
                usuario={alerta.usuario}
              />
            ))}
          </div>
          
          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            
            <span>Página {pagination.page} de {pagination.totalPages}</span>
            
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
    </section>
  )
}