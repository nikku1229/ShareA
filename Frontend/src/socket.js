import { io } from "socket.io-client";

// const socket = io("http://localhost:5000", {
//   transports: ["websocket"],
// });
// export default socket;

const socket = io("https://share-a-three.vercel.app", {
  transports: ["websocket"],
});
export default socket;