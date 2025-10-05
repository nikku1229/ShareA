import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import socket from "./socket";
import logo from "./assets/ShareA-Logo-full.png";
import "./index.css";

function App() {
  const [backendMsg, setBackendMsg] = useState("Loading...");
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [popUp, setpopUp] = useState("");

  const [users, setUsers] = useState([]);

  // const [downloadProgress, setDownloadProgress] = useState({});

  //Api test

  useEffect(() => {

    const API_BASE = "https://sharea-backend.onrender.com";
    // const API_BASE = "http://localhost:5000";


    fetch(`${API_BASE}/api`)
      .then((res) => res.json())
      .then((data) => setBackendMsg(data.message))
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
      setRoomCode(code);
      setJoinedRoom(true);
      setError("");
      alert(`✅ Room created! Your room code is ${code}`);
    });

    socket.on("roomJoined", (code) => {
      setJoinedRoom(true);
      setError("");
      console.log(`Joined room: ${code}`);
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

    // Handle incoming file chunks
    let fileBuffers = {};
    let fileSizes = {};
    let receivedSizes = {};

    socket.on("fileMeta", ({ fileName, fileSize }) => {
      console.log("Received fileMeta:", { fileName, fileSize });

      fileBuffers[fileName] = [];
      fileSizes[fileName] = fileSize;
      receivedSizes[fileName] = 0;
      // setDownloadProgress((prev) => ({ ...prev, [fileName]: 0 }));
    });

    socket.on("fileChunk", ({ fileName, chunk, isLastChunk }) => {
      // console.log("Received fileChunk:", chunk.fileName);

      if (!fileBuffers[fileName]) fileBuffers[fileName] = [];

      // fileBuffers[fileName].push(new Uint8Array(chunk));
      // receivedSizes[fileName] += chunk.byteLength;

      const arr = new Uint8Array(chunk); // ensure it's typed array
      fileBuffers[fileName].push(arr);
      receivedSizes[fileName] += arr.byteLength;

      // Update progress %
      const percent = Math.round(
        (receivedSizes[fileName] / fileSizes[fileName]) * 100
      );
      // setDownloadProgress((prev) => ({ ...prev, [fileName]: percent }));

      if (isLastChunk) {
        // Combine chunks into a blob
        const fileBlob = new Blob(fileBuffers[fileName]);
        const url = URL.createObjectURL(fileBlob);

        setReceivedFiles((prev) => [...prev, { fileName, url }]);

        // alert(`File received: ${fileName}`);
        // Show notification
        showNotification("File Received", `You received: ${fileName}`);

        delete fileBuffers[fileName];
        delete fileSizes[fileName];
        delete receivedSizes[fileName];
      }
    });

    // File progress update
    // socket.on("file-progress", ({ fileName, progress }) => {
    //   setFileProgress((prev) => ({ ...prev, [fileName]: progress }));

    //   if (progress === 100) {
    //     showNotification("✅ File Transfer Complete", `File: ${fileName}`);
    //   }
    // });

    // File received
    // socket.on("file-received", ({ fileName, fileUrl }) => {
    //   setReceivedFiles((prev) => [...prev, { fileName, fileUrl }]);

    //   showNotification("📩 New File Received", `File: ${fileName}`);
    // });

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
      // socket.off("file-progress");
      // socket.off("file-received");
    };
  }, []);

  // Create Room
  const createRoom = () => {
    if (password.trim() === "") {
      setError("Password is required");
      return;
    }
    socket.emit("createRoom", password);
  };

  // Join Room
  const joinRoom = () => {
    if (roomCode.trim() === "" || password.trim() === "") {
      setError("Room code and password required");
      return;
    }
    socket.emit("joinRoom", { code: roomCode, password });
    setpopUp(`👋 You joined the room ${roomCode}`);
    setTimeout(() => setpopUp(""), 2000);
  };

  // Join room
  // const joinRoom = () => {
  //   if (roomCode.trim() !== "") {
  //     socket.emit("joinRoom", roomCode);
  //   }
  // };

  // chat sender
  const sendMessage = () => {
    if (message.trim() !== "") {
      // socket.emit("chatMessage", message);

      socket.emit("chatMessage", {
        roomCode, // include the room
        msg: message,
      });

      setMessage("");
    }
  };

  // File sender
  const sendFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const chunkSize = 64 * 1024; // 64KB per chunk
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
      setUploadProgress(percent);

      offset += chunkSize;
      if (!isLastChunk) {
        readSlice(offset);
      } else {
        setSentFiles((prev) => [...prev, { fileName: file.name }]);
        setTimeout(() => setUploadProgress(0), 2000);

        // alert(`File sent: ${file.name}`);

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

  // useEffect(() => {
  //   if ("Notification" in window) {
  //     if (Notification.permission === "default") {
  //       Notification.requestPermission();
  //     }
  //   }
  // }, []);

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

  const copyRoomCode = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    setpopUp("✅ Room code copied!");
    setTimeout(() => setpopUp(""), 2000); // hide after 2 seconds
  };

  // 📌 Leave room
  const leaveRoom = () => {
    socket.emit("leaveRoom", roomCode); // notify server
    setRoomCode("");
    setJoinedRoom(false);

    setChat([]);
    setReceivedFiles([]);
    setSentFiles([]);
    setUploadProgress(0);
    setpopUp("👋 You left the room");
    setTimeout(() => setpopUp(""), 2000);
  };

  return (
    <>
      <div className="app">
        <header>
          {/* <h1>ShareA</h1> */}
          <Link to="/">
            <img src={logo} alt="ShareA Logo" />
          </Link>
          <p className="status">Backend says: {backendMsg}</p>

          {roomCode && joinedRoom && (
            <div style={{ textAlign: "center", marginBottom: "20px"}}>
              <h2>
                Room Code: <span style={{ color: "blue" }}>{roomCode}</span>
              </h2>
              <button
                onClick={() => {
                  copyRoomCode(roomCode);
                }}
                style={{
                  marginTop: "10px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  border: "1px solid #007bff",
                  backgroundColor: "#007bff",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Copy Room Code
              </button>

              <button
                onClick={leaveRoom}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Leave Room
              </button>
            </div>
          )}
        </header>

        {/* popUp Notification */}
        {popUp && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              background: "#333",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              animation: "fadeInOut 2s ease-in-out",
            }}
          >
            {popUp}
          </div>
        )}

        {!joinedRoom ? (
          <main>
            <section className="room">
              <h2>Create Room</h2>

              <form
                action=""
                onSubmit={(e) => {
                  e.preventDefault();
                  createRoom();
                }}
              >
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  autoComplete="current-password"
                  required
                />
                <br />

                <button>Create Room</button>
              </form>

              {error && <p style={{ color: "red" }}>{error}</p>}
            </section>
            <section className="room">
              <h2>Join Room</h2>

              <form
                action=""
                onSubmit={(e) => {
                  e.preventDefault();
                  joinRoom();
                }}
              >
                <input
                  type="text"
                  placeholder="Room Code (for joining)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  name="roomCode"
                  autoComplete="new-roomCode"
                  required
                />
                <br />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  autoComplete="current-password"
                  required
                />
                <br />

                <button>Join Room</button>
              </form>

              {error && <p style={{ color: "red" }}>{error}</p>}
            </section>
          </main>
        ) : (
          // <section className="room">
          //   <h2>Enter or Create Room</h2>
          //   <input
          //     type="text"
          //     placeholder="Room Code"
          //     value={roomCode}
          //     onChange={(e) => setRoomCode(e.target.value)}
          //   />
          //   <button onClick={joinRoom}>Join / Create</button>
          // </section>
          <main>
            {/* Sidebar - Active Users */}
            <aside className="sidebar-users">
              <h3>Users in Room</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {users.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      padding: "6px 8px",
                      margin: "4px 0",
                      borderRadius: "6px",
                      backgroundColor: u.id === socket.id ? "#007bff" : "#eee",
                      color: u.id === socket.id ? "white" : "black",
                      fontWeight: u.id === socket.id ? "bold" : "normal",
                    }}
                  >
                    {u.name}
                  </li>
                ))}
              </ul>
            </aside>

            {/* chat check */}
            <section className="chat">
              <h2>Chat Room</h2>
              <div className="chat-box">
                {chat.map((c, i) => (
                  <div
                    key={i}
                    className={`chat-message ${
                      c.user === "system"
                        ? "system"
                        : c.user === socket.id
                        ? "me"
                        : "other"
                    }`}
                  >
                    <div className="bubble">
                      <p>{c.text}</p>
                      {/* <span className="time">
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span> */}

                      {c.user !== "system" && (
                        <span className="time">
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    {/* <b>{c.user.substring(0, 5)}:</b> {c.text} */}
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <form
                  action=""
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-around",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button>Send</button>
                </form>
              </div>
            </section>

            {/* file check */}
            <section className="files">
              <h2>File Transfer</h2>
              <input type="file" onChange={sendFile} />

              {uploadProgress > 0 && (
                <div>
                  <p> Upload Progress: {uploadProgress}%</p>
                  <progress value={uploadProgress} max="100"></progress>
                </div>
              )}

              <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
                <div>
                  <h3>Received Files:</h3>
                  <ul>
                    {receivedFiles.map((f, i) => (
                      <li key={i}>
                        <a href={f.url} download={f.fileName}>
                          {f.fileName}
                        </a>
                        <br />
                        {/* <progress
                          value={downloadProgress[f.fileName] || 0}
                          max="100"
                        ></progress> */}
                        {/* <span>{downloadProgress[f.fileName] || 0}%</span> */}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Sent Files:</h3>
                  <ul>
                    {sentFiles.map((f, i) => (
                      <li key={i}>{f.fileName}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}

export default App;
