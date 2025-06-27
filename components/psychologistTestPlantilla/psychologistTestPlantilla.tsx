'use client'
import React, { useState, useEffect } from "react";
import { StorageManager } from "@/app/lib/storageManager";
import { UsuarioInfo} from "./../../app/types/user";
import { TestStatus, TestPlantilla, TestPlantillaInput } from "@/app/types/plantilla";
import useUserStore from "@/app/store/store";
import ModalRegistraTestPlantilla from "./../modalRegistrarTestPlantilla/modalRegistrarTestPlantilla";
import CeldaTestPlantillaPsgychologist from "./../celdaTestPlantillaPsgychologist/celdaTestPlantillaPsgychologist"; // Asegúrate de que la ruta sea correcta
import IconMas from "./../../app/public/logos/icon_mas.svg";
import Image from "next/image";

export default function TestsPlantillaPage() {
  const [plantillas, setPlantillas] = useState<TestPlantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const user = useUserStore((state) => state.user);
  const isPsychologist = user?.id_tipo_usuario === 2;
  let userId = user?.id;
  
  useEffect(() => {
    if (!userId) {
      const storageManager = new StorageManager('local');
      const data = storageManager.load<UsuarioInfo>('userData');
      if(data){
        userId = data.id;
      } else {
        setError("No se pudo obtener el ID del usuario");
        setLoading(false);
        return;
      }
    }

    const fetchPlantillas = async () => {
      try {
        setLoading(true);
        const url = isPsychologist 
          ? `/api/plantilla?psicologoId=${userId}`
          : `/api/plantilla`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Error al obtener las plantillas');
        }

        const data = await response.json();
        setPlantillas(data.data);
      } catch (err) {
        console.error("Error fetching plantillas:", err);
        setError(err instanceof Error ? err.message : "Error al cargar las plantillas");
      } finally {
        setLoading(false);
      }
    };

    fetchPlantillas();
  }, [userId, isPsychologist]);

  const handleCreatePlantilla = async (plantillaData: TestPlantillaInput) => {
    try {
      const response = await fetch('/api/plantilla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...plantillaData,
          id_psicologo: isPsychologist ? userId : null,
          estado: TestStatus.NoIniciado
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear la plantilla');
      }

      const newPlantilla = await response.json();
      setPlantillas([...plantillas, newPlantilla]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error creating plantilla:", err);
      setError(err instanceof Error ? err.message : "Error al crear la plantilla");
    }
  };

  const handlePlantillaUpdated = (updatedPlantilla: TestPlantilla) => {
    setPlantillas(plantillas.map(p => p.id === updatedPlantilla.id ? updatedPlantilla : p));
  };

  const handlePlantillaDeleted = (plantillaId: number) => {
    setPlantillas(plantillas.filter(p => p.id !== plantillaId));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start p-4">
      <div className="flex justify-between flex-col  mb-4">
        <h1 className="text-xl font-medium mb-4">Test</h1>
        <hr className="w-full max-h-[600px] h-[1px] bg-black" />
      </div>
      <div className="flex items-end flex-col mb-4">
          <button 
            className="w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Crear Nueva test <Image src={IconMas} alt="Icono de crear alerta" width={20} height={20} />
          </button>
      </div>
      
      {plantillas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 text-lg mb-4">
            {isPsychologist ? 'No tienes test creados' : 'No tienes test disponibles'}
          </p>
          {isPsychologist && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-[200px] px-4 py-2 h-[40px] bg-[#6DC7E4] text-white rounded hover:bg-blue-700 transition-colors flex justify-center gap-1 items-center cursor-pointer"
            >
              Crear tu primera test <Image src={IconMas} alt="Icono de crear alerta" width={20} height={20} />
            </button> 
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {plantillas.map((plantilla) => (
            <CeldaTestPlantillaPsgychologist
              key={plantilla.id} 
              plantilla={plantilla}
              onPlantillaUpdated={handlePlantillaUpdated}
              onPlantillaDeleted={handlePlantillaDeleted}
            />
          ))}
        </div>
      )}

      <ModalRegistraTestPlantilla
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePlantilla}
      />
    </div>
  );
}