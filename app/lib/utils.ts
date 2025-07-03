import { LoginResponse,UsuarioCompleto,TipoUsuario,Tutor,Psicologo } from "./../types/user/index";
export function adaptLoginResponseToUsuarioCompleto( {user} : LoginResponse): UsuarioCompleto {
    //console.log(user, "Hola");
  
  // Adaptar TipoUsuario
  const tipoUsuario: TipoUsuario = {
    id: user.tipoUsuario.id,
    nombre: user.tipoUsuario.nombre,
    menu: user.tipoUsuario.menu.map((menuItem: { path: string; name: string; icon: string }) => ({
      path: menuItem.path,
      name: menuItem.name,
      icon: menuItem.icon
    }))
  };

  // Adaptar Tutor si existe
  let tutorInfo: Tutor | undefined;
  if (user.tutorInfo) {
    tutorInfo = {
      id: user.tutorInfo.id,
      cedula_tutor: user.tutorInfo.cedula_tutor,
      nombre_tutor: user.tutorInfo.nombre_tutor,
      profesion_tutor: user.tutorInfo.profesion_tutor,
      telefono_contacto: user.tutorInfo.telefono_contacto,
      correo_contacto: user.tutorInfo.correo_contacto
    };
  }

  // Adaptar Psicologo si existe
  let psicologoInfo: Psicologo | undefined;
  if (user.psicologoInfo) {
    psicologoInfo = {
      numero_de_titulo: user.psicologoInfo.numero_de_titulo,
      nombre_universidad: user.psicologoInfo.nombre_universidad,
      monto_consulta: user.psicologoInfo.monto_consulta,
      telefono_trabajo: user.psicologoInfo.telefono_trabajo,
      redes_sociales: user.psicologoInfo.redes_sociales
        ?.filter((red: any) => typeof red.id === "number")
        .map((red: any) => ({
          id: red.id as number,
          nombre_red: red.nombre_red,
          url_perfil: red.url_perfil
        }))
    };
  }

  // Crear el objeto UsuarioCompleto
  const usuarioCompleto: UsuarioCompleto = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    cedula: user.cedula,
    fecha_nacimiento: user.fecha_nacimiento,
    id_tipo_usuario: user.id_tipo_usuario,
    tipoUsuario,
    esAdolescente: user.esAdolescente,
    esPsicologo: user.esPsicologo,
    tutorInfo,
    psicologoInfo
  };

  return usuarioCompleto;
}

import { LoginResponseDB} from "./../types/user/dataDB";

export function adaptLoginResponseDBToUsuarioCompleto( {user} : LoginResponseDB): UsuarioCompleto {
    //console.log(user, "Hola");
  
  // Adaptar TipoUsuario
  const tipoUsuario: TipoUsuario = {
    id: user.tipo_usuario.id,
    nombre: user.tipo_usuario.nombre,
    menu: Array.isArray(user.tipo_usuario?.menu)
      ? user.tipo_usuario.menu.map((menuItem: { path: string; name: string; icon: string }) => ({
          path: menuItem.path,
          name: menuItem.name,
          icon: menuItem.icon
        }))
      : []
  };

  // Adaptar Tutor si existe
  let tutorInfo: Tutor | undefined;
  if (user.adolecente?.tutor) {
    tutorInfo = {
      id: user.adolecente.tutor.id,
      cedula_tutor: user.adolecente.tutor.cedula_tutor,
      nombre_tutor: user.adolecente.tutor.nombre_tutor,
      profesion_tutor: user.adolecente.tutor.profesion_tutor,
      telefono_contacto: user.adolecente.tutor.telefono_contacto,
      correo_contacto: user.adolecente.tutor.correo_contacto
    };
  }

  // Adaptar Psicologo si existe
  let psicologoInfo: Psicologo | undefined;
  if (user.psicologo) {
    psicologoInfo = {
      numero_de_titulo: user.psicologo.numero_de_titulo,
      nombre_universidad: user.psicologo.nombre_universidad,
      monto_consulta: user.psicologo.monto_consulta,
      telefono_trabajo: user.psicologo.telefono_trabajo,
      redes_sociales: user.psicologo.redes_sociales
        ?.filter((red: any) => typeof red.id === "number")
        .map((red: any) => ({
          id: red.id as number,
          nombre_red: red.nombre_red,
          url_perfil: red.url_perfil
        }))
    };
  }

  // Crear el objeto UsuarioCompleto
  const usuarioCompleto: UsuarioCompleto = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    cedula: user.cedula,
    fecha_nacimiento: user.fecha_nacimiento,
    id_tipo_usuario: user.tipo_usuario.id,
    tipoUsuario,
    esAdolescente: !!user.adolecente,
    esPsicologo: !!user.psicologo,
    tutorInfo,
    psicologoInfo
  };

  return usuarioCompleto;
}