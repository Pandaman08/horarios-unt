import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";

let io: ServerIO | null = null;

export const initSocketServer = (httpServer: HttpServer) => {
  io = new ServerIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("join-room", (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} unido a ${roomName}`);
    });

    socket.on("leave-room", (roomName) => {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} salió de ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return io;
};

export const getIo = () => io;

export const emitirEvento = (evento: string, data: any) => {
  if (io) {
    io.emit(evento, data);
    return true;
  }
  return false;
};
