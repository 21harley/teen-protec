// Tipos básicos compartidos
export interface TipoUsuario {
  id: number;
  nombre: string;
  menu: Array<{
      path: string;
      name: string;
      icon: string;
    }>;
}

export interface RedSocial {
  id?: number;
  nombre_red: string;
  url_perfil: string;
}

export interface Tutor {
  id: number;
  cedula_tutor: string;
  nombre_tutor: string;
  profesion_tutor?: string;
  telefono_contacto?: string;
  correo_contacto?: string;
}

export interface Psicologo {
  numero_de_titulo: string;
  nombre_universidad: string;
  monto_consulta: number;
  telefono_trabajo: string;
  redes_sociales?: RedSocial[];
}

export interface Adolescente {
  tutor: Tutor;
}