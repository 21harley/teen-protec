import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
  Modal,
  Button,
  Row,
  Col,
  Card,
  Space,
  Divider,
  Skeleton,
  Descriptions
} from 'antd';
import moment from 'moment';
import { UserInfo } from 'os';
import { UsuarioInfo } from '@/app/types/user';

interface Cita {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  id_psicologo: number;
  id_paciente?: number;
  id_tipo_cita?: number;
  duracion_real?: number;
  notas_psicologo?: string;
  psicologo: {
    id: number;
    nombre: string;
  };
  paciente?: {
    id: number;
    nombre: string;
    cedula?: string;
  };
  tipo?: {
    id: number;
    nombre: string;
    color_calendario: string;
  };
}

interface CitaProps {
  usuario: UsuarioInfo;
}


const CalendarViewReadOnly: React.FC<CitaProps> = ({usuario}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Cita | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<any>(null);

  // Fetch con manejo de errores
  const fetchData = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    console.log("EFFECT")
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Cargar citas
        const citas = await fetchData(`/api/cita?pacienteId=${usuario.id}`);
        formatEvents(citas.data);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
   
  }, []);

  const formatEvents = (citas: Cita[]) => {
    const formattedEvents = citas.map((cita: Cita) => ({
      id: cita.id.toString(),
      title: cita.titulo,
      start: cita.fecha_inicio,
      end: cita.fecha_fin,
      extendedProps: {
        ...cita
      },
      color: cita.tipo?.color_calendario || '#3788d8',
      textColor: '#ffffff'
    }));
    if(formattedEvents.length == 0) alert("No se tiene citas registradas");
    setEvents(formattedEvents);
  };

  const handleEventClick = (clickInfo: any) => {
    const eventData = clickInfo.event.extendedProps;
    setCurrentEvent(eventData);
    setIsModalVisible(true);
  };

  return (
      <div className="p-5 w-full sm:w-[90%] md:w-[80%] mx-auto">
      <Card title="Calendario de Citas">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            nowIndicator={true}
            editable={false} // Deshabilitar edición
            selectable={false} // Deshabilitar selección
            dayMaxEvents={true}
            weekends={true}
            locale={esLocale}
            height="70vh"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            eventClick={handleEventClick}
          />
        )}
      </Card>

      <Modal
        title="Detalles de la Cita"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>
        ]}
      >
        {currentEvent && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Título">{currentEvent.titulo}</Descriptions.Item>
            <Descriptions.Item label="Descripción">
              {currentEvent.descripcion || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha y Hora de Inicio">
              {moment(currentEvent.fecha_inicio).format('LLL')}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha y Hora de Fin">
              {moment(currentEvent.fecha_fin).format('LLL')}
            </Descriptions.Item>
            <Descriptions.Item label="Psicólogo">
              {currentEvent.psicologo?.nombre || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Paciente">
              {currentEvent.paciente ? `${currentEvent.paciente.nombre} (${currentEvent.paciente.cedula || 'Sin cédula'})` : 'No asignado'}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo de Cita">
              {currentEvent.tipo?.nombre || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              {currentEvent.estado}
            </Descriptions.Item>
            {currentEvent.duracion_real && (
              <Descriptions.Item label="Duración real">
                {currentEvent.duracion_real} minutos
              </Descriptions.Item>
            )}
            {currentEvent.notas_psicologo && (
              <Descriptions.Item label="Notas del Psicólogo">
                {currentEvent.notas_psicologo}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CalendarViewReadOnly;