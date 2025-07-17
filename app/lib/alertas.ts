import { PrismaClient } from "./../../app/generated/prisma";
import { sendEmail } from "./email_template"; // Asegúrate de que este path sea correcto
import Mailjet from 'node-mailjet';

const prisma = new PrismaClient();

interface AlarmaData {
  id_usuario?: number | null;
  id_tipo_alerta?: number | null;
  mensaje: string;
  vista?: boolean;
  correo_enviado?: boolean;
}

interface AlarmaWithEmailParams extends AlarmaData {
  emailParams: {
    to: string | string[];
    subject: string;
    from?: {
      email?: string;
      name?: string;
    };
    template?: string;
    props?: Record<string, any>;
    attachments?: Array<{
      name: string;
      content: Buffer;
      contentType?: string;
    }>;
  };
}

export async function create_alarma(alarmaData: AlarmaData): Promise<boolean> {
  try {
    if (!alarmaData.mensaje || !alarmaData.id_usuario) {
      console.error('Error: Datos incompletos para crear la alarma');
      return false;
    }

    await prisma.alarma.create({
      data: {
        id_usuario: alarmaData.id_usuario || null,
        id_tipo_alerta: alarmaData.id_tipo_alerta || null,
        mensaje: alarmaData.mensaje,
        vista: alarmaData.vista || false,
        correo_enviado: alarmaData.correo_enviado || false
      }
    });

    return true;

  } catch (error: any) {
    console.error('Error al crear la alarma:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

export async function create_alarma_email(params: AlarmaWithEmailParams): Promise<{ alarmaCreated: boolean; emailSent: boolean }> {
  try {
    // 1. Primero creamos la alarma
    const alarmaCreated = await create_alarma({
      id_usuario: params.id_usuario,
      id_tipo_alerta: params.id_tipo_alerta,
      mensaje: params.mensaje,
      vista: params.vista,
      correo_enviado: true
    });
    
    console.log("Alarmar creada",alarmaCreated);

    if (!alarmaCreated) {
      return { alarmaCreated: false, emailSent: false };
    }

    // 2. Preparamos los parámetros del email
    const emailOptions = {
      to: params.emailParams.to,
      subject: params.emailParams.subject,
      from: params.emailParams.from,
      template: params.emailParams.template,
      props: params.emailParams.props,
      attachments: params.emailParams.attachments
    };

    if(process.env.EMAIL_ACTIVE){
        // 3. Enviamos el email
        const { error } = await sendEmail(emailOptions);
    
        if (error) {
          console.error('Error al enviar el email:', error);
          // Opcional: Actualizar la alarma para marcar que el email falló
          await prisma.alarma.updateMany({
            where: {
              id_usuario: params.id_usuario,
              mensaje: params.mensaje
            },
            data: {
              correo_enviado: false
            }
          });
          return { alarmaCreated: true, emailSent: false };
        }
    }

    return { alarmaCreated: true, emailSent: true };

  } catch (error) {
    console.error('Error en create_alarma_email:', error);
    return { alarmaCreated: false, emailSent: false };
  }
}

// Ejemplo de uso:
/*
const result = await create_alarma_email({
  id_usuario: 123,
  id_tipo_alerta: 456,
  mensaje: "Alerta importante",
  vista: false,
  correo_enviado: true,
  emailParams: {
    to: "usuario@example.com",
    subject: "Tienes una nueva alerta",
    from: {
      email: "notificaciones@tudominio.com",
      name: "Sistema de Alertas"
    },
    template: "welcome",
    props: {
      name: "Nombre del Usuario",
      alertMessage: "Alerta importante"
    }
  }
});

console.log(result);
*/