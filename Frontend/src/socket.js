import { io } from "socket.io-client";
const process = import.meta.env;

const URL =
  process.VITE_Backend_URl ||
  process.VITE_Local_Backend_URL ||
  "http://localhost:5000";

const socket = io(URL, {
  transports: ["websocket"],
});

export default socket;
