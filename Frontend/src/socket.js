import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// const socket = io("https://share-a-backend.vercel.app", {
//     transports: ["websocket"],
// });


  export default socket;