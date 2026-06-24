import { io } from "socket.io-client";

const URL = import.meta.env.VITE_Backend_URl || "http://localhost:5000";
console.log("🔌 Connecting to backend:", URL);

const socket = io(URL, {
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  withCredentials: true,
});

export default socket;
