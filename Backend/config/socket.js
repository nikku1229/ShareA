import { Server } from "socket.io";

export const configureSocket = (server) => {
  const io = new Server(server, {
    maxHttpBufferSize: 20e6,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    cors: {
      origin: process.env.ShareA_Frontend_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
  });

  return io;
};
