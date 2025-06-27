import React, { useState, useEffect } from 'react';
import { TipoPreguntaNombre, PreguntaData, TestData } from './../../app/types/test/index';
import ModalRegistrarInput from './../modalRegistrarInput/modalRegistrarInput';
import IconLogoTexto from "./../../app/public/logos/logo_texto.svg";
import IconLogoCerrar from "./../../app/public/logos/icon_eliminar.svg";
import IconLogoEditar from "./../../app/public/logos/icon_editar.svg";
import Image from "next/image";

interface ModalRegistraTestProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testData: TestData) => void;
  onDelete?: () => void; // Nueva prop para manejar eliminación
  testToEdit?: TestData | null;
}

const tipoPreguntaMap: { [key: string]: string } = {
  '1': 'OPCION_MULTIPLE',
  '2': 'VERDADERO_FALSO',
  '3': 'RESPUESTA_CORTA',
};

const ModalRegistraTest: React.FC<ModalRegistraTestProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  testToEdit 
}) => {
  const [testName, setTestName] = useState('');
  const [questions, setQuestions] = useState<PreguntaData[]>([]);
  const [isModalRegistrarInputOpen, setIsModalRegistrarInputOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PreguntaData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isEditingTest, setIsEditingTest] = useState(false);

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
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = question;
      setQuestions(updatedQuestions);
    } else {
      const newQuestion = {
        ...question,
        orden: questions.length + 1
      };
      setQuestions([...questions, newQuestion]);
    }
  };

const handleSubmit = () => {
  if (!testName.trim()) {
    alert('Por favor ingrese un nombre para la plantilla');
    return;
  }

  if (questions.length === 0) {
    alert('Debe agregar al menos una pregunta');
    return;
  }

  const testData: TestData = {
    name: testName,
    questions: questions,
  };

  onSubmit(testData);
  onClose();
};

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#E0F8F0] bg-opacity-50 flex items-center justify-center z-50 w-full h-full">
        <div className={`bg-white rounded-lg p-6 w-full max-w-[800px] max-h-[90vh] flex flex-col`}>
          <div className="w-full flex justify-end ">
            <button onClick={onClose} className="text-black hover:text-gray-700 cursor-pointer">
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
              {isEditingTest ? (
                <span > Editar Test</span>
              ) : (
                <span > Crear Nuevo Test</span>
              )}
            </h2>
              <hr className="w-full max-h-[600px] h-[1px] bg-black" />
          </div>
          
          <div className="flex-1 overflow-y-auto mt-4">
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
              <div className="flex justify-between items-start flex-col  mb-2">
                <h3 className="text-lg font-medium ">Preguntas</h3>
                <div className='border rounded-2xl w-full'>
                  <div className='p-2'>
                    {questions.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No hay preguntas agregadas aún
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-scroll h-full max-h-[300px]">
                        {questions.map((question, index) => (
                          <div key={index} className="border rounded p-3 bg-gray-50 group hover:bg-gray-100">
                            <div className="flex justify-between items-start">
                              <div className="flex-grow pr-4 overflow-hidden">
                                <div className="font-medium truncate">
                                  {question.orden}. {question.texto_pregunta}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Tipo: {TipoPreguntaNombre[tipoPreguntaMap[question.id_tipo] as keyof typeof TipoPreguntaNombre]} | 
                                  {question.obligatoria ? ' Obligatoria' : ' Opcional'}
                                </div>
                                {question.opciones && question.opciones.length > 0 && (
                                  <div className="text-sm text-gray-600 mt-1 truncate">
                                    Opciones: {question.opciones.map(opt => opt.texto).join(', ')}
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
                  <div className='w-full flex flex-col items-end p-2'>
                    <button
                      onClick={handleAddQuestion}
                      className="px-3 py-1 bg-[#E0F8F0]  rounded text-sm cursor-pointer"
                    >
                      Agregar Pregunta + 
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col h-[150px] sm:h-auto sm:flex-row sm:gap-4 justify-end space-x-3 pt-4">
            {isEditingTest && onDelete && (
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar este test?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="w-full max-w-[180px] m-auto cursor-pointer p-2   text-black-700 border border-black text-sm rounded-md transition flex justify-between gap-10"
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
              className="w-full max-w-[180px] m-auto cursor-pointer p-2 px-10  hover:bg-blue-600  text-white  text-sm rounded-md transition text-center bg-[#6DC7E4]"
            >
              Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={questions.length === 0 || !testName.trim()}
              className={`w-full max-w-[180px] m-auto cursor-pointer p-2 px-10   text-white  text-sm rounded-md transition flex justify-between gap-1 ${
                questions.length === 0 || !testName.trim() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#6DC7E4] hover:bg-blue-600' 
              }`}
            >
              {isEditingTest ? 'Actualizar Test' : 'Crear Test'}
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

export default ModalRegistraTest;