import { rooms, usersInRoom } from "../utils/roomCode.js";

export const roomService = {
  createRoom: (code, password, socketId) => {
    rooms[code] = {
      password,
      members: [socketId],
      createdAt: Date.now(),
      timeout: null,
    };

    if (!usersInRoom[code]) usersInRoom[code] = [];
    usersInRoom[code].push({
      id: socketId,
      name: `User-${socketId.substring(0, 3)}`,
    });

    return rooms[code];
  },

  joinRoom: (code, password, socketId) => {
    const room = rooms[code];
    if (!room) return { success: false, error: "❌ Room does not exist" };
    if (room.password !== password)
      return { success: false, error: "❌ Incorrect password" };

    if (!room.members.includes(socketId)) {
      room.members.push(socketId);
    }

    if (!usersInRoom[code]) usersInRoom[code] = [];

    const userExists = usersInRoom[code].some((u) => u.id === socketId);
    if (!userExists) {
      usersInRoom[code].push({
        id: socketId,
        name: `User-${socketId.substring(0, 3)}`,
      });
    }

    return { success: true, room };
  },

  leaveRoom: (code, socketId) => {
    if (usersInRoom[code]) {
      usersInRoom[code] = usersInRoom[code].filter((u) => u.id !== socketId);
    }

    if (rooms[code]) {
      rooms[code].members = rooms[code].members.filter((id) => id !== socketId);
    }

    return usersInRoom[code] || [];
  },

  getUsersInRoom: (code) => {
    return usersInRoom[code] || [];
  },

  setRoomTimeout: (code, io, timeoutDuration = 3600000) => {
    if (rooms[code] && rooms[code].timeout) {
      clearTimeout(rooms[code].timeout);
    }

    rooms[code].timeout = setTimeout(() => {
      if (rooms[code]) {
        io.in(code).socketsLeave(code);
        delete rooms[code];
        delete usersInRoom[code];
      }
    }, timeoutDuration);
  },

  removeUserOnDisconnect: (socketId) => {
    let roomCode = null;

    for (let code in usersInRoom) {
      const userExists = usersInRoom[code]?.some((u) => u.id === socketId);
      if (userExists) {
        usersInRoom[code] = usersInRoom[code].filter((u) => u.id !== socketId);

        if (rooms[code]) {
          rooms[code].members = rooms[code].members.filter(
            (id) => id !== socketId,
          );
        }

        roomCode = code;
        break;
      }
    }

    return { roomCode };
  },
};
