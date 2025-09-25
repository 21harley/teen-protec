import { NextApiRequest } from "next";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

// Configuración para deshabilitar el bodyParser de Next.js
export const config = { api: { bodyParser: false } };

// Declaración global para el socket.io server
declare global {
  var io: Server | undefined;
}

/**
 * Inicializa el servidor Socket.io
 */
export function initSocketIO(server: HttpServer): Server {
  if (global.io) return global.io;
  
  console.log("Inicializando Socket.io…");
  
  global.io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Configurar eventos del socket
  global.io.on("connection", (socket: Socket) => {
    console.log("Cliente conectado:", socket.id);

    // Unir al usuario a su sala personal
    socket.on("join-user-room", (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`Usuario ${userId} unido a su sala`);
    });

    // Salir de la sala del usuario
    socket.on("leave-user-room", (userId: string) => {
      socket.leave(`user-${userId}`);
      console.log(`Usuario ${userId} salió de su sala`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return global.io;
}

/**
 * Obtiene la instancia de Socket.io
 * @throws Error si Socket.io no está inicializado
 */
export function getIO(): Server {
  if (!global.io) {
    throw new Error("Socket.io no inicializado. Llama a initSocketIO primero.");
  }
  return global.io;
}

/**
 * Emite un evento a un usuario específico
 * @param userId ID del usuario
 * @param event Nombre del evento
 * @param payload Datos a enviar
 */
export function emitToUser(userId: string, event: string, payload: any): void {
  getIO().to(`user-${userId}`).emit(event, payload);
}

/**
 * Emite un evento a todos los clientes conectados
 * @param event Nombre del evento
 * @param payload Datos a enviar
 */
export function emitToAll(event: string, payload: any): void {
  getIO().emit(event, payload);
}

/**
 * Emite un evento a todos los clientes excepto al emisor
 * @param socketId ID del socket que emite
 * @param event Nombre del evento
 * @param payload Datos a enviar
 */
export function broadcast(socketId: string, event: string, payload: any): void {
  getIO().except(socketId).emit(event, payload);
}

/**
 * Handler de la API de Next.js para inicializar Socket.io
 */
export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const httpServer: HttpServer = res.socket.server as any;
    const io = initSocketIO(httpServer);
    res.socket.server.io = io;
  }
  res.end();
}