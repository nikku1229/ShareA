import { roomService } from "../services/roomService.js";
import { generateRoomCode } from "../utils/roomCode.js";

export const roomController = (io, socket) => {
  return {
    handleCreateRoom: (password) => {
      if (!password) {
        socket.emit("roomError", "Password is required to create a room");
        return;
      }

      const code = generateRoomCode();
      roomService.createRoom(code, password, socket.id);
      socket.join(code);

      socket.emit("roomCreated", code);
      socket.emit("roomJoined", code);

      io.to(code).emit("updateUsers", roomService.getUsersInRoom(code));

      roomService.setRoomTimeout(code, io);
    },

    handleJoinRoom: ({ code, joinedRoomPassword }) => {
      const result = roomService.joinRoom(code, joinedRoomPassword, socket.id);

      if (!result.success) {
        socket.emit("roomError", result.error);
        return;
      }

      socket.join(code);
      socket.emit("roomJoined", code);
      io.to(code).emit("updateUsers", roomService.getUsersInRoom(code));

      socket
        .to(code)
        .emit(
          "systemMessage",
          `👤 User ${socket.id.substring(0, 5)} joined the room`,
        );
    },

    handleLeaveRoom: (code) => {
      socket.leave(code);
      roomService.leaveRoom(code, socket.id);
      io.to(code).emit("updateUsers", roomService.getUsersInRoom(code));

      socket
        .to(code)
        .emit(
          "systemMessage",
          `👤 User ${socket.id.substring(0, 5)} left the room`,
        );
    },

    handleChatMessage: ({ roomCode, msg }) => {
      if (!roomCode) return;
      io.to(roomCode).emit("chatMessage", { user: socket.id, text: msg });
    },

    handleFileChunk: ({ roomCode, fileName, chunk, isLastChunk }) => {
      if (!roomCode) return;

      try {
        const safeChunk = Buffer.from(chunk);
        socket
          .to(roomCode)
          .emit("fileChunk", { fileName, chunk: safeChunk, isLastChunk });

        if (isLastChunk) {
          setTimeout(() => {
            socket
              .to(roomCode)
              .emit("fileComplete", { fileName, sender: socket.id });
          }, 100);
        }
      } catch (err) {
        console.error(`❌ File chunk error:`, err.message);
      }
    },

    handleFileMeta: ({ roomCode, fileName, fileSize }) => {
      if (!roomCode) return;
      socket.to(roomCode).emit("fileMeta", { fileName, fileSize });
    },

    handleDisconnect: () => {
      const { roomCode } = roomService.removeUserOnDisconnect(socket.id);

      if (roomCode) {
        io.to(roomCode).emit(
          "updateUsers",
          roomService.getUsersInRoom(roomCode),
        );
        io.to(roomCode).emit(
          "systemMessage",
          `User ${socket.id.substring(0, 5)} disconnected`,
        );
      }
    },
  };
};
