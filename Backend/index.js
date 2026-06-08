import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { corsMiddleware } from "./middleware/cors.js";
import { configureSocket } from "./config/socket.js";
import { roomController } from "./controllers/roomController.js";
import apiRoutes from "./routes/api.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

app.use(corsMiddleware);
app.use(express.json());

app.use("/api", apiRoutes);

const io = configureSocket(server);

io.on("connection", (socket) => {
  const controller = roomController(io, socket);

  socket.on("createRoom", controller.handleCreateRoom);
  socket.on("joinRoom", controller.handleJoinRoom);
  socket.on("leaveRoom", controller.handleLeaveRoom);
  socket.on("chatMessage", controller.handleChatMessage);
  socket.on("fileChunk", controller.handleFileChunk);
  socket.on("fileMeta", controller.handleFileMeta);
  socket.on("disconnect", controller.handleDisconnect);
});

server.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`),
);
