'use client'
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Alarma } from "@/app/types/alarma";

export default function CeldaAlert({
  id,
  id_usuario,
  id_tipo_alerta,
  mensaje,
  vista,
  fecha_creacion,
  fecha_vista,
  tipo_alerta,
  usuario
}: Alarma) {
  const [mostrarCompleto, setMostrarCompleto] = useState(false);
  const [alarmaVista, setAlarmaVista] = useState(vista);
  const [necesitaVerMas, setNecesitaVerMas] = useState(false);
  const textoRef = useRef<HTMLParagraphElement>(null);

  // Verifica si el texto está truncado
  useEffect(() => {
    if (textoRef.current) {
      const element = textoRef.current;
      setNecesitaVerMas(element.scrollWidth > element.clientWidth || mensaje.length > 100);
    }
  }, [mensaje]);

  // Marca como vista al montarse si aún no ha sido vista
  useEffect(() => {
    if (!alarmaVista) {
      marcarComoVista();
    }
  }, []);

  const toggleMostrarTexto = () => {
    setMostrarCompleto(!mostrarCompleto);
  };

  const marcarComoVista = async () => {
    try {
      const response = await fetch('/api/alerta', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          vista: true
        }),
      });

      if (response.ok) {
        setAlarmaVista(true);
      } else {
        console.error('Error al marcar la alarma como vista');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  const urlDestino = tipo_alerta?.url_destino || null;
  const remitente = usuario?.nombre ? `De: ${usuario.nombre}` : 'Sistema';

  return (
    <div className={`bg-amber-50 w-full ${!alarmaVista ? 'border-l-4 border-blue-500' : ''} rounded-xl p-3`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-gray-600">{remitente}</span>
        <span className="text-xs text-gray-500">
          {new Date(fecha_creacion).toLocaleString()}
        </span>
      </div>

      <p 
        ref={textoRef}
        className={mostrarCompleto ? "" : "line-clamp-3"}
      >
        {mensaje}
      </p>

      {(necesitaVerMas || mensaje.length > 100) && (
        <button 
          onClick={toggleMostrarTexto} 
          className="text-blue-500 hover:text-blue-700 text-sm mt-1"
        >
          {mostrarCompleto ? "Ver menos" : "Ver más"}
        </button>
      )}

      {fecha_vista && (
        <p className="text-xs text-gray-500 mt-1">
          Visto el: {new Date(fecha_vista).toLocaleString()}
        </p>
      )}

      <div className="flex mt-2">
        {urlDestino && (
          <Link 
            href={urlDestino} 
            className="text-blue-500 hover:text-blue-700 text-sm"
            onClick={marcarComoVista}
          >
            Ir a página
          </Link>
        )}
      </div>
    </div>
  );
}
