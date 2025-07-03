import React, { useState, useEffect } from 'react';
import { 
  PreguntaData, 
  OpcionData, 
  TipoPregunta,
  TipoPreguntaNombre
} from './../../app/types/test/index';
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import Image from "next/image";

interface ModalRegistrarInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: PreguntaData) => void;
  initialData?: PreguntaData | null;
  isEditing?: boolean;
}

const tipoPreguntaMap: Record<TipoPreguntaNombre, number> = {
  [TipoPreguntaNombre.OPCION_MULTIPLE]: 1,
  [TipoPreguntaNombre.OPCION_UNICA]: 2,
  [TipoPreguntaNombre.RESPUESTA_CORTA]: 3,
  [TipoPreguntaNombre.SELECT]: 4,
  [TipoPreguntaNombre.RANGO]: 5
};

const reverseTipoPreguntaMap: Record<number, TipoPreguntaNombre> = {
  1: TipoPreguntaNombre.OPCION_MULTIPLE,
  2: TipoPreguntaNombre.OPCION_UNICA,
  3: TipoPreguntaNombre.RESPUESTA_CORTA,
  4: TipoPreguntaNombre.SELECT,
  5: TipoPreguntaNombre.RANGO
};

const ModalRegistrarInput: React.FC<ModalRegistrarInputProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isEditing = false 
}) => {
  // Estados para los datos de la pregunta
  const [questionType, setQuestionType] = useState<TipoPreguntaNombre>(TipoPreguntaNombre.RESPUESTA_CORTA);
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [options, setOptions] = useState<OpcionData[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const [stepValue, setStepValue] = useState<number | null>(null);
  const [order, setOrder] = useState(1);
  const [tipoPregunta, setTipoPregunta] = useState<TipoPregunta>({
    id: 3, // Default to RESPUESTA_CORTA
    nombre: TipoPreguntaNombre.RESPUESTA_CORTA,
    descripcion: null
  });

  // Efecto para inicializar con datos existentes si se proporcionan
  useEffect(() => {
    if (initialData) {
      const tipoNombre = reverseTipoPreguntaMap[initialData.id_tipo] || TipoPreguntaNombre.RESPUESTA_CORTA;
      
      setQuestionType(tipoNombre);
      setQuestionText(initialData.texto_pregunta);
      setIsRequired(initialData.obligatoria || false);
      setPlaceholder(initialData.placeholder || null);
      setOptions(initialData.opciones || []);
      setMinValue(initialData.min || null);
      setMaxValue(initialData.max || null);
      setStepValue(initialData.paso || null);
      setOrder(initialData.orden);
      setTipoPregunta(initialData.tipo);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setQuestionType(TipoPreguntaNombre.RESPUESTA_CORTA);
    setQuestionText('');
    setIsRequired(false);
    setPlaceholder(null);
    setOptions([]);
    setNewOptionText('');
    setMinValue(null);
    setMaxValue(null);
    setStepValue(null);
    setOrder(1);
    setTipoPregunta({
      id: 3,
      nombre: TipoPreguntaNombre.RESPUESTA_CORTA,
      descripcion: null
    });
  };

  const handleAddOption = () => {
    if (newOptionText.trim() === '') return;
    
    const newOption: OpcionData = {
      id: options.length + 1, // Temporal ID until saved
      texto: newOptionText,
      valor: newOptionText.toLowerCase().replace(/\s+/g, '_'),
      orden: options.length + 1,
      es_otro: false
    };
    
    setOptions([...options, newOption]);
    setNewOptionText('');
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    // Reordenar las opciones restantes
    const reorderedOptions = newOptions.map((opt, idx) => ({
      ...opt,
      orden: idx + 1
    }));
    setOptions(reorderedOptions);
  };

  const handleSubmit = () => {
    if (questionText.trim() === '') {
      alert('Por favor ingrese el texto de la pregunta');
      return;
    }
    if ((questionType === TipoPreguntaNombre.OPCION_UNICA) && 
        options.length === 0) {
      alert('Por favor agregue  una opción para este tipo de pregunta');
      return;
    }

    if ((questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
         questionType === TipoPreguntaNombre.SELECT) && 
        options.length === 0) {
      alert('Por favor agregue al menos una opción para este tipo de pregunta');
      return;
    }

    if (questionType === TipoPreguntaNombre.RANGO) {
      if (minValue === null || maxValue === null) {
        alert('Por favor especifique los valores mínimo y máximo para el rango');
        return;
      }
      if (minValue >= maxValue) {
        alert('El valor mínimo debe ser menor que el máximo');
        return;
      }
    }

    const questionData: PreguntaData = {
      ...(initialData || {}),
      id: initialData?.id || 0, // Temporal ID if new
      texto_pregunta: questionText,
      id_tipo: tipoPreguntaMap[questionType],
      orden: order,
      obligatoria: isRequired,
      placeholder: placeholder,
      min: minValue,
      max: maxValue,
      paso: stepValue,
      opciones: (questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
                questionType === TipoPreguntaNombre.OPCION_UNICA || 
                questionType === TipoPreguntaNombre.SELECT) ? options : undefined,
      tipo: {
        id: tipoPreguntaMap[questionType],
        nombre: questionType,
        descripcion: null
      }
    };

    onSave(questionData);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center z-50 w-full h-full">
      <div className={`bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <h2 className="text-xl font-medium mb-4">
          {isEditing ? (
            <span>Editar Pregunta</span>
          ) : (
            <span>Agregar Pregunta</span>
          )}
        </h2>
        
        {/* Tipo de pregunta */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de pregunta
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as TipoPreguntaNombre)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value={TipoPreguntaNombre.RESPUESTA_CORTA}>Texto</option>
            <option value={TipoPreguntaNombre.OPCION_MULTIPLE}>Opción múltiple (checkbox)</option>
            <option value={TipoPreguntaNombre.OPCION_UNICA}>Opción única (radio)</option>
            <option value={TipoPreguntaNombre.SELECT}>Selección (dropdown)</option>
            <option value={TipoPreguntaNombre.RANGO}>Rango</option>
          </select>
        </div>
        
        {/* Texto de la pregunta */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texto de la pregunta *
          </label>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Ingrese la pregunta"
            required
          />
        </div>
        
        {/* Orden */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orden de la pregunta
          </label>
          <input
            type="number"
            min="1"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {/* Obligatoria */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="isRequired"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
            Pregunta obligatoria
          </label>
        </div>
        
        {/* Placeholder (solo para texto) */}
        {questionType === TipoPreguntaNombre.RESPUESTA_CORTA && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder (texto de ejemplo)
            </label>
            <input
              type="text"
              value={placeholder || ''}
              onChange={(e) => setPlaceholder(e.target.value || null)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Ej: Ingrese su respuesta aquí"
            />
          </div>
        )}
        
        {/* Opciones para radio, checkbox y select */}
        {(questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
          questionType === TipoPreguntaNombre.OPCION_UNICA || 
          questionType === TipoPreguntaNombre.SELECT) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opciones de respuesta *
            </label>
            
            <div className="flex mb-2">
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l"
                placeholder="Ingrese una opción"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <button
                onClick={handleAddOption}
                className={`px-4 py-2 text-white rounded-r bg-blue-600 hover:bg-blue-700`}
              >
                Agregar
              </button>
            </div>
            
            {options.length > 0 && (
              <div className="border rounded p-2">
                <h4 className="text-sm font-medium mb-2">Opciones agregadas:</h4>
                <ul className="space-y-2 overflow-scroll h-full max-h-[150px]">
                  {options.map((option, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-black rounded-[5px]">
                      <span>{option.texto}</span>
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Image
                          className="m-auto w-[20px] h-[20px] cursor-pointer"
                          src={IconLogoCerrar}
                          width={20}
                          height={20}
                          alt="Eliminar"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Configuración de rango */}
        {questionType === TipoPreguntaNombre.RANGO && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor mínimo *
              </label>
              <input
                type="number"
                value={minValue || ''}
                onChange={(e) => setMinValue(parseFloat(e.target.value) || null)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor máximo *
              </label>
              <input
                type="number"
                value={maxValue || ''}
                onChange={(e) => setMaxValue(parseFloat(e.target.value) || null)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paso (incremento)
              </label>
              <input
                type="number"
                value={stepValue || ''}
                onChange={(e) => setStepValue(parseFloat(e.target.value) || null)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="1"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded cursor-pointer ${
              'bg-blue-500 hover:bg-blue-600' 
            }`}
          >
            {isEditing ? 'Actualizar' : 'Agregar'} Pregunta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarInput;