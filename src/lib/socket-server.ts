import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

let globalIo: ServerIO | null = null;

export const initSocketServer = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Iniciando Socket.IO...");
    const io = new ServerIO(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
    globalIo = io;

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
  } else {
    globalIo = res.socket.server.io;
  }
  return res.socket.server.io;
};

export const getIo = () => globalIo;

export const emitirEvento = (evento: string, data: any) => {
  if (globalIo) {
    globalIo.emit(evento, data);
    return true;
  }
  return false;
};
