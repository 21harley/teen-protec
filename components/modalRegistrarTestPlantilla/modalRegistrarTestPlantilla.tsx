import React, { useState, useEffect } from 'react';
import { PreguntaPlantillaBase, TestPlantilla, TestPlantillaInput, TestStatus } from './../../app/types/plantilla/index';
import ModalRegistrarInput from './../modalRegistrarInput/modalRegistrarInput';
import IconLogoTexto from "./../../app/public/logos/logo_texto.svg";
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import Image from "next/image";

// Definición del enum de tipos de pregunta
enum TipoPreguntaNombre {
  Radio = 'radio',
  Checkbox = 'checkbox',
  Text = 'text',
  Select = 'select',
  Range = 'range'
}

const tipoDatos: Record<number, string> = {
  1: 'radio',
  2: 'checkbox',
  3: 'text',
  4: 'select',
  5: 'range'
};

// Mapeo para mostrar nombres más descriptivos en la UI
const TIPO_PREGUNTA_DISPLAY: Record<TipoPreguntaNombre, string> = {
  [TipoPreguntaNombre.Radio]: 'Opción única',
  [TipoPreguntaNombre.Checkbox]: 'Selección múltiple',
  [TipoPreguntaNombre.Text]: 'Texto corto',
  [TipoPreguntaNombre.Select]: 'Lista desplegable',
  [TipoPreguntaNombre.Range]: 'Rango numérico'
};

interface ModalRegistraPlantillaProps {
  isOpen: boolean;
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
  plantillaToEdit 
}) => {
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [preguntas, setPreguntas] = useState<PreguntaPlantillaBase[]>([]);
  const [isModalRegistrarInputOpen, setIsModalRegistrarInputOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PreguntaPlantillaBase | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isEditingPlantilla, setIsEditingPlantilla] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (plantillaToEdit) {
        console.log(plantillaToEdit)
        setNombrePlantilla(plantillaToEdit.nombre);
        setPreguntas(plantillaToEdit.preguntas?.map(p => ({
          ...p,
          tipo: p.tipo // Asegurar el tipo correcto
        })) || []);
        setIsEditingPlantilla(true);
      } else {
        setNombrePlantilla('');
        setPreguntas([]);
        setIsEditingPlantilla(false);
      }
    }
  }, [isOpen, plantillaToEdit]);

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

  const handleSaveQuestion = (pregunta: PreguntaPlantillaBase) => {
    if (currentQuestionIndex !== null) {
      const updatedPreguntas = [...preguntas];
      updatedPreguntas[currentQuestionIndex] = pregunta;
      setPreguntas(updatedPreguntas);
    } else {
      const newPregunta = {
        ...pregunta,
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

    const plantillaData: TestPlantillaInput = {
      nombre: nombrePlantilla,
      preguntas: preguntas,
      estado: isEditingPlantilla && plantillaToEdit 
        ? plantillaToEdit.estado 
        : TestStatus.NoIniciado,
    };
    
    onSubmit(plantillaData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 w-full h-full">
        <div className={`bg-white rounded-lg p-6 w-full max-w-[800px] max-h-[600px] flex flex-col`}>
          <div className="w-full flex justify-end">
            <button onClick={onClose} className="text-black hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className='w-full max-w-[600px] p-2 m-auto'>
            <div>
              <Image
                className="m-auto w-[200px] h-[100px] right-0 button-[5px] top-[-30px]"
                src={IconLogoTexto}
                width={180}
                height={90}
                alt="Logo"
              />
              <h2 className="text-xl font-medium">
                {isEditingPlantilla ? "Editar Test" : "Crear Nueva Test"}
              </h2>
              <hr className="w-full max-h-[600px] h-[1px] bg-black" />
            </div>
            
            <div className="flex-1  mt-4">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del test*
                </label>
                <input
                  type="text"
                  value={nombrePlantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Ingrese el nombre de la plantilla"
                  required
                />
              </div>
              
<div className="mb-4">
  <div className="flex justify-between items-start flex-col mb-2">
    <h3 className="text-lg font-medium mb-2">Preguntas</h3>
    <div className='border rounded-2xl w-full flex flex-col' style={{ minHeight: '150px', maxHeight: '200px' }}>
      <div className='p-2 overflow-y-auto flex-grow'>
        {preguntas.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No hay preguntas agregadas aún
          </div>
        ) : (
          <div className="space-y-3">
            {preguntas.map((pregunta, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50 group hover:bg-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4 overflow-hidden">
                    <div className="font-medium truncate">
                      {pregunta.orden}. {pregunta.texto_pregunta}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Tipo: {tipoDatos[pregunta.id_tipo]} 
                      {pregunta.obligatoria ? ' Obligatoria' : ' Opcional'}
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
      <div className='w-full flex flex-col items-end p-2 border-t'>
        <button
          onClick={handleAddQuestion}
          className="px-3 py-1 bg-[#E0F8F0] rounded text-sm cursor-pointer"
        >
          Agregar Pregunta +
        </button>
      </div>
    </div>
  </div>
</div>
            </div>
            
            <div className="flex flex-col h-[150px] sm:h-auto sm:flex-row sm:gap-4 justify-end space-x-3 pt-4">
              {isEditingPlantilla && onDelete && (
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
                      onDelete();
                      onClose();
                    }
                  }}
                  className="w-full max-w-[180px] m-auto cursor-pointer p-2 text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-10"
                >
                  Eliminar Test    
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
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={preguntas.length === 0 || !nombrePlantilla.trim()}
                className={`w-full max-w-[180px] m-auto cursor-pointer p-2 px-10 text-white text-sm rounded-md transition flex justify-between gap-1 ${
                  preguntas.length === 0 || !nombrePlantilla.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#6DC7E4] hover:bg-blue-600' 
                }`}
              >
                {isEditingPlantilla ? 'Actualizar Test' : 'Crear Test'}
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
      />
    </>
  );
};

export default ModalRegistraTestPlantilla;