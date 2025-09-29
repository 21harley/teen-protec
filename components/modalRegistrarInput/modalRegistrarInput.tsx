import React, { useState, useEffect } from 'react';
import { 
  PreguntaData, 
  OpcionData, 
  TipoPregunta,
  TipoPreguntaNombre,
  PesoPreguntaTipo
} from './../../app/types/test/index';
import Image from "next/image";
import { PesoPreguntaTipoPlantilla, PreguntaPlantillaBase, TipoPreguntaPlantilla } from '@/app/types/plantilla';

interface ModalRegistrarInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: PreguntaData | PreguntaPlantillaBase) => void;
  initialData?: PreguntaData | null;
  isEditing?: boolean;
  pesoPreguntaTipo: PesoPreguntaTipo | PesoPreguntaTipoPlantilla;
  valorPreguntaIgual?: number | null;
  tiposPregunta?: TipoPregunta[] | TipoPreguntaPlantilla[];
}

const tipoPreguntaMap: Record<TipoPreguntaNombre, number> = {
  [TipoPreguntaNombre.OPCION_UNICA]: 1,
  [TipoPreguntaNombre.OPCION_MULTIPLE]: 2,
  [TipoPreguntaNombre.RESPUESTA_CORTA]: 3,
  [TipoPreguntaNombre.SELECT]: 4,
  [TipoPreguntaNombre.RANGO]: 5
};

const reverseTipoPreguntaMap: Record<number, TipoPreguntaNombre> = {
  1: TipoPreguntaNombre.OPCION_UNICA,
  2: TipoPreguntaNombre.OPCION_MULTIPLE,
  3: TipoPreguntaNombre.RESPUESTA_CORTA,
  4: TipoPreguntaNombre.SELECT,
  5: TipoPreguntaNombre.RANGO
};

const ModalRegistrarInput: React.FC<ModalRegistrarInputProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isEditing = false,
  pesoPreguntaTipo = PesoPreguntaTipo.SIN_VALOR,
  valorPreguntaIgual = null,
  tiposPregunta = []
}) => {
  // Estados para los datos de la pregunta
  const [questionType, setQuestionType] = useState<TipoPreguntaNombre>(TipoPreguntaNombre.RESPUESTA_CORTA);
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [options, setOptions] = useState<OpcionData[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionValue, setNewOptionValue] = useState<number | null>(null);
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const [stepValue, setStepValue] = useState<number | null>(null);
  const [order, setOrder] = useState(1);
  const [weight, setWeight] = useState<number | null>(null);

  // Determinar el peso según el tipo de ponderación
  const currentWeight = pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR ? valorPreguntaIgual : weight;

  // Efecto para inicializar con datos existentes
  useEffect(() => {
    if (initialData) {
      const tipoNombre = reverseTipoPreguntaMap[initialData.id_tipo] || TipoPreguntaNombre.RESPUESTA_CORTA;
      
      setQuestionType(tipoNombre);
      setQuestionText(initialData.texto_pregunta);
      setIsRequired(initialData.obligatoria || false);
      setPlaceholder(initialData.placeholder || null);
      
      const loadedOptions = initialData.opciones || [];
      setOptions(loadedOptions);
      
      setMinValue(initialData.min || null);
      setMaxValue(initialData.max || null);
      setStepValue(initialData.paso || null);
      setOrder(initialData.orden);
      
      // Manejar peso según el tipo de ponderación
      if (pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR) {
        setWeight(valorPreguntaIgual);
      } else if (pesoPreguntaTipo === PesoPreguntaTipo.BAREMO) {
        setWeight(initialData.peso || null);
      }
    } else {
      resetForm();
    }
  }, [initialData, isOpen, pesoPreguntaTipo, valorPreguntaIgual]);

  const resetForm = () => {
    setQuestionType(TipoPreguntaNombre.RESPUESTA_CORTA);
    setQuestionText('');
    setIsRequired(false);
    setPlaceholder(null);
    setOptions([]);
    setNewOptionText('');
    setNewOptionValue(null);
    setMinValue(null);
    setMaxValue(null);
    setStepValue(null);
    setOrder(1);
    setWeight(pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR ? valorPreguntaIgual : null);
  };

  const handleAddOption = () => {
    if (newOptionText.trim() === '') return;
    
    const newOption: OpcionData = {
      id: options.length + 1,
      texto: newOptionText,
      valor: newOptionValue?.toString() ?? "",
      orden: options.length + 1,
      es_otro: false,
      valor_baremo: newOptionValue || 0
    };
    
    setOptions([...options, newOption]);
    setNewOptionText('');
    setNewOptionValue(null);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions.map((opt, idx) => ({
      ...opt,
      orden: idx + 1
    })));
  };

  const handleUpdateOptionValue = (index: number, value: number) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      valor_baremo: value
    };
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (questionText.trim() === '') {
      alert('Por favor ingrese el texto de la pregunta');
      return;
    }

    if ((questionType === TipoPreguntaNombre.OPCION_UNICA || 
         questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
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

    // Validaciones para Baremo e Igual Valor
    if (pesoPreguntaTipo === PesoPreguntaTipo.BAREMO || pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR) {
      // Validar peso para respuesta corta
      if (questionType === TipoPreguntaNombre.RESPUESTA_CORTA && !currentWeight) {
        alert('Por favor ingrese un peso válido para la pregunta');
        return;
      }

      // Validar opciones para preguntas múltiples
      if (questionType === TipoPreguntaNombre.OPCION_UNICA || 
          questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
          questionType === TipoPreguntaNombre.SELECT) {
        
        if (!currentWeight) {
          alert('El peso de la pregunta no está definido');
          return;
        }

        const hasOptionWithFullWeight = options.some(opt => opt.valor_baremo === currentWeight);
        if (!hasOptionWithFullWeight) {
          alert(`Al menos una opción debe tener el valor igual al peso total de la pregunta (${currentWeight})`);
          return;
        }
      }
    }

    // Transformar valores a texto solo al guardar
    const optionsToSave = options.map(opt => ({
      ...opt,
      valor: opt.valor_baremo?.toString() ?? ""
    }));

    // Preparar baremo_detalle
    let baremoDetalle = null;
    if (pesoPreguntaTipo === PesoPreguntaTipo.BAREMO || pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR) {
      if (questionType === TipoPreguntaNombre.RESPUESTA_CORTA) {
        baremoDetalle = currentWeight;
      } else if (questionType === TipoPreguntaNombre.OPCION_UNICA || 
                 questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
                 questionType === TipoPreguntaNombre.SELECT) {
        baremoDetalle = optionsToSave.reduce((acc, opt) => {
          acc[opt.valor] = opt.valor_baremo !== undefined ? opt.valor_baremo : 0;
          return acc;
        }, {} as Record<string, number>);
      }
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
      peso: currentWeight,
      baremo_detalle: baremoDetalle,
      opciones: (questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
                questionType === TipoPreguntaNombre.OPCION_UNICA || 
                questionType === TipoPreguntaNombre.SELECT) ? optionsToSave : undefined,
      tipo: {
        id: tipoPreguntaMap[questionType],
        nombre: questionType,
        descripcion: null,
        tipo_respuesta: questionType === TipoPreguntaNombre.RANGO ? 'number' : 'text'
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
            onChange={(e) => {
              const newType = e.target.value as TipoPreguntaNombre;
              setQuestionType(newType);
              if (!initialData && newType !== questionType) {
                setOptions([]);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {tiposPregunta.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre}>
                {tipo.descripcion}
              </option>
            ))}
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
        
        {/* Peso de la pregunta (solo para Baremo) */}
        {pesoPreguntaTipo === PesoPreguntaTipo.BAREMO && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso total de la pregunta *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        )}
        
        {/* Peso fijo (para Igual Valor) */}
        {pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso de la pregunta
            </label>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-medium">{valorPreguntaIgual}</p>
              {(questionType === TipoPreguntaNombre.OPCION_UNICA || 
                questionType === TipoPreguntaNombre.OPCION_MULTIPLE || 
                questionType === TipoPreguntaNombre.SELECT) && (
                <p className="text-xs text-gray-500 mt-1">
                  * Al menos una opción debe tener este valor
                </p>
              )}
            </div>
          </div>
        )}
        
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
            
            {/* Formulario para agregar nueva opción */}
            <div className="flex mb-2 gap-2">
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Ingrese una opción"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              
              {/* Campo para valor de opción (solo para Baremo e Igual Valor) */}
              {(pesoPreguntaTipo === PesoPreguntaTipo.BAREMO || pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR) && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newOptionValue || ''}
                  onChange={(e) => setNewOptionValue(parseFloat(e.target.value) || null)}
                  className="w-20 p-2 border border-gray-300 rounded"
                  placeholder="Valor"
                />
              )}
              
              <button
                onClick={handleAddOption}
                className="px-4 py-2 text-white rounded-r bg-blue-600 hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            
            {/* Lista de opciones */}
            {options.length > 0 && (
              <div className="border rounded p-2">
                <h4 className="text-sm font-medium mb-2">Opciones agregadas:</h4>
                <ul className="space-y-2 overflow-scroll h-full max-h-[150px]">
                  {options.map((option, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-black rounded-[5px]">
                      <div className="flex-grow">
                        <span>{option.texto}</span>
                        {(pesoPreguntaTipo === PesoPreguntaTipo.BAREMO || pesoPreguntaTipo === PesoPreguntaTipo.IGUAL_VALOR) && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs text-gray-500 mr-2">Valor:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={option.valor_baremo !== undefined ? option.valor_baremo : 0}
                              onChange={(e) => handleUpdateOptionValue(index, parseFloat(e.target.value) || 0)}
                              className="w-16 p-1 text-xs border border-gray-300 rounded"
                            />
                            {currentWeight !== null && option.valor_baremo === currentWeight && (
                              <span className="ml-2 text-xs text-green-600">(Máximo)</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Image
                          className="m-auto w-[20px] h-[20px] cursor-pointer"
                          src="/logos/icon_eliminar.svg"
                          width={0}
                          height={0}
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