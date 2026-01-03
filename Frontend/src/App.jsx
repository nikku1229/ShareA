import { useState, useEffect, useRef } from "react";
import socket from "./socket";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Toast from "./components/Toast";
import "./index.css";
const process = import.meta.env;

function App() {
  const [backendMsg, setBackendMsg] = useState("Loading...");
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});

  const [joinedRoomPassword, setJoinedRoomPassword] = useState("");
  const [createRoomPassword, setCreateRoomPassword] = useState("");
  const [error, setError] = useState("");

  const [popUp, setpopUp] = useState("");

  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState();

  const fileBuffersRef = useRef({});
  const fileSizesRef = useRef({});
  const receivedSizesRef = useRef({});

  useEffect(() => {
    const API_BASE =
      process.VITE_Backend_URl ||
      process.VITE_Local_Backend_URL ||
      "http://localhost:5000";

    fetch(`${API_BASE}/api`)
      .then((res) => res.json())
      .then((data) => {
        setBackendMsg(data.message);
        console.log(data.message);
      })
      .catch((err) => console.error("Frontend error:", err));
  }, []);

  // Socket
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
    });

    socket.on("roomCreated", (code) => {
      socket.currentRoom = code;
      setRoomCode(code);
      setJoinedRoom(true);
      setError("");
      alert(`✅ Room created! Your room code is ${code}`);
    });

    socket.on("roomJoined", (code) => {
      socket.currentRoom = code;
      setJoinedRoom(true);
      setError("");
      // console.log(`Joined room: ${code}`);
    });

    socket.on("roomError", (msg) => {
      setError(msg);
      alert(msg);
    });

    socket.on("chatMessage", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("systemMessage", (msg) => {
      setChat((prev) => [...prev, { user: "system", text: msg }]);
    });

    socket.on("updateUsers", (roomUsers) => {
      setUsers(roomUsers);
    });

    socket.on("fileMeta", ({ fileName, fileSize }) => {
      // console.log("Received fileMeta:", { fileName, fileSize });

      fileBuffersRef.current[fileName] = [];
      fileSizesRef.current[fileName] = fileSize;
      receivedSizesRef.current[fileName] = 0;

      setDownloadProgress((prev) => ({ ...prev, [fileName]: 0 }));
    });

    socket.on("fileChunk", ({ fileName, chunk, isLastChunk }) => {
      // console.log("Received fileChunk:", chunk.fileName);

      const arr = new Uint8Array(chunk);
      const buffers = fileBuffersRef.current;
      const sizes = fileSizesRef.current;
      const received = receivedSizesRef.current;

      if (!sizes[fileName]) {
        console.warn(`Missing metadata for ${fileName}, skipping chunk`);
        return;
      }

      if (!buffers[fileName]) buffers[fileName] = [];
      if (!received[fileName]) received[fileName] = 0;

      buffers[fileName].push(arr);
      received[fileName] += arr.byteLength;

      // Update progress %
      const total = sizes[fileName] || 1;
      const percent = Math.round(
        (received[fileName] / sizes[fileName]) * 100
      ).toFixed(1);

      setDownloadProgress((prev) => ({ ...prev, [fileName]: percent }));

      if (isLastChunk) {
        // Combine chunks into a blob
        const fileBlob = new Blob(buffers[fileName]);
        const url = URL.createObjectURL(fileBlob);

        setReceivedFiles((prev) => [...prev, { fileName, url }]);

        setTimeout(() => {
          setDownloadProgress((prev) => {
            const updated = { ...prev };
            if (updated[fileName]) delete updated[fileName];
            return updated;
          });
        }, 500);

        showNotification("File Received", `You received: ${fileName}`);
        const savedSize = fileSizesRef.current[fileName] || 0;

        delete buffers[fileName];
        delete sizes[fileName];
        delete received[fileName];
        delete fileSizesRef.current[fileName];
        saveUserReceivedData(fileName, savedSize);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("roomError");
      socket.off("chatMessage");
      socket.off("systemMessage");
      socket.off("updateUsers");
      socket.off("fileMeta");
      socket.off("fileChunk");
    };
  }, []);

  // local storage user check
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return; // no user stored yet
      const userDetail = JSON.parse(raw);
      if (userDetail) {
        const normalized = {
          ...userDetail,
          data: {
            saveSentData: userDetail.data?.saveSentData || [],
            saveReceivedData: userDetail.data?.saveReceivedData || [],
          },
        };
        setLoggedInUser(normalized);
      }
    } catch (err) {
      console.error("Failed parsing loggedInUser from localStorage:", err);
    }
  }, [loggedInUser]);

  // Create Room
  const createRoom = () => {
    if (createRoomPassword.trim() === "") {
      setError("Password is required");
      return;
    }
    socket.emit("createRoom", createRoomPassword);
  };

  // Join Room
  const joinRoom = () => {
    if (roomCode.trim() === "" || joinedRoomPassword.trim() === "") {
      setError("Room code and password required");
      return;
    }
    socket.emit("joinRoom", { code: roomCode, joinedRoomPassword });
  };

  // chat sender
  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chatMessage", {
        roomCode, // include the room
        msg: message,
      });

      setMessage("");
    }
  };

  // File sender
  const sendFile = async (event) => {
    const file = event?.target ? event.target.files[0] : event;
    if (!file) return;

    const chunkSize = 128 * 1024; // 128KB per chunk
    const totalChunks = Math.ceil(file.size / chunkSize);
    const reader = new FileReader();
    let offset = 0;
    let chunkIndex = 0;

    // Send metadata first
    socket.emit("fileMeta", {
      roomCode,
      fileName: file.name,
      fileSize: file.size,
    });

    reader.onload = (e) => {
      const chunk = e.target.result;
      const isLastChunk = offset + chunkSize >= file.size;

      socket.emit("fileChunk", {
        roomCode,
        fileName: file.name,
        chunk: new Uint8Array(chunk),
        isLastChunk,
      });

      chunkIndex++;
      const percent = Math.round((chunkIndex / totalChunks) * 100);
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: percent,
      }));

      offset += chunkSize;
      if (!isLastChunk) {
        setTimeout(() => readSlice(offset), 80);
      } else {
        setSentFiles((prev) => [...prev, { fileName: file.name }]);
        saveUserSentData(file.name, file.size);
        setTimeout(() => {
          setUploadProgress((prev) => {
            const copy = { ...prev };
            delete copy[file.name];
            return copy;
          });
        }, 1000);

        // ✅ Show notification
        showNotification(
          "File Sent",
          `Your file "${file.name}" was sent successfully`
        );
      }
    };

    const readSlice = (o) => {
      const slice = file.slice(o, o + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  };

  // Helper function for notifications
  const showNotification = (title, body) => {
    setpopUp(`🔔 ${title}: ${body}`);
    setTimeout(() => setpopUp(""), 2000);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 📌 Leave room
  const leaveRoom = () => {
    socket.emit("leaveRoom", roomCode); // notify server
    setRoomCode("");
    setJoinedRoomPassword("");
    setCreateRoomPassword("");
    setJoinedRoom(false);

    setChat([]);
    setReceivedFiles([]);
    setSentFiles([]);
    setUploadProgress(0);
    setpopUp("👋 You left the room");
    setTimeout(() => setpopUp(""), 2000);
  };

  const saveUserSentData = (fileName, fileSize) => {
    const currentRoomCode = socket.currentRoom || roomCode || "";
    const newEntry = {
      FileName: fileName,
      FileSize: fileSize,
      RoomCode: currentRoomCode,
    };

    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;

      const user = JSON.parse(raw);

      const updatedUser = {
        ...user,
        data: {
          saveSentData: [...(user.data?.saveSentData || []), newEntry],
          saveReceivedData: user.data?.saveReceivedData || [],
        },
      };
      setLoggedInUser(() => {
        return updatedUser;
      });
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error saving sent file:", err);
    }
  };

  const saveUserReceivedData = (fileName, fileSize) => {
    const currentRoomCode = socket.currentRoom || roomCode || "";
    const newEntry = {
      FileName: fileName,
      FileSize: fileSize,
      RoomCode: currentRoomCode,
    };

    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;

      const user = JSON.parse(raw);
      const updatedUser = {
        ...user,
        data: {
          saveReceivedData: [...(user.data?.saveReceivedData || []), newEntry],
          saveSentData: user.data?.saveSentData || [],
        },
      };
      setLoggedInUser(() => {
        return updatedUser;
      });
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error saving sent file:", err);
    }
  };

  return (
    <>
      {!joinedRoom ? (
        <>
          <Home
            loggedInUser={loggedInUser}
            setLoggedInUser={setLoggedInUser}
            createRoom={createRoom}
            createRoomPassword={createRoomPassword}
            setCreateRoomPassword={setCreateRoomPassword}
            joinRoom={joinRoom}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            joinedRoomPassword={joinedRoomPassword}
            setJoinedRoomPassword={setJoinedRoomPassword}
            error={error}
          />
        </>
      ) : (
        <>
          <Room
            loggedInUser={loggedInUser}
            setLoggedInUser={setLoggedInUser}
            roomCode={roomCode}
            joinedRoom={joinedRoom}
            setpopUp={setpopUp}
            leaveRoom={leaveRoom}
            sendFile={sendFile}
            sentFiles={sentFiles}
            receivedFiles={receivedFiles}
            users={users}
            socket={socket.id}
            uploadProgress={uploadProgress}
            downloadProgress={downloadProgress}
            chat={chat}
            sendMessage={sendMessage}
            message={message}
            setMessage={setMessage}
          />
        </>
      )}

      {popUp && <Toast popUp={popUp} />}
    </>
  );
}

export default App;
