import { io } from "socket.io-client";

// const socket = io("http://localhost:5000", {
//   transports: ["websocket"],
// });

const socket = io("https://sharea-backend.onrender.com", {
    transports: ["websocket"],
});


  export default socket;