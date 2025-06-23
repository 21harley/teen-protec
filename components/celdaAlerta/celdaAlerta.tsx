'use client'
import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { AlarmaData } from "@/app/types/alarma";

export default function CeldaAlert({
  id,
  id_usuario,
  mensaje,
  vista,
  fecha_vista,
  url_destino
}: AlarmaData) {
  const [mostrarCompleto, setMostrarCompleto] = useState(false);
  const [alarmaVista, setAlarmaVista] = useState(vista);
  const [necesitaVerMas, setNecesitaVerMas] = useState(false);
  const textoRef = useRef<HTMLParagraphElement>(null);

  // Check if text is truncated when component mounts or message changes
  useEffect(() => {
    if (textoRef.current) {
      const element = textoRef.current;
      setNecesitaVerMas(element.scrollWidth > element.clientWidth);
    }
  }, [mensaje]);

  // Mark as viewed when component is mounted (shown to user)
  useEffect(() => {
    if (!alarmaVista) {
      marcarComoVista();
    }
  }, []); // Empty dependency array to run only once on mount

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

  return (
    <div className={`bg-amber-50 w-full ${!alarmaVista ? 'border-l-4 border-blue-500' : ''}  rounded-xl p-3`}>
      <p 
        ref={textoRef}
        className={mostrarCompleto ? "" : "whitespace-nowrap overflow-hidden text-ellipsis"}
      >
        {mensaje}
        {necesitaVerMas && (
          <span 
            onClick={toggleMostrarTexto} 
            className="text-blue-500 hover:text-blue-700 cursor-pointer ml-1"
          >
            {mostrarCompleto ? " ver menos" : " ver más"}
          </span>
        )}
      </p>
      {fecha_vista && (
        <p className="text-xs text-gray-500">
          Visto el: {new Date(fecha_vista).toLocaleString()}
        </p>
      )}
      <div className="flex mt-2">
        {url_destino ? (
          <Link 
            href={url_destino} 
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Ir a página
          </Link>
        ) : null}
      </div>
    </div>
  );
}