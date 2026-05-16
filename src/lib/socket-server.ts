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

export const initSocketServer = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Iniciando Socket.IO...");
    const io = new ServerIO(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

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
  }
  return res.socket.server.io;
};
