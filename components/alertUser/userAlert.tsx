'use client'
import React, { useState, useEffect } from "react"
import { StorageManager } from "@/app/lib/storageManager"
import { AuthResponse } from "./../../app/types/user"
import CeldaAlert from "../celdaAlerta/celdaAlerta"
import { AlarmaData } from "@/app/types/alarma"

export default function UserAlert() {
  const storageManager = new StorageManager('local');
  const [alertas, setAlertas] = useState<AlarmaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener datos del usuario del storage
  const userData = storageManager.load<AuthResponse>('userData');
  const userId = userData?.user?.id;

  useEffect(() => {
    if (!userId) {
      setError("No se pudo obtener el ID del usuario");
      setLoading(false);
      return;
    }

    const fetchAlertas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/alerta?usuarioId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Error al obtener las alertas');
        }

        const data = await response.json();
        setAlertas(data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setError("Error al cargar las alertas");
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start">
        <h1 className="text-xl font-bold mb-4">Alertas</h1>
        <hr className="mb-4" />
        <p>Cargando alertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start">
        <h1 className="text-xl font-bold mb-4">Alertas</h1>
        <hr className="mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-[1000px] m-auto flex flex-col justify-start">
      <h1 className="text-xl font-bold mb-4">Alertas</h1>
      <hr className="mb-4" />
      
      {alertas.length === 0 ? (
        <p>No tienes alertas pendientes</p>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <CeldaAlert
              key={alerta.id}
              id={alerta.id}
              tipo={alerta.tipo}
              id_usuario={alerta.id_usuario}
              mensaje={alerta.mensaje}
              vista={alerta.vista}
              fecha_vista={alerta.fecha_vista}
              url_destino={alerta.url_destino}
            />
          ))}
        </div>
      )}
    </div>
  );
}