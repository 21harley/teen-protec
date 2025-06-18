//type auth

import {UsuarioCompleto,TipoRegistro,UsuarioBase} from "./user"
import { TutorData,PsicologoData } from "./dataDB";

export interface LoginRequest {
  email: string;
  password: string;
  tokenExpiry?: Date;
}

export interface LoginResponse {
  user: UsuarioCompleto;
  token: string;
  tokenExpiry?: Date;
}

export interface RegisterRequest {
  tipoRegistro: TipoRegistro;
  usuarioData: UsuarioBase;
  tutorData?: TutorData;
  psicologoData?: PsicologoData;
}

export interface AuthCookies {
  authToken: string;
  authTokenExpiry: string;
  userInfo: {
    id: number;
    tipo: number;
    nombre: string;
    esAdolescente: boolean;
    esPsicologo: boolean;
  };
}