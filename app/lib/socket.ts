import { Server } from "socket.io";

let io: Server | null = null;

export function initSocketIO(server: any) {
  if (io) return io;
  io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io no inicializado");
  return io;
}

export function emitToUser(userId: string, event: string, payload: any) {
  getIO().to(`user-${userId}`).emit(event, payload);
}