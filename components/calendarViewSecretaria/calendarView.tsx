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

interface Psicologo {
  id: number;
  nombre: string;
  email: string;
}

const CalendarView = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Cita | null>(null);
  const [form] = Form.useForm();
  const [tiposCita, setTiposCita] = useState<TipoCita[]>([]);
  const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const calendarRef = useRef<any>(null);

  const [pacientesAsignados, setPacientesAsignados] = useState<PacienteAsignado[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [psicologoSeleccionado, setPsicologoSeleccionado] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cita[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [duracionSeleccionada, setDuracionSeleccionada] = useState<number>(30);

  const duraciones = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' },
    { value: 240, label: '4 horas' },
    { value: 300, label: '5 horas' }
  ];

  // Función para deshabilitar fechas pasadas
  const disabledDate = (current: Dayjs) => {
    return current && current < moment().startOf('day');
  };

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
        // Cargar citas
        const citas = await fetchData('/api/cita');
        formatEvents(citas.data);

        // Cargar tipos de cita
        const tipos = await fetchData('/api/tipo-cita');
        setTiposCita(tipos.data);

        // Cargar psicólogos
        const psicologosData = await fetchData('/api/usuario?rol=PSICOLOGO');
        setPsicologos(psicologosData);

        // Si hay psicólogos, seleccionar el primero por defecto
        if (psicologosData.length > 0) {
          setPsicologoSeleccionado(psicologosData[0].id);
          await cargarPacientesAsignados(psicologosData[0].id);
        }
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

  // Efecto para cargar pacientes cuando cambia el psicólogo seleccionado
  useEffect(() => {
    if (psicologoSeleccionado) {
      cargarPacientesAsignados(psicologoSeleccionado);
    } else {
      setPacientesAsignados([]);
    }
  }, [psicologoSeleccionado]);

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

  const handleCalendarClose = () => {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }, 10);
  };

  const calcularFechaFin = (fechaInicio: Dayjs, duracion: number): Dayjs => {
    return fechaInicio.add(duracion, 'minutes');
  };

  const handleDuracionChange = (valor: number) => {
    setDuracionSeleccionada(valor);
    const fechaInicio = form.getFieldValue('fecha_inicio');
    if (fechaInicio) {
      const fechaFin = calcularFechaFin(fechaInicio, valor);
      form.setFieldsValue({ fecha_fin: fechaFin });
    }
  };

  const handleFechaInicioChange = (fecha: Dayjs | null) => {
    if (fecha) {
      const fechaFin = calcularFechaFin(fecha, duracionSeleccionada);
      form.setFieldsValue({ fecha_fin: fechaFin });
    }
  };

  const handleDateClick = (arg: any) => {
    setCurrentEvent(null);
    form.resetFields();
    
    form.setFieldsValue({
      titulo: '',
      descripcion: '',
      fecha_inicio: null,
      fecha_fin: null,
      id_psicologo: psicologos[0]?.id,
      estado: 'PENDIENTE'
    });
    setPsicologoSeleccionado(psicologos[0]?.id || null);
    setDuracionSeleccionada(30);
    setIsModalVisible(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const eventData = clickInfo.event.extendedProps;
    setCurrentEvent(eventData);
    
    // USANDO UTC COMO EN LA PRIMERA VISTA
    const fechaInicio = moment(eventData.fecha_inicio).utc();
    const fechaFin = moment(eventData.fecha_fin).utc();
    
    // Calcular duración en minutos
    const duracion = fechaFin.diff(fechaInicio, 'minutes');
    const duracionEnLista = duraciones.find(d => d.value === duracion)?.value || 30;
    
    setDuracionSeleccionada(duracionEnLista);
    
    form.setFieldsValue({
      ...eventData,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      id_paciente: eventData.paciente?.id || null
    });
    setPsicologoSeleccionado(eventData.id_psicologo);
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
      const response = await fetch(`/api/cita?search=${searchTerm}`);
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
      
      // Validar que la fecha de inicio esté presente
      if (!values.fecha_inicio) {
        message.error('La fecha y hora de inicio es requerida');
        return;
      }
      
      // Validación adicional para fecha pasada (igual que en la primera vista)
      if (values.fecha_inicio < moment().startOf('day')) {
        message.error('No puede seleccionar fechas pasadas');
        return;
      }
      
      const formattedValues = {
        ...values,
        fecha_inicio: values.fecha_inicio.toISOString(),
        fecha_fin: values.fecha_fin ? values.fecha_fin.toISOString() : calcularFechaFin(values.fecha_inicio, duracionSeleccionada).toISOString(),
        id_paciente: values.id_paciente || null,
        id_tipo_cita: values.id_tipo_cita || null
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
      
      message.success(currentEvent ? 'Cita actualizada' : 'Cita creada');

      // Refrescar eventos
      const citasResponse = await fetch('/api/cita');
      const citasData = await citasResponse.json();
      formatEvents(citasData.data);
      setIsModalVisible(false);
    } catch (error) {
      console.log(result);
      if(result.error) alert(result.error)
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
      const citasResponse = await fetch('/api/cita');
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

  const handleModalClose = () => {
    form.resetFields();
    setDuracionSeleccionada(30);
    setIsModalVisible(false);
    setTimeout(() => {
      setCurrentEvent(null);
    }, 100);
  };

  return (
    <div style={{ padding: '20px', width: '60%', margin:"auto" }}>
      <Card title="Calendario de Citas">
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
                            
                            // USANDO UTC COMO EN LA PRIMERA VISTA
                            const fechaInicio = moment(cita.fecha_inicio).utc();
                            const fechaFin = moment(cita.fecha_fin).utc();
                            const duracion = fechaFin.diff(fechaInicio, 'minutes');
                            const duracionEnLista = duraciones.find(d => d.value === duracion)?.value || 30;
                            
                            setDuracionSeleccionada(duracionEnLista);
                            
                            form.setFieldsValue({
                              ...cita,
                              fecha_inicio: fechaInicio,
                              fecha_fin: fechaFin,
                              id_paciente: cita.paciente?.id || null
                            });
                            setPsicologoSeleccionado(cita.id_psicologo);
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
        onCancel={handleModalClose}
        width={700}
        afterClose={() => {
          form.resetFields();
          setDuracionSeleccionada(30);
        }}
        footer={[
          currentEvent && (
            <Button danger key="delete" onClick={handleDelete}>
              Eliminar
            </Button>
          ),
          <Button key="cancel" onClick={handleModalClose}>
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
                  showTime={{
                    format: 'HH:mm',
                    showSecond: false,
                    hideDisabledOptions: true,
                  }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  getPopupContainer={(trigger) => trigger.parentElement}
                  placeholder="Seleccione fecha y hora"
                  onOpenChange={(open) => !open && handleCalendarClose()}
                  onChange={handleFechaInicioChange}
                  disabledDate={disabledDate} // ← BLOQUEA FECHAS PASADAS (IGUAL QUE PRIMERA VISTA)
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duración"
              >
                <Select
                  value={duracionSeleccionada}
                  onChange={handleDuracionChange}
                  style={{ width: '100%' }}
                >
                  {duraciones.map((duracion) => (
                    <Option key={duracion.value} value={duracion.value}>
                      {duracion.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_psicologo"
                label="Psicólogo"
                rules={[{ required: true, message: 'El psicólogo es requerido' }]}
              >
                <Select
                  onChange={(value) => {
                    setPsicologoSeleccionado(value);
                    form.setFieldsValue({ id_paciente: undefined });
                  }}
                >
                  {psicologos.map((psicologo) => (
                    <Option key={psicologo.id} value={psicologo.id}>
                      {psicologo.nombre} ({psicologo.email})
                    </Option>
                  ))}
                </Select>
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

          {/* Campo oculto para fecha_fin que se calcula automáticamente */}
          <Form.Item name="fecha_fin" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CalendarView;