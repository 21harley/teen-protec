'use client'
import React, { useState, useEffect } from "react";
import { StorageManager } from "@/app/lib/storageManager";
import { LoginResponse } from "./../../app/types/user/index";
import { TestResponse, PreguntaData, PreguntaResponse, UsuarioResponse } from "@/app/types/test";
import useUserStore from "@/app/store/store";
import ModalRegistraTest from "./../modalRegistrarTest/modalRegistraTest";
import CeldaTestPsychologistTest from "./../celdaTestPsychologist/celdaTestPsychologist";

export enum TestStatus {
  no_iniciado = "no_iniciado",
  en_progreso = "en_progreso",
  completado = "completado"
}

interface Psicologo {
  id: number;
  id_usuario: number;
  especialidad?: string;
  usuario: UsuarioResponse;
  redes_sociales?: any[];
}

interface TestResponseCompleto extends TestResponse {
  usuario: UsuarioResponse | null;
  psicologo: Psicologo | null;
  preguntas: PreguntaResponse[];
  respuestas: any[];
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestResponseCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const user = useUserStore((state) => state.user);
  const isPsychologist = user?.id_tipo_usuario === 2;
  let userId = user?.id;
  
  useEffect(() => {
    if (!userId) {
      const storageManager = new StorageManager('local');
      const data = storageManager.load<LoginResponse>('userData');
      if(data){
        userId = data.user.id;
      } else {
        setError("No se pudo obtener el ID del usuario");
        setLoading(false);
        return;
      }
    }

    const fetchTests = async () => {
      try {
        setLoading(true);
        const url = isPsychologist 
          ? `/api/test?es_psicologa=true&id_usuario=${userId}`
          : `/api/test?id_usuario=${userId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Error al obtener los tests');
        }

        const data = await response.json();
        setTests(data.data);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [userId, isPsychologist]);

  const handleCreateTest = async (testData: { name: string; questions: PreguntaData[] }) => {
    console.log({
          id_usuario: isPsychologist ? null : userId,
          id_psicologo: isPsychologist ? userId : null,
          preguntas: testData.questions,
          estado: TestStatus.no_iniciado,
          progreso: 0
        })
        console.log(testData)
    
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: testData.name,
          id_usuario: isPsychologist ? null : userId,
          id_psicologo: isPsychologist ? userId : null,
          preguntas: testData.questions,
          estado: TestStatus.no_iniciado,
          progreso: 0
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el test');
      }

      const newTest = await response.json();
      setTests([...tests, newTest]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error creating test:", err);
      setError(err instanceof Error ? err.message : "Error al crear el test");
    }
      
  };

  const handleTestUpdated = (updatedTest: TestResponseCompleto) => {
    setTests(tests.map(t => t.id === updatedTest.id ? updatedTest : t));
  };

  const handleTestDeleted = (testId: number) => {
    setTests(tests.filter(t => t.id !== testId));
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isPsychologist ? 'Tests Asignados' : 'Mis Tests'}
        </h1>
        {isPsychologist && (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Crear Nuevo Test
          </button>
        )}
      </div>
      <hr className="mb-6 border-gray-200" />
      
      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 text-lg mb-4">
            {isPsychologist ? 'No tienes tests asignados' : 'No tienes tests creados'}
          </p>
          {isPsychologist && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear tu primer test
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <CeldaTestPsychologistTest
              key={test.id} 
              test={test}
              onTestUpdated={handleTestUpdated}
              onTestDeleted={handleTestDeleted}
              isPsychologist={isPsychologist}
            />
          ))}
        </div>
      )}

      <ModalRegistraTest
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTest}
      />
    </div>
  );
}