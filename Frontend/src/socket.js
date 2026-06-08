import { io } from "socket.io-client";

const URL = import.meta.env.VITE_Backend_URl || "http://localhost:5000";

const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: false,
});

export default socket;
