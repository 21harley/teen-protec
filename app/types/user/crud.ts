//type crud

import { UsuarioBase,PsicologoData,TutorData } from "./dataDB";
import { TipoRegistro } from "./user";

export interface UserCreateRequest {
  tipoRegistro: TipoRegistro;
  usuarioData: UsuarioBase;
  tutorData?: TutorData;
  psicologoData?: PsicologoData;
}

export interface UserUpdateRequest {
  id: number;
  usuarioData: Partial<UsuarioBase>;
  tutorData?: TutorData;
  psicologoData?: PsicologoData;
}

export interface UserQueryParams {
  id?: number;
  tipo?: TipoRegistro;
  includePassword?: boolean;
}

export interface UserDeleteResponse {
  message: string;
}