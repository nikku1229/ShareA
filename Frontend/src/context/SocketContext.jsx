import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import socket from "../socket";
import { useApp } from "./AppContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const {
    setRoomCode,
    setJoinedRoom,
    setError,
    setChat,
    setUsersList,
    setReceivedFiles,
    setDownloadProgress,
    showToast,
    setLoggedInUser,
    roomCode,
    setSentFiles,
    setUploadProgress,
  } = useApp();

  const [isConnected, setIsConnected] = useState(false);
  const connectionPromiseRef = useRef(null);
  const roomJoinedRef = useRef(false);

  const fileBuffersRef = useRef(new Map());
  const fileSizesRef = useRef(new Map());
  const receivedSizesRef = useRef(new Map());
  const fileTransferIdRef = useRef(0);

  const saveUserReceivedData = (fileName, fileSize, currentRoomCode) => {
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
      console.error("❌ Error saving received file:", err);
    }
  };

  const connectSocket = () => {
    if (socket.connected) {
      setIsConnected(true);
      return Promise.resolve();
    }

    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    connectionPromiseRef.current = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        connectionPromiseRef.current = null;
        reject(new Error("Connection timeout"));
      }, 5000);

      socket.connect();

      const onConnect = () => {
        clearTimeout(timeout);
        setIsConnected(true);
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
        connectionPromiseRef.current = null;
        resolve();
      };

      const onError = (err) => {
        clearTimeout(timeout);
        setIsConnected(false);
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
        connectionPromiseRef.current = null;
        reject(err);
      };

      socket.once("connect", onConnect);
      socket.once("connect_error", onError);
    });

    return connectionPromiseRef.current;
  };

  const disconnectSocket = () => {
    if (socket.connected && !roomJoinedRef.current) {
      socket.disconnect();
      setIsConnected(false);
    }
    connectionPromiseRef.current = null;
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      connectionPromiseRef.current = null;
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("roomCreated", (code) => {
      socket.currentRoom = code;
      roomJoinedRef.current = true;
      setRoomCode(code);
      setJoinedRoom(true);
      setError("");
      showToast(`Room created! Your room code is ${code}`, "success");
    });

    socket.on("roomJoined", (code) => {
      socket.currentRoom = code;
      roomJoinedRef.current = true;
      setJoinedRoom(true);
      setError("");
      showToast(`Successfully joined room: ${code}`, "success");
    });

    socket.on("roomError", (msg) => {
      setError(msg);
      showToast(msg, "error");
      roomJoinedRef.current = false;
    });

    socket.on("chatMessage", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("systemMessage", (msg) => {
      setChat((prev) => [...prev, { user: "system", text: msg }]);
    });

    socket.on("updateUsers", (roomUsers) => {
      setUsersList(roomUsers);
    });

    socket.on("fileMeta", ({ fileName, fileSize, transferId }) => {
      fileBuffersRef.current.set(transferId, []);
      fileSizesRef.current.set(transferId, fileSize);
      receivedSizesRef.current.set(transferId, 0);
      setDownloadProgress((prev) => ({ ...prev, [transferId]: 0 }));
    });

    socket.on("fileChunk", ({ fileName, chunk, isLastChunk, transferId }) => {
      const arr = new Uint8Array(chunk);
      const buffers = fileBuffersRef.current;

      if (!fileSizesRef.current.has(transferId)) {
        console.warn(
          `Missing metadata for transfer ${transferId}, skipping chunk`,
        );
        return;
      }

      if (!buffers.get(transferId)) buffers.set(transferId, []);

      const received = receivedSizesRef.current.get(transferId) || 0;
      buffers.get(transferId).push(arr);
      receivedSizesRef.current.set(transferId, received + arr.byteLength);

      const total = fileSizesRef.current.get(transferId) || 1;
      const percent = Math.round(
        (receivedSizesRef.current.get(transferId) / total) * 100,
      );
      setDownloadProgress((prev) => ({ ...prev, [transferId]: percent }));

      if (isLastChunk) {
        const fileBlob = new Blob(buffers.get(transferId));
        const url = URL.createObjectURL(fileBlob);
        setReceivedFiles((prev) => [...prev, { fileName, url, transferId }]);

        setTimeout(() => {
          setDownloadProgress((prev) => {
            const updated = { ...prev };
            delete updated[transferId];
            return updated;
          });
        }, 500);

        showToast(`File received: ${fileName}`, "success");

        const currentRoomCode = socket.currentRoom || roomCode || "";
        saveUserReceivedData(
          fileName,
          fileSizesRef.current.get(transferId),
          currentRoomCode,
        );

        buffers.delete(transferId);
        fileSizesRef.current.delete(transferId);
        receivedSizesRef.current.delete(transferId);
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
  }, [
    setRoomCode,
    setJoinedRoom,
    setError,
    setChat,
    setUsersList,
    setReceivedFiles,
    setDownloadProgress,
    showToast,
    setLoggedInUser,
    roomCode,
  ]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connectSocket,
        disconnectSocket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
