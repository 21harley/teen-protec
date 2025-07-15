// lib/emailService.ts
import Mailjet from 'node-mailjet';

// Definición de tipos
interface EmailProps {
  [key: string]: any;
  name?: string;
  token?: string;
  resetLink?: string;
  psicologo_name?:string;
  user_name?:string;
}

interface EmailRecipient {
  email: string;
  name?: string;
}

type EmailRecipients = string | EmailRecipient | (string | EmailRecipient)[];

interface Attachment {
  name: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: EmailRecipients;
  subject: string;
  from?: {
    email?: string;
    name?: string;
  };
  template?: string;
  props?: EmailProps;
  attachments?: Attachment[];
}

interface TemplateEmailOptions extends Omit<EmailOptions, 'template'> {
  templateId: number;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: Error;
  mailjetError?: any;
}

interface TemplateFunction {
  (props: EmailProps): {
    text: string;
    html: string;
  };
}

interface Templates {
  [key: string]: TemplateFunction;
}

// Configuración del cliente Mailjet
let mailjetClient: Mailjet;

const initializeMailjetClient = (): void => {
  if (mailjetClient) return;
  
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    throw new Error('Las claves de API de Mailjet no están configuradas');
  }
  
  mailjetClient = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );
};

// Plantillas disponibles
const TEMPLATES: Templates = {
  welcome: (props) => ({
    text: `Bienvenido ${props.name} a nuestra plataforma.`,
    html: `<h1>Bienvenido ${props.name}</h1><p>Gracias por unirte a nosotros.</p>`,
  }),
  resetPassword: (props) => ({
    text: `Solicitud de restablecimiento de contraseña. Token: ${props.token}`,
    html: `<p>Haz clic <a href="${props.resetLink}">aquí</a> para restablecer tu contraseña.</p>`,
  }),
  test_asignado: (props) => ({
    text: `Test asignado.`,
    html: `<h1>Test asignado por ${props.psicologo_name}</h1><p> Ingresa al sistema para completar el test.</p>`,
  }),
  test_completado: (props) => ({
    text: `Test completado.`,
    html: `<h1>El paciente ${props.user_name} ha completado el test.</h1><p> Ingresa al sistema para validad las respuetas lo antes posible.</p>`,
  }),
  psicologo_asignado:(props)=>({
    text: `Psicologo asignado.`,
    html: `<h1>El psicologo ${props.psicologo_name} te atendera prontamente</h1><p> Ingresa al sistema para completar el test.</p>`,
  })
};

const normalizeRecipients = (recipients: EmailRecipients): EmailRecipient[] => {
  if (Array.isArray(recipients)) {
    return recipients.map(recipient => 
      typeof recipient === 'string' 
        ? { email: recipient } 
        : recipient
    );
  }
  return typeof recipients === 'string' 
    ? [{ email: recipients }] 
    : [recipients];
};

const prepareAttachments = (attachments: Attachment[] = []) => {
  return attachments.map(attachment => ({
    ContentType: attachment.contentType || 'application/octet-stream',
    Filename: attachment.name,
    Base64Content: attachment.content.toString('base64')
  }));
};

export async function sendEmail({
  to,
  subject,
  from,
  template,
  props = {},
  attachments,
}: EmailOptions): Promise<EmailResponse> {
  try {
    initializeMailjetClient();
    
    // Validaciones
    if (!to) throw new Error('El destinatario (to) es requerido');
    if (!subject) throw new Error('El asunto (subject) es requerido');
    if (!process.env.MAILJET_FROM_EMAIL) {
      throw new Error('MAILJET_FROM_EMAIL no está configurado');
    }

    // Generar contenido basado en plantilla
    let textContent: string | undefined;
    let htmlContent: string | undefined;

    if (template) {
      if (!TEMPLATES[template]) {
        throw new Error(`Plantilla "${template}" no encontrada`);
      }
      
      const templateContent = TEMPLATES[template](props);
      textContent = templateContent.text;
      htmlContent = templateContent.html;
    }

    // Configurar remitente
    const senderEmail = from?.email || process.env.MAILJET_FROM_EMAIL;
    const senderName = from?.name || process.env.MAILJET_FROM_NAME || senderEmail.split('@')[0];

    const message: any = {
      From: {
        Email: senderEmail,
        Name: senderName
      },
      To: normalizeRecipients(to),
      Subject: subject
    };

    if (textContent) message.TextPart = textContent;
    if (htmlContent) message.HTMLPart = htmlContent;
    if (attachments?.length) {
      message.Attachments = prepareAttachments(attachments);
    }

    // Enviar el email
    const response = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({ Messages: [message] });

    return { 
      success: true, 
      data: response.body 
    };

  } catch (error) {
    console.error('Error al enviar email:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido al enviar el email';

    return { 
      success: false,
      error: new Error(errorMessage),
      mailjetError: error
    };
  }
}

export async function sendTemplateEmail({
  templateId,
  to,
  subject,
  from,
  props = {},
  attachments,
}: TemplateEmailOptions): Promise<EmailResponse> {
  try {
    initializeMailjetClient();
    
    if (!templateId) throw new Error('ID de plantilla es requerido');
    if (!process.env.MAILJET_FROM_EMAIL) {
      throw new Error('MAILJET_FROM_EMAIL no está configurado');
    }

    // Configurar remitente
    const senderEmail = from?.email || process.env.MAILJET_FROM_EMAIL;
    const senderName = from?.name || process.env.MAILJET_FROM_NAME || senderEmail.split('@')[0];

    const message: any = {
      From: {
        Email: senderEmail,
        Name: senderName
      },
      To: normalizeRecipients(to),
      Subject: subject,
      TemplateID: templateId,
      TemplateLanguage: true,
      Variables: props
    };

    if (attachments?.length) {
      message.Attachments = prepareAttachments(attachments);
    }

    // Enviar el email con plantilla
    const response = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({ Messages: [message] });

    return { 
      success: true, 
      data: response.body 
    };

  } catch (error) {
    console.error('Error al enviar email con plantilla:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido al enviar el email con plantilla';

    return { 
      success: false,
      error: new Error(errorMessage),
      mailjetError: error
    };
  }
}

/*
 sib-api-v3-sdk
 resend
*/