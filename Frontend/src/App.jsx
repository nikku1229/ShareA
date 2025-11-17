import { useState, useEffect, useRef } from "react";
import socket from "./socket";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Toast from "./components/Toast";
import "./index.css";

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
  const [isDragging, setIsDragging] = useState(false);

  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState();

  const fileBuffersRef = useRef({});
  const fileSizesRef = useRef({});
  const receivedSizesRef = useRef({});

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

    socket.on("fileMeta", ({ fileName, fileSize }) => {
      console.log("Received fileMeta:", { fileName, fileSize });

      fileBuffersRef.current[fileName] = [];
      fileSizesRef.current[fileName] = fileSize;
      receivedSizesRef.current[fileName] = 0;

      setDownloadProgress((prev) => ({ ...prev, [fileName]: 0 }));
    });

    socket.on("fileChunk", ({ fileName, chunk, isLastChunk }) => {
      console.log("Received fileChunk:", chunk.fileName);

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
  }, []);

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
    // joinRoom ? setpopUp(`👋 You joined the room ${roomCode}`) : "";
    // setTimeout(() => setpopUp(""), 2000);
  };

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

  // 📦 Drag and Drop Handlers
  // const handleDragOver = (e) => {
  //   e.preventDefault();
  //   setIsDragging(true);
  // };
  // const handleDragLeave = (e) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  // };
  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  //   const file = e.dataTransfer.files[0];
  //   if (file) sendFile(file);
  // };

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
    setTimeout(() => setpopUp(""), 2000);
  };

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
      setLoggedInUser(updatedUser);
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
      setLoggedInUser(updatedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error saving sent file:", err);
    }
  };

  const deleteFromSent = (index) => () => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;

      const user = JSON.parse(raw);
      const updatedSentData = [...(user.data?.saveSentData || [])];
      updatedSentData.splice(index, 1); // remove the item at index
      const updatedUser = {
        ...user,
        data: {
          saveSentData: updatedSentData,
          saveReceivedData: user.data?.saveReceivedData || [],
        },
      };
      setLoggedInUser(updatedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error deleting sent file:", err);
    }
  };

  const deleteFromReceive = (index) => () => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;

      const user = JSON.parse(raw);
      const updatedReceivedData = [...(user.data?.saveReceivedData || [])];
      updatedReceivedData.splice(index, 1); // remove the item at index
      const updatedUser = {
        ...user,
        data: {
          saveReceivedData: updatedReceivedData,
          saveSentData: user.data?.saveSentData || [],
        },
      };
      setLoggedInUser(updatedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error deleting received file:", err);
    }
  };

  return (
    <>
      {!joinedRoom ? (
        <>
          <Home
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
          {/* <div className="app"> */}
            {/* {roomCode && joinedRoom && (
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
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
            )} */}
            {/* <main> */}
              {/* Sidebar - Active Users */}
              {/* <aside className="sidebar-users">
                <h3>Users in Room</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {users.map((u) => (
                    <li
                      key={u.id}
                      style={{
                        padding: "6px 8px",
                        margin: "4px 0",
                        borderRadius: "6px",
                        backgroundColor:
                          u.id === socket.id ? "#007bff" : "#eee",
                        color: u.id === socket.id ? "white" : "black",
                        fontWeight: u.id === socket.id ? "bold" : "normal",
                      }}
                    >
                      {u.id === socket.id
                        ? loggedInUser
                          ? loggedInUser.name
                          : u.name
                        : `Unknown User ${u.id.slice(0, 3)}`}
                    </li>
                  ))}
                </ul>
              </aside> */}

              {/* chat check */}
              {/* <section className="chat">
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

                        {c.user !== "system" && (
                          <span className="time">
                            {new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
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
              </section> */}

              {/* file check */}
              {/* <section className="files">
                <h2>File Transfer</h2>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`drop-zone ${isDragging ? "dragging" : ""}`}
                  style={{
                    border: "2px dashed #007bff",
                    padding: "40px",
                    borderRadius: "10px",
                    backgroundColor: isDragging ? "#e6f0ff" : "#fafafa",
                    textAlign: "center",
                    transition: "0.2s",
                    cursor: "pointer",
                  }}
                >
                  <p style={{ fontSize: "16px", color: "#555" }}>
                    {isDragging
                      ? "📂 Drop file here to send"
                      : "Drag & Drop your file here or click below"}
                  </p>
                  <input
                    type="file"
                    onChange={sendFile}
                    style={{ marginTop: "10px" }}
                  />
                </div>

                {Object.keys(uploadProgress).length > 0 && (
                  <div>
                    <h3>Uploading...</h3>
                    <ul>
                      {Object.keys(uploadProgress).map((fileName) => (
                        <li key={fileName}>
                          <p>{fileName}</p>
                          <progress
                            value={uploadProgress[fileName]}
                            max="100"
                          ></progress>
                          <span>{uploadProgress[fileName]}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  style={{ display: "flex", gap: "40px", marginTop: "20px" }}
                >
                  <div>
                    <h3>Received Files:</h3>
                    <ul>
                      {Object.keys(downloadProgress).length > 0 && (
                        <div>
                          <h3>Downloading...</h3>
                          <ul>
                            {Object.keys(downloadProgress).map((fileName) => (
                              <li key={fileName}>
                                <p>{fileName}</p>
                                <progress
                                  value={downloadProgress[fileName]}
                                  max="100"
                                ></progress>
                                <span>{downloadProgress[fileName]}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {receivedFiles.map((f, i) => (
                        <li key={i}>
                          <a href={f.url} download={f.fileName}>
                            {f.fileName}
                          </a>
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
              </section>*/}
            {/* </main>  */}
            {/* <main
              className="save-data-container"
              style={{
                marginTop: "50px",
              }}
            >
              <section>
                <h2>Save received files</h2>
                <ul>
                  {loggedInUser?.data?.saveReceivedData?.map((item, index) => (
                    <li key={index}>
                      {item.FileName} - {item.FileSize} bytes in room:{" "}
                      {item.RoomCode}
                      <span>
                        <button onClick={deleteFromReceive(index)}>X</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2>Save sent files</h2>
                <ul>
                  {loggedInUser?.data?.saveSentData?.map((item, index) => (
                    <li key={index}>
                      {item.FileName} - {item.FileSize} bytes in room:{" "}
                      {item.RoomCode}
                      <span>
                        <button onClick={deleteFromSent(index)}>X</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </main> */}
          {/* </div> */}
        </>
      )}

      {popUp && <Toast popUp={popUp} />}
    </>
  );
}

export default App;
