import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Row,
  Col,
  Card,
  Space,
  Divider,
  Skeleton
} from 'antd';
import moment from 'moment';
import type { Dayjs } from 'dayjs';
import { UsuarioInfo } from '@/app/types/user';

const { Option } = Select;
const { TextArea } = Input;

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

interface TipoCita {
  id: number;
  nombre: string;
  color_calendario: string;
}

interface PacienteAsignado {
  id: number;
  nombre: string;
  cedula?: string;
  email?: string;
}

interface CitaProps {
  usuario: UsuarioInfo;
}

const CalendarView: React.FC<CitaProps> = ({usuario})  => {
  console.log(usuario);
  const [events, setEvents] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Cita | null>(null);
  const [form] = Form.useForm();
  const [tiposCita, setTiposCita] = useState<TipoCita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const calendarRef = useRef<any>(null);

  // Estados para pacientes asignados
  const [pacientesAsignados, setPacientesAsignados] = useState<PacienteAsignado[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [psicologoSeleccionado, setPsicologoSeleccionado] = useState<number | null>(null);

  // Estados para el buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cita[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
      message.error('Error al cargar los datos');
      throw error;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Cargar citas del psicólogo actual
        const citas = await fetchData(`/api/cita?psicologoId=${usuario.id}&all=true`);
        formatEvents(citas.data);

        // Cargar tipos de cita
        const tipos = await fetchData('/api/tipo-cita');
        setTiposCita(tipos.data);

        // Cargar pacientes asignados al psicólogo actual
        setPsicologoSeleccionado(usuario.id);
        await cargarPacientesAsignados(usuario.id);

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar pacientes asignados al psicólogo seleccionado
  const cargarPacientesAsignados = async (idPsicologo: number) => {
    setLoadingPacientes(true);
    try {
      const response = await fetch(`/api/usuario?id_psicologo=${idPsicologo}`);
      if (!response.ok) throw new Error('Error al cargar pacientes');
      const data = await response.json();
      setPacientesAsignados(data);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      message.error('Error al cargar pacientes asignados');
    } finally {
      setLoadingPacientes(false);
    }
  };

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
    setEvents(formattedEvents);
  };

  const handleDateClick = (arg: any) => {
    setCurrentEvent(null);
    form.resetFields();
    form.setFieldsValue({
      titulo: '',
      descripcion: '',
      fecha_inicio: moment(arg.date),
      fecha_fin: moment(arg.date).add(30, 'minutes'),
      id_psicologo: usuario.id,
      estado: 'PENDIENTE'
    });
    setPsicologoSeleccionado(usuario.id);
    setIsModalVisible(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const eventData = clickInfo.event.extendedProps;
    setCurrentEvent(eventData);
    form.setFieldsValue({
      ...eventData,
      fecha_inicio: moment(eventData.fecha_inicio),
      fecha_fin: moment(eventData.fecha_fin),
      id_paciente: eventData.paciente?.id || null
    });
    setPsicologoSeleccionado(usuario.id);
    setIsModalVisible(true);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      message.warning('Por favor ingrese un término de búsqueda');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setShowSearchResults(false);

    try {
      const response = await fetch(`/api/cita?search=${searchTerm}&psicologoId=${usuario.id}`);
      if (!response.ok) throw new Error('Error en la búsqueda');
      const data = await response.json();
      
      setSearchResults(data.data || []);
      setShowSearchResults(true);

      if (data.data?.length > 0) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(data.data[0].fecha_inicio);
        message.success(`Se encontraron ${data.data.length} resultados`);
      } else {
        message.info('No se encontraron resultados');
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Error al realizar la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = async () => {
    let response;
    let result;
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        fecha_inicio: values.fecha_inicio.toISOString(),
        fecha_fin: values.fecha_fin.toISOString(),
        id_paciente: values.id_paciente || null,
        id_tipo_cita: values.id_tipo_cita || null,
        id_psicologo: usuario.id // Siempre asignar al psicólogo actual
      };
      if (currentEvent) {
        // Actualizar cita existente
        formattedValues.id = currentEvent.id;
        response = await fetch(`/api/cita?id=${currentEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formattedValues)
        });
      } else {
        // Crear nueva cita
        response = await fetch('/api/cita', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formattedValues)
        });
      }
     
      result = await response.json();
      if (!response.ok) throw new Error('Error al guardar la cita');
      console.log(response,"Hola");
      message.success(currentEvent ? 'Cita actualizada' : 'Cita creada');

      // Refrescar eventos
      const citasResponse = await fetch(`/api/cita?psicologoId=${usuario.id}&all=true`);
      const citasData = await citasResponse.json();
      formatEvents(citasData.data);
      setIsModalVisible(false);
    } catch (error) {
      console.log(result);
      if(result.error) alert(result.error)
      //console.error('Error submitting form:', error,response);
      //message.error('Error al guardar la cita');
    }
    limpiarSearch();
  };

  const handleDelete = async () => {
    if (!currentEvent) return;

    try {
      const response = await fetch(`/api/cita?id=${currentEvent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar la cita');

      message.success('Cita eliminada');
      
      // Refrescar eventos
      const citasResponse = await fetch(`/api/cita?psicologoId=${usuario.id}`);
      const citasData = await citasResponse.json();
      formatEvents(citasData.data);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Error al eliminar la cita');
    }
    limpiarSearch();
  };

  const limpiarSearch = () => {
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchTerm("");
  };

  return (
    <div style={{ padding: '20px', width: '60%', margin:"auto" }}>
      <Card title="Calendario de Citas" >
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
              <Col span={24}>
                <Space>
                  <Input
                    placeholder="Buscar por nombre o cédula"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                    onPressEnter={handleSearch}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleSearch}
                    loading={isSearching}
                  >
                    Buscar
                  </Button>
                  {showSearchResults && (
                    <Button onClick={limpiarSearch}>
                      Limpiar
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>

            {showSearchResults && (
              <div style={{ marginBottom: '20px' }}>
                <Divider orientation="left">
                  {searchResults.length > 0 
                    ? `Resultados de búsqueda (${searchResults.length})`
                    : 'Sin resultados de búsqueda'}
                </Divider>
                
                {isSearching ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : searchResults.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {searchResults.map((cita) => (
                      <Col key={cita.id} xs={24} sm={12} md={8} lg={6}>
                        <Card
                          title={cita.titulo}
                          size="small"
                          onClick={() => {
                            const calendarApi = calendarRef.current.getApi();
                            calendarApi.gotoDate(cita.fecha_inicio);
                            setCurrentEvent(cita);
                            form.setFieldsValue({
                              ...cita,
                              fecha_inicio: moment(cita.fecha_inicio),
                              fecha_fin: moment(cita.fecha_fin),
                              id_paciente: cita.paciente?.id || null
                            });
                            setPsicologoSeleccionado(usuario.id);
                            setIsModalVisible(true);
                          }}
                          hoverable
                        >
                          <p>
                            <strong>Paciente:</strong>{' '}
                            {cita.paciente
                              ? `${cita.paciente.nombre}`
                              : 'No asignado'}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{' '}
                            {moment(cita.fecha_inicio).format('LLL')}
                          </p>
                          <p>
                            <strong>Estado:</strong> {cita.estado}
                          </p>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p>No se encontraron citas que coincidan con tu búsqueda.</p>
                )}
              </div>
            )}

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
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              locale={esLocale}
              height="70vh"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              select={handleDateClick}
              eventClick={handleEventClick}
            />
          </>
        )}
      </Card>

      <Modal
        title={currentEvent ? 'Editar Cita' : 'Nueva Cita'}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        footer={[
          currentEvent && (
            <Button danger key="delete" onClick={handleDelete}>
              Eliminar
            </Button>
          ),
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancelar
          </Button>,
          <Button key="submit" type="primary" onClick={handleFormSubmit}>
            Guardar
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="titulo"
                label="Título"
                rules={[{ required: true, message: 'El título es requerido' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="id_tipo_cita" label="Tipo de Cita">
                <Select placeholder="Seleccione un tipo">
                  {tiposCita.map((tipo) => (
                    <Option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fecha_inicio"
                label="Fecha y Hora de Inicio"
                rules={[{ required: true, message: 'La fecha es requerida' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fecha_fin"
                label="Fecha y Hora de Fin"
                rules={[{ required: true, message: 'La fecha es requerida' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="psicologo"
                label="Psicólogo"
              >
                <Input 
                  title={usuario.nombre} 
                  value={usuario.nombre} 
                  placeholder={usuario.nombre} 
                  disabled 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="id_paciente" label="Paciente">
                {loadingPacientes ? (
                  <Skeleton.Input active style={{ width: '100%' }} />
                ) : (
                  <Select
                    placeholder={
                      pacientesAsignados.length === 0 
                        ? 'No hay pacientes asignados' 
                        : 'Seleccione un paciente'
                    }
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as string).toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={pacientesAsignados.length === 0}
                  >
                    {pacientesAsignados.map((paciente) => (
                      <Option key={paciente.id} value={paciente.id}>
                        {paciente.nombre} - {paciente.cedula || 'Sin cédula'}
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="descripcion" label="Descripción">
            <TextArea rows={3} />
          </Form.Item>

          {currentEvent && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="duracion_real" label="Duración real (minutos)">
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="estado" label="Estado">
                    <Select>
                      <Option value="PENDIENTE">Pendiente</Option>
                      <Option value="CONFIRMADA">Confirmada</Option>
                      <Option value="CANCELADA">Cancelada</Option>
                      <Option value="COMPLETADA">Completada</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notas_psicologo" label="Notas del Psicólogo">
                <TextArea rows={3} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CalendarView;