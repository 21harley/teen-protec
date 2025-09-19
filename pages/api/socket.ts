import { NextApiRequest } from "next";
import { Server as HttpServer } from "http";
import { initSocketIO } from "./../../app/lib/socket";

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log("Inicializando Socket.io…");
    const httpServer: HttpServer = res.socket.server as any;
    const io = initSocketIO(httpServer);
    res.socket.server.io = io;
  }
  res.end();
}