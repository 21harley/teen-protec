import React, { useState, useEffect } from 'react';
import { TipoPreguntaNombre, PreguntaData, OpcionData } from './../../app/types/test/index';

interface ModalRegistrarInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: PreguntaData) => void;
  initialData?: PreguntaData | null;
  isEditing?: boolean;
}

const ModalRegistrarInput: React.FC<ModalRegistrarInputProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isEditing = false 
}) => {
  // Estados para los datos de la pregunta
  const [questionType, setQuestionType] = useState<TipoPreguntaNombre>(TipoPreguntaNombre.text);
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [options, setOptions] = useState<OpcionData[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [minValue, setMinValue] = useState<number | undefined>();
  const [maxValue, setMaxValue] = useState<number | undefined>();
  const [stepValue, setStepValue] = useState<number | undefined>();
  const [order, setOrder] = useState(1);
  
  const tipoPreguntaMap = {
    "text": 1,
    "radio": 2,
    "checkbox": 3,
    "select": 4,
    "range": 5
  };

  // Efecto para inicializar con datos existentes si se proporcionan
  useEffect(() => {
    if (initialData) {
      const tipoNombre = Object.keys(tipoPreguntaMap).find(
        key => tipoPreguntaMap[key as keyof typeof tipoPreguntaMap] === initialData.id_tipo
      ) as TipoPreguntaNombre;
      
      setQuestionType(tipoNombre);
      setQuestionText(initialData.texto_pregunta);
      setIsRequired(initialData.obligatoria || false);
      setPlaceholder(initialData.placeholder || '');
      setOptions(initialData.opciones || []);
      setMinValue(initialData.min);
      setMaxValue(initialData.max);
      setStepValue(initialData.paso);
      setOrder(initialData.orden);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setQuestionType(TipoPreguntaNombre.text);
    setQuestionText('');
    setIsRequired(false);
    setPlaceholder('');
    setOptions([]);
    setNewOptionText('');
    setMinValue(undefined);
    setMaxValue(undefined);
    setStepValue(undefined);
    setOrder(1);
  };

  const handleAddOption = () => {
    if (newOptionText.trim() === '') return;
    
    const newOption: OpcionData = {
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

    if ((questionType === TipoPreguntaNombre.radio || 
         questionType === TipoPreguntaNombre.checkbox || 
         questionType === TipoPreguntaNombre.select) && 
        options.length === 0) {
      alert('Por favor agregue al menos una opción para este tipo de pregunta');
      return;
    }

    if (questionType === TipoPreguntaNombre.range) {
      if (minValue === undefined || maxValue === undefined) {
        alert('Por favor especifique los valores mínimo y máximo para el rango');
        return;
      }
      if (minValue >= maxValue) {
        alert('El valor mínimo debe ser menor que el máximo');
        return;
      }
    }

    const questionData: PreguntaData = {
      ...(initialData || {}), // Mantener propiedades existentes si estamos editando
      texto_pregunta: questionText,
      id_tipo: tipoPreguntaMap[questionType],
      orden: order,
      obligatoria: isRequired,
      placeholder: placeholder || undefined,
      min: minValue,
      max: maxValue,
      paso: stepValue,
      opciones: (questionType === TipoPreguntaNombre.radio || 
                questionType === TipoPreguntaNombre.checkbox || 
                questionType === TipoPreguntaNombre.select) ? options : undefined
    };

    onSave(questionData);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto
                      ${isEditing ? 'border-l-4 border-blue-500' : 'border-l-4 border-green-500'}`}>
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? (
            <span className="text-blue-600">✏️ Editar Pregunta</span>
          ) : (
            <span className="text-green-600">➕ Agregar Pregunta</span>
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
            <option value={TipoPreguntaNombre.text}>Texto</option>
            <option value={TipoPreguntaNombre.radio}>Opción única (radio)</option>
            <option value={TipoPreguntaNombre.checkbox}>Opción múltiple (checkbox)</option>
            <option value={TipoPreguntaNombre.select}>Selección (dropdown)</option>
            <option value={TipoPreguntaNombre.range}>Rango</option>
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
        {questionType === TipoPreguntaNombre.text && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder (texto de ejemplo)
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Ej: Ingrese su respuesta aquí"
            />
          </div>
        )}
        
        {/* Opciones para radio, checkbox y select */}
        {(questionType === TipoPreguntaNombre.radio || 
          questionType === TipoPreguntaNombre.checkbox || 
          questionType === TipoPreguntaNombre.select) && (
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
                className={`px-4 py-2 text-white rounded-r ${
                  isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Agregar
              </button>
            </div>
            
            {options.length > 0 && (
              <div className="border rounded p-2">
                <h4 className="text-sm font-medium mb-2">Opciones agregadas:</h4>
                <ul className="space-y-2">
                  {options.map((option, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{option.texto}</span>
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Configuración de rango */}
        {questionType === TipoPreguntaNombre.range && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor mínimo *
              </label>
              <input
                type="number"
                value={minValue || ''}
                onChange={(e) => setMinValue(parseFloat(e.target.value))}
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
                onChange={(e) => setMaxValue(parseFloat(e.target.value))}
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
                onChange={(e) => setStepValue(parseFloat(e.target.value))}
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
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded ${
              isEditing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
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