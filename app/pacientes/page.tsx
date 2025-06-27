'use client'
import LayoutPage from "@/components/layoutPage/layoutPage"
import { useEffect, useState } from 'react'
import ModalAgregarPaciente from "@/components/modalAgregarPaciente/modalAgregarPaciente"
import PacienteCell from "./../../components/celdaPaciente/celdaPaciente"
import { StorageManager } from "@/app/lib/storageManager"
import { UsuarioInfo } from "./../types/user"
import { UsuarioCompleto } from "./../types/gestionPaciente/index"
import IconUsesrPlus from "./../../app/public/logos/user-plus.svg";
import Image from "next/image";

export default function Pacientes() {
  const [showModal, setShowModal] = useState(false)
  const [pacientes, setPacientes] = useState<UsuarioCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [idPsicologo, setIdPsicologo] = useState<number | null>(null)
  const [showSinAsignar, setShowSinAsignar] = useState(false)

  // Obtener el ID del psicólogo logueado
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storageManager = new StorageManager('local')
        const data = storageManager.load<UsuarioInfo>('userData')
        if (data?.id) {
          setIdPsicologo(data.id)
        }
      } catch (error) {
        console.error('Error obteniendo datos del psicólogo:', error)
      }
    }

    fetchUserData()
  }, [])

  // Obtener pacientes
  const fetchPacientes = async () => {
    if (!idPsicologo) return
    
    setLoading(true)
    try {
      let url = `/api/paciente?conTests=true`
      
      if (showSinAsignar) {
        url += '&sinPsicologo=true'
      } else {
        url += `&id_psicologo=${idPsicologo}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al obtener pacientes')
      
      const data = await response.json()
      // Añadir propiedad esAdolescente basada en id_tipo_usuario o adolecente
      console.log(data);

      const pacientesConAdolescente = data.map((paciente: any) => ({
        ...paciente,
        esAdolescente: paciente.id_tipo_usuario === 3 || !!paciente.adolecente
      }))
      setPacientes(pacientesConAdolescente)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (idPsicologo) {
      fetchPacientes()
    }
  }, [idPsicologo, showSinAsignar])

  const handlePacientesAgregados = () => {
    fetchPacientes()
  }

  const toggleVistaPacientes = () => {
    setShowSinAsignar(!showSinAsignar)
  }

  return (
    <>
      <LayoutPage>
        <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start p-4">
          <div className="flex justify-between flex-col mb-4">
            <h1 className="text-xl font-medium mb-4">Pacientes</h1>
            <hr className="w-full max-h-[600px] h-[1px] bg-black" />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center cursor-pointer"
            >
              {showSinAsignar ? 'Asignar Paciente' : 'Agregar Paciente'} 
              <Image src={IconUsesrPlus} alt="Icono de crear alerta" width={20} height={20} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando pacientes...</div>
          ) : pacientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {showSinAsignar 
                  ? 'No hay pacientes sin asignar' 
                  : 'No tienes pacientes asignados'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {showSinAsignar ? 'Asignar paciente' : 'Agregar tu primer paciente'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pacientes.map(paciente => (
                <PacienteCell
                  key={paciente.id}
                  paciente={paciente}
                  psicologoId={idPsicologo || 0}
                  onRefresh={fetchPacientes}
                  esAsignacion={showSinAsignar}
                />
              ))}
            </div>
          )}

          {showModal && idPsicologo && (
            <ModalAgregarPaciente
              visible={showModal}
              onClose={() => setShowModal(false)}
              idPsicologo={idPsicologo}
              onPacientesAgregados={handlePacientesAgregados}
              mostrarSinAsignar={showSinAsignar}
            />
          )}
        </div>
      </LayoutPage>
    </>
  )
}