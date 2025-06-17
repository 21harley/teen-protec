import crypto from "crypto";

const algoritmo = 'aes-256-cbc';
const rawEncryptionKey: string = process.env.ENCRYPTION_KEY || '';
const claveEncriptacion = crypto.createHash('sha256').update(rawEncryptionKey).digest('base64').substr(0, 32);
const iv: Buffer = crypto.randomBytes(16);

// Tiempo de vida del token en horas (puedes mover esto a variables de entorno)
const AUTH_TOKEN_EXPIRY_HOURS = process.env.AUTH_TOKEN_EXPIRY_HOURS ? 
  parseInt(process.env.AUTH_TOKEN_EXPIRY_HOURS) : 24;

export type EncryptedData = {
  iv: string;
  contenido: string;
};

export function encriptar(texto: string): EncryptedData {
  try {
    const cipher = crypto.createCipheriv(algoritmo, claveEncriptacion, iv);
    let encriptado = cipher.update(texto, 'utf8', 'hex');
    encriptado += cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      contenido: encriptado,
    };
  } catch (error) {
    console.error('Error encriptando contraseña:', error);
    throw new Error('Error al encriptar la contraseña');
  }
}

export function desencriptar(encryptedData: { iv: string; contenido: string }): string {
  try {
    const decipher = crypto.createDecipheriv(
      algoritmo,
      claveEncriptacion,
      Buffer.from(encryptedData.iv, 'hex')
    );
    let desencriptado = decipher.update(encryptedData.contenido, 'hex', 'utf8');
    desencriptado += decipher.final('utf8');
    return desencriptado;
  } catch (error) {
    console.error('Error desencriptando:', error);
    throw new Error('Error al desencriptar la contraseña');
  }
}

// Nueva función para generar fecha de expiración del token
export function generarTokenExpiry(hours: number = AUTH_TOKEN_EXPIRY_HOURS): Date {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
}

// Función para verificar si un token ha expirado
export function tokenHaExpirado(expiryDate: Date | null): boolean {
  if (!expiryDate) return true; // Si no hay fecha, considerar como expirado
  return new Date() > new Date(expiryDate);
}