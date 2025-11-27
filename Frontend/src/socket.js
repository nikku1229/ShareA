import { io } from "socket.io-client";

// const URL = "http://localhost:5000";
const URL = "https://sharea-backend.onrender.com";

const socket = io(URL, {
  transports: ["websocket"],
});

export default socket;