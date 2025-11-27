import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://share-a-prototype.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

const io = new Server(server, {
  maxHttpBufferSize: 20e6, // ⬅️ 20 MB limit to prevent crashes
  cors: {
    origin: ["http://localhost:5173", "https://share-a-prototype.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store rooms with passwords
const rooms = {}; // { code: { password: "1234", members: [] } }
let usersInRoom = {}; // { roomId: [ { id, name } ] }

// Generate unique 6-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

io.on("connection", (socket) => {
  console.log("✅ A new user connected:", socket.id);

  // Create Room
  socket.on("createRoom", (password) => {
    if (!password) {
      socket.emit("roomError", "Password is required to create a room");
      return;
    }

    const code = generateRoomCode();
    rooms[code] = {
      password,
      members: [],
      createdAt: Date.now(),
      timeout: null,
    };

    socket.join(code);
    rooms[code].members.push(socket.id);

    // console.log(`Room ${code} created with password ${password}`);
    socket.emit("roomCreated", code);

    // Auto delete the room after 1 hour
    rooms[code].timeout = setTimeout(() => {
      // console.log(`⏱️ Room ${code} expired and is being closed`);

      io.in(code).socketsLeave(code);

      delete rooms[code];
      delete usersInRoom[code];
    }, 3600000); // 1 hour

    // store user
    if (!usersInRoom[code]) usersInRoom[code] = [];
    usersInRoom[code].push({
      id: socket.id,
      name: `User-${socket.id.substring(0, 3)}`,
    });

    // console.log(`User ${socket.id} joined room ${code}`);
    socket.emit("roomJoined", code);

    // send updated users list
    io.to(code).emit("updateUsers", usersInRoom[code]);
  });

  // Create / Join room
  socket.on("joinRoom", ({ code, joinedRoomPassword }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit("roomError", "❌ Room does not exist");
      return;
    }
    if (room.password !== joinedRoomPassword) {
      socket.emit("roomError", "❌ Incorrect password");
      return;
    }

    socket.join(code);
    room.members.push(socket.id);

    // console.log(`User ${socket.id} joined room ${code}`);
    socket.emit("roomJoined", code);

    // store user
    if (!usersInRoom[code]) usersInRoom[code] = [];
    usersInRoom[code].push({
      id: socket.id,
      name: `User-${socket.id.substring(0, 3)}`,
    });

    // console.log(`User ${socket.id} joined room ${code}`);
    socket.emit("roomJoined", code);

    // send updated users list
    io.to(code).emit("updateUsers", usersInRoom[code]);

    // ✅ Notify others
    socket
      .to(code)
      .emit(
        "systemMessage",
        `👤 User ${socket.id.substring(0, 5)} joined the room`
      );
  });

  // Leave room
  socket.on("leaveRoom", (code) => {
    socket.leave(code);
    // console.log(`User ${socket.id} left room ${code}`);

    if (usersInRoom[code]) {
      usersInRoom[code] = usersInRoom[code].filter((u) => u.id !== socket.id);
      io.to(code).emit("updateUsers", usersInRoom[code]);
    }

    // ✅ Notify others
    socket
      .to(code)
      .emit(
        "systemMessage",
        `👤 User ${socket.id.substring(0, 5)} left the room`
      );
  });

  // chat messages
  socket.on("chatMessage", ({ roomCode, msg }) => {
    if (!roomCode) return;
    // console.log(`Message in ${roomCode}:`, msg);

    // Broadcast to all connected clients
    io.to(roomCode).emit("chatMessage", { user: socket.id, text: msg });
  });

  // File transfer (chunks)
  socket.on("fileChunk", ({ roomCode, fileName, chunk, isLastChunk }) => {
    if (!roomCode) return;
    // console.log(`Chunk for ${fileName} in ${roomCode} from ${socket.id}`);

    try {
      // Convert to Buffer (for stable binary transmission)
      const safeChunk = Buffer.from(chunk);

      // Broadcast chunk in smaller packages to reduce memory load
      socket
        .to(roomCode)
        .emit("fileChunk", { fileName, chunk: safeChunk, isLastChunk });

      if (isLastChunk) {
        setTimeout(() => {
          socket
            .to(roomCode)
            .emit("fileComplete", { fileName, sender: socket.id });
        }, 100);
        // console.log(
        //   `✅ File sent successfully: ${fileName} (${safeChunk.length} bytes)`
        // );
      }
    } catch (err) {
      console.error(`❌ File chunk error for ${fileName}:`, err.message);
    }

    // socket.to(roomCode).emit("fileChunk", { fileName, chunk, isLastChunk });

    // if (isLastChunk) {
    //   io.to(roomCode).emit("fileComplete", { fileName, sender: socket.id });
    // }
  });

  // File metadata
  socket.on("fileMeta", ({ roomCode, fileName, fileSize }) => {
    if (!roomCode) return;
    // console.log(
    //   `File incoming in ${roomCode}: ${fileName} (${fileSize} bytes)`
    // );

    socket.to(roomCode).emit("fileMeta", { fileName, fileSize });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // Loop through all rooms
    for (let roomCode in usersInRoom) {
      const userExists = usersInRoom[roomCode]?.some((u) => u.id === socket.id);

      if (userExists) {
        // Remove user from room
        usersInRoom[roomCode] = usersInRoom[roomCode].filter(
          (u) => u.id !== socket.id
        );

        // Notify remaining users
        io.to(roomCode).emit("updateUsers", usersInRoom[roomCode]);
        io.to(roomCode).emit(
          "systemMessage",
          `User ${socket.id.substring(0, 5)} disconnected`
        );
      }
      break;
    }
  });
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from ShareA backend" });
});

app.get("/", (req, res) => {
  res.send("Backend is running for ShareA");
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
