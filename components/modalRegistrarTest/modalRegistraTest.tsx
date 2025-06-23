import React, { useState, useEffect } from 'react';
import { TipoPreguntaNombre, PreguntaData, TestData } from './../../app/types/test/index';
import ModalRegistrarInput from './../modalRegistrarInput/modalRegistrarInput';

interface ModalRegistraTestProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testData: TestData) => void;
  testToEdit?: TestData | null;
}

const tipoPreguntaMap: { [key: string]: string } = {
  '1': 'OPCION_MULTIPLE',
  '2': 'VERDADERO_FALSO',
  '3': 'RESPUESTA_CORTA',
  // Agrega aquí los demás tipos según tu definición de TipoPreguntaNombre
};

const ModalRegistraTest: React.FC<ModalRegistraTestProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  testToEdit 
}) => {
  const [testName, setTestName] = useState('');
  const [questions, setQuestions] = useState<PreguntaData[]>([]);
  const [isModalRegistrarInputOpen, setIsModalRegistrarInputOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PreguntaData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isEditingTest, setIsEditingTest] = useState(false);

  // Resetear o cargar datos cuando se abre/cierra o cuando cambia testToEdit
  useEffect(() => {
    if (isOpen) {
      if (testToEdit) {
        setTestName(testToEdit.name);
        setQuestions(testToEdit.questions || []);
        setIsEditingTest(true);
      } else {
        setTestName('');
        setQuestions([]);
        setIsEditingTest(false);
      }
    }
  }, [isOpen, testToEdit]);

  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    setCurrentQuestionIndex(null);
    setIsModalRegistrarInputOpen(true);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setCurrentQuestionIndex(index);
    setIsModalRegistrarInputOpen(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    const reorderedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      orden: idx + 1
    }));
    setQuestions(reorderedQuestions);
  };

  const handleSaveQuestion = (question: PreguntaData) => {
    if (currentQuestionIndex !== null) {
      // Editar pregunta existente
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = question;
      setQuestions(updatedQuestions);
    } else {
      // Agregar nueva pregunta
      const newQuestion = {
        ...question,
        orden: questions.length + 1
      };
      setQuestions([...questions, newQuestion]);
    }
  };

  const handleSubmit = () => {
    if (!testName.trim()) {
      alert('Por favor ingrese un nombre para el test');
      return;
    }

    if (questions.length === 0) {
      alert('Debe agregar al menos una pregunta');
      return;
    }

    const testData: TestData = {
      ...(testToEdit || {}), // Mantener propiedades existentes si estamos editando
      name: testName,
      questions: questions,
      status: testToEdit?.status || 'draft' // Mantener estado o asignar 'draft' por defecto
    };

    onSubmit(testData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col
                        ${isEditingTest ? 'border-t-4 border-blue-500' : 'border-t-4 border-green-500'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {isEditingTest ? (
                <span className="text-blue-600">✏️ Editar Test</span>
              ) : (
                <span className="text-green-600">➕ Crear Nuevo Test</span>
              )}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Test *
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ingrese el nombre del test"
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Preguntas</h3>
                <button
                  onClick={handleAddQuestion}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  + Agregar Pregunta
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay preguntas agregadas aún
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50 group hover:bg-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {question.orden}. {question.texto_pregunta}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Tipo: {TipoPreguntaNombre[tipoPreguntaMap[question.id_tipo] as keyof typeof TipoPreguntaNombre]} | 
                            {question.obligatoria ? ' Obligatoria' : ' Opcional'}
                          </div>
                          {question.opciones && question.opciones.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Opciones: {question.opciones.map(opt => opt.texto).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditQuestion(index)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={questions.length === 0 || !testName.trim()}
              className={`px-4 py-2 rounded text-white ${
                questions.length === 0 || !testName.trim() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isEditingTest 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isEditingTest ? 'Actualizar Test' : 'Crear Test'}
            </button>
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

export default ModalRegistraTest;