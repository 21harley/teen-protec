import React, { useState, useEffect } from 'react';
import { 
  PreguntaPlantillaBase, 
  TestPlantilla, 
  TestPlantillaInput, 
  TestStatus,
  TipoPreguntaPlantilla,
  PesoPreguntaTipoPlantilla
} from './../../app/types/plantilla/index';
import ModalRegistrarInput from './../modalRegistrarInput/modalRegistrarInput';
import Image from "next/image";
import { TipoPreguntaNombre, PreguntaData, OpcionData, PesoPreguntaTipo } from '@/app/types/test/index';

// Mapeo de tipos de pregunta para mostrar en la UI
const TIPO_PREGUNTA_DISPLAY: Record<TipoPreguntaNombre, string> = {
  [TipoPreguntaNombre.OPCION_UNICA]: 'Opción única',
  [TipoPreguntaNombre.OPCION_MULTIPLE]: 'Selección múltiple',
  [TipoPreguntaNombre.RESPUESTA_CORTA]: 'Texto corto',
  [TipoPreguntaNombre.SELECT]: 'Lista desplegable',
  [TipoPreguntaNombre.RANGO]: 'Rango numérico'
};

interface BaremoDetalle {
  [key: string]: number;
}

const PESO_PREGUNTA_DISPLAY: Record<PesoPreguntaTipo, string> = {
  [PesoPreguntaTipo.SIN_VALOR]: 'Sin valor',
  [PesoPreguntaTipo.IGUAL_VALOR]: 'Igual valor',
  [PesoPreguntaTipo.BAREMO]: 'Baremo'
};

// Definición de tipos de pregunta disponibles
const TIPOS_PREGUNTA_DISPONIBLES: TipoPreguntaPlantilla[] = [
  { id: 1, nombre: TipoPreguntaNombre.OPCION_UNICA, descripcion: 'Opción única', tipo_respuesta: 'radio' },
  { id: 2, nombre: TipoPreguntaNombre.OPCION_MULTIPLE, descripcion: 'Selección múltiple', tipo_respuesta: 'checkbox' },
  { id: 3, nombre: TipoPreguntaNombre.RESPUESTA_CORTA, descripcion: 'Texto corto', tipo_respuesta: 'text' },
  { id: 4, nombre: TipoPreguntaNombre.SELECT, descripcion: 'Lista desplegable', tipo_respuesta: 'select' },
  { id: 5, nombre: TipoPreguntaNombre.RANGO, descripcion: 'Rango numérico', tipo_respuesta: 'number' }
];

interface PsicologoOption {
  id: number;
  nombre: string;
}

interface ModalRegistraPlantillaProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSubmit: (plantillaData: TestPlantillaInput) => void;
  onDelete?: () => void;
  plantillaToEdit?: TestPlantilla | null;
}

const ModalRegistraTestPlantilla: React.FC<ModalRegistraPlantillaProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  plantillaToEdit,
  isAdmin = false 
}) => {
  const isTextAmin = isAdmin ? "Plantilla" : "Test";
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [preguntas, setPreguntas] = useState<PreguntaData[]>([]);
  const [pesoPreguntas, setPesoPreguntas] = useState<PesoPreguntaTipoPlantilla>(PesoPreguntaTipoPlantilla.SIN_VALOR);
  const [valorPreguntaIgual, setValorPreguntaIgual] = useState<number | null>(null);
  const [isModalRegistrarInputOpen, setIsModalRegistrarInputOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PreguntaData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isEditingPlantilla, setIsEditingPlantilla] = useState(false);
  const [psychologists, setPsychologists] = useState<PsicologoOption[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [ponderacionCambiada, setPonderacionCambiada] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (plantillaToEdit) {
        setNombrePlantilla(plantillaToEdit.nombre);
        setPreguntas(convertPreguntasToPreguntaData(plantillaToEdit.preguntas || []));
        setPesoPreguntas(plantillaToEdit.peso_preguntas || PesoPreguntaTipo.SIN_VALOR);
        
        if (plantillaToEdit.peso_preguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR && plantillaToEdit.preguntas?.length) {
          setValorPreguntaIgual(plantillaToEdit.preguntas[0].peso || null);
        }
        
        setSelectedPsychologist(plantillaToEdit.id_psicologo || null);
        setIsEditingPlantilla(true);
        setPonderacionCambiada(false);
      } else {
        resetForm();
      }

      if (isAdmin) {
        fetchPsychologists();
      }
    }
  }, [isOpen, plantillaToEdit, isAdmin]);

  const convertPreguntasToPreguntaData = (preguntas: PreguntaPlantillaBase[]): PreguntaData[] => {
    return preguntas.map(pregunta => ({
      ...pregunta,
      id: pregunta.id || 0,
      id_tipo: pregunta.id_tipo,
      texto_pregunta: pregunta.texto_pregunta,
      orden: pregunta.orden,
      obligatoria: pregunta.obligatoria || false,
      placeholder: pregunta.placeholder || null,
      min: pregunta.min || null,
      max: pregunta.max || null,
      paso: pregunta.paso || null,
      peso: pregunta.peso || null,
      baremo_detalle: pregunta.baremo_detalle || null,
      opciones: pregunta.opciones || [],
      tipo: {
        id: pregunta.id_tipo,
        nombre: getTipoNombreById(pregunta.id_tipo),
        descripcion: null,
        tipo_respuesta: getTipoRespuestaById(pregunta.id_tipo)
      }
    }));
  };

  const getTipoNombreById = (id: number): TipoPreguntaNombre => {
    const tipo = TIPOS_PREGUNTA_DISPONIBLES.find(t => t.id === id);
    return tipo ? tipo.nombre as TipoPreguntaNombre : TipoPreguntaNombre.RESPUESTA_CORTA;
  };

  const getTipoRespuestaById = (id: number): string => {
    const tipo = TIPOS_PREGUNTA_DISPONIBLES.find(t => t.id === id);
    return tipo ? tipo.tipo_respuesta : 'text';
  };

  const resetForm = () => {
    setNombrePlantilla('');
    setPreguntas([]);
    setPesoPreguntas(PesoPreguntaTipoPlantilla.SIN_VALOR);
    setValorPreguntaIgual(null);
    setSelectedPsychologist(null);
    setIsEditingPlantilla(false);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(null);
    setPonderacionCambiada(false);
  };

  const fetchPsychologists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuario?tipo=psicologo');
      const data = await response.json();
      const options = data.map((user: any) => ({
        id: user.id,
        nombre: user.nombre
      }));
      setPsychologists(options);
    } catch (error) {
      console.error('Error fetching psychologists:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = (): boolean => {
    // Validaciones básicas
    if (preguntas.length === 0 || !nombrePlantilla.trim() || (isAdmin && !selectedPsychologist)) {
      return true;
    }
    
    // Validación para igual valor
    if (pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR && valorPreguntaIgual === null) {
      return true;
    }
    
    // Validación para edición con ponderación cambiada
    if (isEditingPlantilla && ponderacionCambiada) {
      if (pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO) {
        const preguntasSinBaremo = preguntas.filter(p => 
          p.id_tipo !== 3 && (!p.baremo_detalle || Object.keys(p.baremo_detalle).length === 0)
        );
        return preguntasSinBaremo.length > 0;
      }
      return false;
    }
    
    return false;
  };

  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    setCurrentQuestionIndex(null);
    setIsModalRegistrarInputOpen(true);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(preguntas[index]);
    setCurrentQuestionIndex(index);
    setIsModalRegistrarInputOpen(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const newPreguntas = preguntas.filter((_, i) => i !== index);
    const reorderedPreguntas = newPreguntas.map((q, idx) => ({
      ...q,
      orden: idx + 1
    }));
    setPreguntas(reorderedPreguntas);
  };

  const moveQuestionUp = (index: number) => {
    if (index <= 0) return;
    
    const newPreguntas = [...preguntas];
    [newPreguntas[index - 1], newPreguntas[index]] = [newPreguntas[index], newPreguntas[index - 1]];
    
    const reordered = newPreguntas.map((q, i) => ({
      ...q,
      orden: i + 1
    }));
    
    setPreguntas(reordered);
  };

  const moveQuestionDown = (index: number) => {
    if (index >= preguntas.length - 1) return;
    
    const newPreguntas = [...preguntas];
    [newPreguntas[index], newPreguntas[index + 1]] = [newPreguntas[index + 1], newPreguntas[index]];
    
    const reordered = newPreguntas.map((q, i) => ({
      ...q,
      orden: i + 1
    }));
    
    setPreguntas(reordered);
  };

  const handleSaveQuestion = (pregunta: PreguntaData) => {
    let preguntaActualizada = { ...pregunta };
    
    // Auto baremo para preguntas de texto corto
    if (pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO && 
        pregunta.id_tipo === 3 && // ID 3 = RESPUESTA_CORTA
        pregunta.peso !== null) {
      preguntaActualizada = {
        ...pregunta,
        baremo_detalle: {
          'valor': pregunta.peso
        }
      };
    }

    if (currentQuestionIndex !== null) {
      const updatedPreguntas = [...preguntas];
      updatedPreguntas[currentQuestionIndex] = preguntaActualizada;
      setPreguntas(updatedPreguntas);
    } else {
      const newPregunta = {
        ...preguntaActualizada,
        orden: preguntas.length + 1
      };
      setPreguntas([...preguntas, newPregunta]);
    }
    
    setPonderacionCambiada(false);
  };

  const handleChangePesoPreguntas = (newTipo: PesoPreguntaTipoPlantilla) => {
    const tieneValores = preguntas.some(p => 
      p.peso !== null || 
      (p.baremo_detalle && Object.keys(p.baremo_detalle).length > 0)
    );

    if (tieneValores && newTipo === PesoPreguntaTipoPlantilla.SIN_VALOR) {
      const confirmMessage = `Al cambiar a "Sin valor", se perderán los valores configurados. ¿Continuar?`;
      if (!window.confirm(confirmMessage)) return;
    }

    setPesoPreguntas(newTipo);
    if (newTipo !== pesoPreguntas) {
      setPonderacionCambiada(true);
    }
    
    if (newTipo !== PesoPreguntaTipoPlantilla.IGUAL_VALOR) {
      setValorPreguntaIgual(null);
    }
    
    setPreguntas(prev => prev.map(p => ({
      ...p,
      peso: newTipo === PesoPreguntaTipoPlantilla.IGUAL_VALOR ? valorPreguntaIgual : 
            newTipo === PesoPreguntaTipoPlantilla.SIN_VALOR ? null : p.peso,
      baremo_detalle: newTipo === PesoPreguntaTipoPlantilla.BAREMO ? 
        (p.id_tipo === 3 && p.peso ? { 'valor': p.peso } : p.baremo_detalle) : 
        null
    })));
  };

  const handleSubmit = () => {
    if (!nombrePlantilla.trim()) {
      alert('Por favor ingrese un nombre para la plantilla');
      return;
    }

    if (preguntas.length === 0) {
      alert('Debe agregar al menos una pregunta');
      return;
    }

    if (isAdmin && !selectedPsychologist) {
      alert('Debe seleccionar un psicólogo');
      return;
    }

    if (pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR && valorPreguntaIgual === null) {
      alert('Debe especificar el valor para las preguntas');
      return;
    }

    if (pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO) {
      const preguntasSinBaremo = preguntas.filter(p => {
        // Excluir preguntas de texto corto que tienen peso asignado
        if (p.id_tipo === 3 && p.peso !== null) return false;
        
        return !p.baremo_detalle || Object.keys(p.baremo_detalle).length === 0;
      });
      
      if (preguntasSinBaremo.length > 0) {
        alert(`Las siguientes preguntas no tienen baremo configurado: ${preguntasSinBaremo.map(p => p.orden).join(', ')}`);
        return;
      }
    }

    const preguntasParaEnvio = preguntas.map(pregunta => ({
      id: pregunta.id,
      id_tipo: pregunta.id_tipo,
      texto_pregunta: pregunta.texto_pregunta,
      orden: pregunta.orden,
      obligatoria: pregunta.obligatoria,
      placeholder: pregunta.placeholder,
      min: pregunta.min,
      max: pregunta.max,
      paso: pregunta.paso,
      peso: (() => {
        const pesoValue = pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR ? valorPreguntaIgual : pregunta.peso;
        return pesoValue === null ? undefined : pesoValue;
      })(),
      baremo_detalle: pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO ? 
        (pregunta.id_tipo === 3 && pregunta.peso ? { 'valor': pregunta.peso } : pregunta.baremo_detalle) : 
        undefined,
      opciones: pregunta.opciones
    }));

    const plantillaData: any = {
      nombre: nombrePlantilla,
      peso_preguntas: pesoPreguntas,
      config_baremo: plantillaToEdit?.config_baremo || null,
      valor_total: plantillaToEdit?.valor_total || null,
      preguntas: preguntasParaEnvio,
      id_psicologo: isAdmin ? selectedPsychologist : plantillaToEdit?.id_psicologo
    };
    
    onSubmit(plantillaData);
    onClose();
  };

  const getTipoPreguntaNombre = (idTipo: number): string => {
    const tipo = TIPOS_PREGUNTA_DISPONIBLES.find(t => t.id === idTipo);
    return tipo ? TIPO_PREGUNTA_DISPLAY[tipo.nombre as TipoPreguntaNombre] : 'Desconocido';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center z-50 w-full h-full">
        <div className="bg-white rounded-lg p-6 w-full max-w-[650px] h-auto flex flex-col">
          <div className="w-full flex justify-end">
            <button 
              onClick={onClose} 
              className="text-black hover:text-gray-700 cursor-pointer"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
          
          <div className="w-full max-w-[600px] p-2 m-auto">
            <div>
              <h2 className="text-xl font-medium">
                {isEditingPlantilla ? `Editar ${isTextAmin}` : `Crear Nueva ${isTextAmin}`}
              </h2>
              <hr className="w-full max-h-[600px] h-[0.5px] bg-black" />
            </div>
            
            <div className="flex-1 mt-4">
              {isAdmin && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Psicólogo asignado *
                  </label>
                  <select
                    value={selectedPsychologist || ''}
                    onChange={(e) => setSelectedPsychologist(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={loading}
                  >
                    <option value="">Seleccionar psicólogo</option>
                    {psychologists.map((psych) => (
                      <option key={`psych-${psych.id}`} value={psych.id}>
                        {psych.nombre}
                      </option>
                    ))}
                  </select>
                  {loading && <p className="text-sm text-gray-500 mt-1">Cargando psicólogos...</p>}
                </div>
              )}
              
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del {isTextAmin}*
                </label>
                <input
                  type="text"
                  value={nombrePlantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder={`Ingrese el nombre de la ${isTextAmin.toLowerCase()}`}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de ponderación
                </label>
                <select
                  value={pesoPreguntas}
                  onChange={(e) => handleChangePesoPreguntas(e.target.value as PesoPreguntaTipoPlantilla)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {Object.values(PesoPreguntaTipo).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {PESO_PREGUNTA_DISPLAY[tipo]}
                    </option>
                  ))}
                </select>
                
                {pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor para cada pregunta *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={valorPreguntaIgual || ''}
                      onChange={(e) => setValorPreguntaIgual(parseFloat(e.target.value) || null)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Ingrese el valor para cada pregunta"
                    />
                  </div>
                )}
                
                {pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Para el tipo Baremo, deberá especificar el valor de cada opción al agregar/editar preguntas.</p>
                    <p>Para preguntas de texto corto, se asignará automáticamente el valor ingresado como baremo.</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-start flex-col mb-2">
                  <h3 className="text-lg font-medium mb-2">Preguntas</h3>
                  <div className="border rounded-2xl w-full flex flex-col min-h-[150px] max-h-[200px]">
                    <div className="p-2 overflow-y-auto flex-grow">
                      {preguntas.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No hay preguntas agregadas aún
                        </div>
                      ) : (
                        <div className="space-y-3 h-full max-h-[300px]">
                          {preguntas.map((pregunta, index) => (
                            <div key={index} className="border rounded p-3 bg-gray-50 group hover:bg-gray-100">
                              <div className="flex justify-between items-start">
                                <div className="flex-grow pr-4 overflow-hidden">
                                  <div className="font-medium truncate">
                                    {pregunta.orden}. {pregunta.texto_pregunta}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Tipo: {getTipoPreguntaNombre(pregunta.id_tipo)}
                                    {pregunta.obligatoria ? ' (Obligatoria)' : ' (Opcional)'}
                                  </div>
                                  {pregunta.opciones && pregunta.opciones.length > 0 && (
                                    <div className="text-sm text-gray-600 mt-1 truncate">
                                      Opciones: {pregunta.opciones.map(opt => opt.texto).join(', ')}
                                    </div>
                                  )}
                                  {pregunta.placeholder && (
                                    <div className="text-sm text-gray-600 mt-1 truncate">
                                      Placeholder: {pregunta.placeholder}
                                    </div>
                                  )}
                                  {(pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR) && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      Peso: {pesoPreguntas === PesoPreguntaTipoPlantilla.IGUAL_VALOR ? valorPreguntaIgual : pregunta.peso}
                                    </div>
                                  )}
                                  {pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      <div className="font-medium">Baremo:</div>
                                      {pregunta.id_tipo === 3 && pregunta.peso !== null ? (
                                        <div>Valor único: {pregunta.peso}</div>
                                      ) : pregunta.baremo_detalle ? (
                                        <ul className="list-disc list-inside mt-1">
                                          {Object.entries(pregunta.baremo_detalle)
                                            .filter(([_, valor]) => typeof valor === 'number')
                                            .map(([opcion, valor]) => (
                                              <li key={opcion}>
                                                <span className="font-medium">{opcion}</span>: {valor as number}
                                              </li>
                                            ))}
                                        </ul>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-none flex space-x-2 w-[100px]">
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveQuestionUp(index)}
                                      disabled={index === 0}
                                      className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-30"
                                      aria-label="Mover pregunta arriba"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => moveQuestionDown(index)}
                                      disabled={index === preguntas.length - 1}
                                      className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-30"
                                      aria-label="Mover pregunta abajo"
                                    >
                                      ↓
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleEditQuestion(index)}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                    aria-label="Editar pregunta"
                                  >
                                    <Image
                                      className="m-auto w-[20px] h-[20px] cursor-pointer"
                                      src="/logos/icon_editar.svg"
                                      width={0}
                                      height={0}
                                      alt="Editar"
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                    aria-label="Eliminar pregunta"
                                  >
                                    <Image
                                      className="m-auto w-[20px] h-[20px] cursor-pointer"
                                      src="/logos/icon_eliminar.svg"
                                      width={0}
                                      height={0}
                                      alt="Eliminar"
                                    />
                                  </button>
                                </div>
                              </div>
                              
                              {pesoPreguntas === PesoPreguntaTipoPlantilla.BAREMO && 
                              pregunta.id_tipo !== 3 && // No mostrar advertencia para preguntas de texto corto
                              (!pregunta.baremo_detalle || Object.keys(pregunta.baremo_detalle).length === 0) && (
                                <div className="text-xs text-red-500 mt-1">
                                  ⚠️ Esta pregunta no tiene baremo configurado
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-full flex flex-col items-end p-1 border-t">
                      <button
                        onClick={handleAddQuestion}
                        className="px-3 py-1 bg-[#E0F8F0] rounded text-sm cursor-pointer hover:bg-[#c8f0e8] transition-colors"
                        aria-label="Agregar nueva pregunta"
                      >
                        Agregar Pregunta +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col h-[100px] sm:h-auto sm:flex-row sm:gap-2 justify-end space-x-3 pt-4">
              {isEditingPlantilla && onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar esta ${isTextAmin.toLowerCase()}?`)) {
                      onDelete();
                      onClose();
                    }
                  }}
                  className="w-full max-w-[180px] m-auto cursor-pointer p-2 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-10 hover:bg-gray-100"
                  aria-label={`Eliminar ${isTextAmin.toLowerCase()}`}
                >
                  Eliminar {isTextAmin}    
                  <Image
                    className="m-auto w-[20px] h-[20px] cursor-pointer"
                    src="/logos/icon_eliminar.svg"
                    width={0}
                    height={0}
                    alt="Eliminar"
                  />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full max-w-[180px] m-auto cursor-pointer p-2 px-10 hover:bg-blue-600 text-white text-sm rounded-md transition text-center bg-[#6DC7E4]"
                aria-label="Volver sin guardar"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
                className={`w-full max-w-[180px] m-auto cursor-pointer p-2 px-10 text-white text-sm rounded-md transition flex justify-center ${
                  isSubmitDisabled()
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#6DC7E4] hover:bg-blue-600'
                }`}
                aria-label={isEditingPlantilla ? `Actualizar ${isTextAmin.toLowerCase()}` : `Crear ${isTextAmin.toLowerCase()}`}
              >
                {isEditingPlantilla ? `Actualizar ${isTextAmin}` : `Crear ${isTextAmin}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ModalRegistrarInput
        isOpen={isModalRegistrarInputOpen}
        onClose={() => setIsModalRegistrarInputOpen(false)}
        onSave={handleSaveQuestion}
        initialData={currentQuestion}
        isEditing={currentQuestionIndex !== null}
        pesoPreguntaTipo={pesoPreguntas}
        valorPreguntaIgual={valorPreguntaIgual}
        tiposPregunta={TIPOS_PREGUNTA_DISPONIBLES}
      />
    </>
  );
};

export default ModalRegistraTestPlantilla;