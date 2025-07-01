import React, { useState, useEffect } from 'react';
import { PreguntaPlantillaBase, TestPlantilla, TestPlantillaInput, TestStatus } from './../../app/types/plantilla/index';
import { PreguntaData, TipoPreguntaNombre } from './../../app/types/test/index';
import ModalRegistrarInput from './../modalRegistrarInput/modalRegistrarInput';
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import Image from "next/image";

// Mapeo de tipos de pregunta para mostrar en la UI
const tipoDatos: Record<number, string> = {
  1: 'radio',
  2: 'checkbox',
  3: 'text',
  4: 'select',
  5: 'range'
};

const TIPO_PREGUNTA_DISPLAY: Record<TipoPreguntaNombre, string> = {
  [TipoPreguntaNombre.OPCION_MULTIPLE]: 'Opción única',
  [TipoPreguntaNombre.VERDADERO_FALSO]: 'Selección múltiple',
  [TipoPreguntaNombre.RESPUESTA_CORTA]: 'Texto corto',
  [TipoPreguntaNombre.SELECT]: 'Lista desplegable',
  [TipoPreguntaNombre.RANGO]: 'Rango numérico'
};

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
  const [preguntas, setPreguntas] = useState<PreguntaPlantillaBase[]>([]);
  const [isModalRegistrarInputOpen, setIsModalRegistrarInputOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PreguntaPlantillaBase | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isEditingPlantilla, setIsEditingPlantilla] = useState(false);
  const [psychologists, setPsychologists] = useState<PsicologoOption[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (plantillaToEdit) {
        setNombrePlantilla(plantillaToEdit.nombre);
        setPreguntas(plantillaToEdit.preguntas?.map(p => ({
          ...p,
          tipo: p.tipo || { 
            id: p.id_tipo, 
            nombre: Object.entries(tipoDatos).find(([id]) => Number(id) === p.id_tipo)?.[1] as TipoPreguntaNombre || TipoPreguntaNombre.RESPUESTA_CORTA,
            descripcion: null 
          }
        })) || []);
        setSelectedPsychologist(plantillaToEdit.id_psicologo || null);
        setIsEditingPlantilla(true);
      } else {
        resetForm();
      }

      if (isAdmin) {
        fetchPsychologists();
      }
    }
  }, [isOpen, plantillaToEdit, isAdmin]);

  const resetForm = () => {
    setNombrePlantilla('');
    setPreguntas([]);
    setSelectedPsychologist(null);
    setIsEditingPlantilla(false);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(null);
  };

  // Obtener lista de psicólogos desde la API
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

  // Convertir PreguntaData a PreguntaPlantillaBase manteniendo la compatibilidad
  const handleSaveQuestion = (pregunta: PreguntaData) => {
    const preguntaConvertida: PreguntaPlantillaBase = {
      texto_pregunta: pregunta.texto_pregunta,
      id_tipo: pregunta.id_tipo,
      orden: pregunta.orden,
      obligatoria: pregunta.obligatoria,
      placeholder: pregunta.placeholder || undefined,
      min: pregunta.min || undefined,
      max: pregunta.max || undefined,
      paso: pregunta.paso || undefined,
      opciones: pregunta.opciones
    };

    if (currentQuestionIndex !== null) {
      // Editar pregunta existente
      const updatedPreguntas = [...preguntas];
      updatedPreguntas[currentQuestionIndex] = preguntaConvertida;
      setPreguntas(updatedPreguntas);
    } else {
      // Agregar nueva pregunta
      const newPregunta = {
        ...preguntaConvertida,
        orden: preguntas.length + 1
      };
      setPreguntas([...preguntas, newPregunta]);
    }
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

    const plantillaData: TestPlantillaInput = {
      nombre: nombrePlantilla,
      preguntas: preguntas.map(p => ({
        ...p,
        placeholder: p.placeholder ?? undefined,
        min: p.min ?? undefined,
        max: p.max ?? undefined,
        paso: p.paso ?? undefined
      })),
      estado: isEditingPlantilla && plantillaToEdit 
        ? plantillaToEdit.estado 
        : TestStatus.NoIniciado,
      ...(isAdmin && selectedPsychologist !== null && {
        id_psicologo: selectedPsychologist
      })
    };
    
    onSubmit(plantillaData);
    onClose();
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
                        <div className="space-y-3 overflow-scroll h-full max-h-[300px]">
                          {preguntas.map((pregunta, index) => (
                            <div key={index} className="border rounded p-3 bg-gray-50 group hover:bg-gray-100">
                              <div className="flex justify-between items-start">
                                <div className="flex-grow pr-4 overflow-hidden">
                                  <div className="font-medium truncate">
                                    {pregunta.orden}. {pregunta.texto_pregunta}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Tipo: {TIPO_PREGUNTA_DISPLAY[
                                      Object.keys(TIPO_PREGUNTA_DISPLAY).find(
                                        key => Number(key) === pregunta.id_tipo
                                      ) as TipoPreguntaNombre
                                    ]} 
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
                                </div>
                                <div className="flex-none flex space-x-2 w-[60px]">
                                  <button
                                    onClick={() => handleEditQuestion(index)}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                    aria-label="Editar pregunta"
                                  >
                                    <Image
                                      className="m-auto w-[20px] h-[20px] cursor-pointer"
                                      src={IconLogoEditar}
                                      width={20}
                                      height={20}
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
                                      src={IconLogoCerrar}
                                      width={20}
                                      height={20}
                                      alt="Eliminar"
                                    />
                                  </button>
                                </div>
                              </div>
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
                    src={IconLogoCerrar}
                    width={20}
                    height={20}
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
                disabled={preguntas.length === 0 || !nombrePlantilla.trim() || (isAdmin && !selectedPsychologist)}
                className={`w-full max-w-[180px] m-auto cursor-pointer p-2 px-10 text-white text-sm rounded-md transition flex justify-center ${
                  preguntas.length === 0 || !nombrePlantilla.trim() || (isAdmin && !selectedPsychologist)
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
        initialData={currentQuestion as PreguntaData | null}
        isEditing={currentQuestionIndex !== null}
      />
    </>
  );
};

export default ModalRegistraTestPlantilla;