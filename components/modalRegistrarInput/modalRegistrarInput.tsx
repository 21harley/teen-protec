import React, { useState, useEffect } from 'react';
import { 
  PreguntaData, 
  OpcionData, 
  TipoPregunta,
  TipoPreguntaNombre,
  PesoPreguntaTipo
} from './../../app/types/test/index';
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import Image from "next/image";
import { PreguntaPlantillaBase } from '@/app/types/plantilla';

interface ModalRegistrarInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: PreguntaData | PreguntaPlantillaBase) => void;
  initialData?: PreguntaData | null;
  isEditing?: boolean;
  pesoPreguntaTipo: PesoPreguntaTipo;
}

const tipoPreguntaMap: Record<TipoPreguntaNombre, number> = {
  [TipoPreguntaNombre.RADIO]: 1,
  [TipoPreguntaNombre.CHECKBOX]: 2,
  [TipoPreguntaNombre.TEXT]: 3,
  [TipoPreguntaNombre.SELECT]: 4,
  [TipoPreguntaNombre.RANGE]: 5
};

const reverseTipoPreguntaMap: Record<number, TipoPreguntaNombre> = {
  1: TipoPreguntaNombre.RADIO,
  2: TipoPreguntaNombre.CHECKBOX,
  3: TipoPreguntaNombre.TEXT,
  4: TipoPreguntaNombre.SELECT,
  5: TipoPreguntaNombre.RANGE
};

const ModalRegistrarInput: React.FC<ModalRegistrarInputProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isEditing = false,
  pesoPreguntaTipo = PesoPreguntaTipo.SIN_VALOR
}) => {
  // Estados para los datos de la pregunta
  const [questionType, setQuestionType] = useState<TipoPreguntaNombre>(TipoPreguntaNombre.TEXT);
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [options, setOptions] = useState<OpcionData[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const [stepValue, setStepValue] = useState<number | null>(null);
  const [order, setOrder] = useState(1);
  const [weight, setWeight] = useState<number | null>(null);
  const [baremoDetalle, setBaremoDetalle] = useState<any>(null);
  const [tipoPregunta, setTipoPregunta] = useState<TipoPregunta>({
    id: 3, // Default to TEXT
    nombre: TipoPreguntaNombre.TEXT,
    descripcion: null,
    tipo_respuesta: 'text'
  });

  // Efecto para inicializar con datos existentes si se proporcionan
  useEffect(() => {
    if (initialData) {
      const tipoNombre = reverseTipoPreguntaMap[initialData.id_tipo] || TipoPreguntaNombre.TEXT;
      
      setQuestionType(tipoNombre);
      setQuestionText(initialData.texto_pregunta);
      setIsRequired(initialData.obligatoria || false);
      setPlaceholder(initialData.placeholder || null);
      setOptions(initialData.opciones || []);
      setMinValue(initialData.min || null);
      setMaxValue(initialData.max || null);
      setStepValue(initialData.paso || null);
      setOrder(initialData.orden);
      setWeight(initialData.peso || null);
      setBaremoDetalle(initialData.baremo_detalle || null);
      setTipoPregunta(initialData.tipo || {
        id: initialData.id_tipo,
        nombre: tipoNombre,
        descripcion: null,
        tipo_respuesta: tipoNombre === TipoPreguntaNombre.RANGE ? 'number' : 'text'
      });
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setQuestionType(TipoPreguntaNombre.TEXT);
    setQuestionText('');
    setIsRequired(false);
    setPlaceholder(null);
    setOptions([]);
    setNewOptionText('');
    setMinValue(null);
    setMaxValue(null);
    setStepValue(null);
    setOrder(1);
    setWeight(null);
    setBaremoDetalle(null);
    setTipoPregunta({
      id: 3,
      nombre: TipoPreguntaNombre.TEXT,
      descripcion: null,
      tipo_respuesta: 'text'
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

    if ((questionType === TipoPreguntaNombre.RADIO || 
         questionType === TipoPreguntaNombre.CHECKBOX || 
         questionType === TipoPreguntaNombre.SELECT) && 
        options.length === 0) {
      alert('Por favor agregue al menos una opción para este tipo de pregunta');
      return;
    }

    if (questionType === TipoPreguntaNombre.RANGE) {
      if (minValue === null || maxValue === null) {
        alert('Por favor especifique los valores mínimo y máximo para el rango');
        return;
      }
      if (minValue >= maxValue) {
        alert('El valor mínimo debe ser menor que el máximo');
        return;
      }
    }

    // Validar peso según el tipo de ponderación
    if (pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR && weight === null) {
      alert('Por favor especifique el peso de la pregunta');
      return;
    }

    // Para baremo, validar que las opciones tengan peso si es necesario
    if (pesoPreguntaTipo === PesoPreguntaTipo.BAREMO && 
        (questionType === TipoPreguntaNombre.RADIO || 
         questionType === TipoPreguntaNombre.CHECKBOX || 
         questionType === TipoPreguntaNombre.SELECT)) {
      // Aquí podrías agregar validación adicional para el baremo si es necesario
    }

    const questionData: PreguntaData = {
      ...(initialData || {}),
      id: initialData?.id,
      texto_pregunta: questionText,
      id_tipo: tipoPreguntaMap[questionType],
      orden: order,
      obligatoria: isRequired,
      placeholder: placeholder,
      min: minValue,
      max: maxValue,
      paso: stepValue,
      peso: pesoPreguntaTipo !== PesoPreguntaTipo.SIN_VALOR ? weight : null,
      baremo_detalle: pesoPreguntaTipo === PesoPreguntaTipo.BAREMO ? baremoDetalle : null,
      opciones: (questionType === TipoPreguntaNombre.CHECKBOX || 
                questionType === TipoPreguntaNombre.RADIO || 
                questionType === TipoPreguntaNombre.SELECT) ? options : undefined,
      tipo: {
        id: tipoPreguntaMap[questionType],
        nombre: questionType,
        descripcion: null,
        tipo_respuesta: questionType === TipoPreguntaNombre.RANGE ? 'number' : 'text'
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
          {isEditing ? "Editar Pregunta" : "Agregar Pregunta"}
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
            <option value={TipoPreguntaNombre.TEXT}>Texto</option>
            <option value={TipoPreguntaNombre.CHECKBOX}>Opción múltiple (checkbox)</option>
            <option value={TipoPreguntaNombre.RADIO}>Opción única (radio)</option>
            <option value={TipoPreguntaNombre.SELECT}>Selección (dropdown)</option>
            <option value={TipoPreguntaNombre.RANGE}>Rango</option>
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
        
        {/* Peso (si aplica) */}
        {pesoPreguntaTipo !== PesoPreguntaTipo.SIN_VALOR && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso de la pregunta {pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR ? '*' : ''}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={pesoPreguntaTipo === PesoPreguntaTipo.BAREMO}
              required={pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR}
            />
            {pesoPreguntaTipo === PesoPreguntaTipo.BAREMO && (
              <p className="text-sm text-gray-500 mt-1">
                El peso se calculará según el baremo configurado
              </p>
            )}
          </div>
        )}
        
        {/* Configuración de baremo para preguntas con opciones */}
        {pesoPreguntaTipo === PesoPreguntaTipo.BAREMO && 
          (questionType === TipoPreguntaNombre.RADIO || 
           questionType === TipoPreguntaNombre.CHECKBOX || 
           questionType === TipoPreguntaNombre.SELECT) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuración de Baremo (opcional)
            </label>
            <textarea
              value={baremoDetalle || ''}
              onChange={(e) => setBaremoDetalle(e.target.value || null)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Ingrese la configuración del baremo en formato JSON"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Para preguntas con opciones, especifique el peso de cada opción en formato JSON.
            </p>
          </div>
        )}
        
        {/* Placeholder (solo para texto) */}
        {questionType === TipoPreguntaNombre.TEXT && (
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
        {(questionType === TipoPreguntaNombre.CHECKBOX || 
          questionType === TipoPreguntaNombre.RADIO || 
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
                className="px-4 py-2 text-white rounded-r bg-blue-600 hover:bg-blue-700"
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
        {questionType === TipoPreguntaNombre.RANGE && (
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
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-white rounded bg-blue-500 hover:bg-blue-600"
          >
            {isEditing ? 'Actualizar' : 'Agregar'} Pregunta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarInput;