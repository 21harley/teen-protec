//type global

import { UsuarioCompleto, UsuarioSafe } from "./user";

export interface AuthState {
  user: UsuarioCompleto | null;
  token: string | null;
  tokenExpiry: Date | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UsersState {
  users: UsuarioSafe[];
  currentUser: UsuarioCompleto | null;
  isLoading: boolean;
  error: string | null;
}