import { Server } from "socket.io";

export const configureSocket = (server) => {
  const io = new Server(server, {
    maxHttpBufferSize: 20e6,
    cors: {
      origin: process.env.ShareA_Frontend_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};
