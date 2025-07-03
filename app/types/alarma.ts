import { UsuarioInfo,TipoUsuario } from "./user";
export interface AlarmaData {
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  vista?: boolean;
}

export interface TipoAlerta {
  id: number;
  nombre: string;
  url_destino?: string;
  id_tipo_usuario: number;
  tipo_usuario: TipoUsuario;
}
export interface Alarma {
  id: number;
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  fecha_creacion: string;
  fecha_vista?: string | null;
  vista: boolean;
  usuario?: UsuarioInfo | null;
  tipo_alerta?: TipoAlerta | null;
}