export interface User {
    id: number;
    name: string;
    email: string;
    ic:string;
    password: string;
    id_tipo_usuario: number;
    birthdate: string;
}
  
interface MenuItem {
  icon: string;
  name: string;
  path: string;
}

export interface TipoUsuario {
  id: number;
  nombre: string;
  menu: MenuItem[];
}

interface UserLogin {
  id: number;
  email: string;
  nombre: string;
  id_tipo_usuario: number;
  tipoUsuario: TipoUsuario;
}

export interface AuthResponse {
  user: UserLogin;
}
