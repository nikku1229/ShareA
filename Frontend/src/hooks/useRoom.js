import { useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useApp } from "../context/AppContext";

export const useRoom = () => {
  const { socket, connectSocket, disconnectSocket } = useSocket();
  const {
    roomCode,
    setRoomCode,
    setJoinedRoomPassword,
    setCreateRoomPassword,
    setJoinedRoom,
    setChat,
    setReceivedFiles,
    setSentFiles,
    setUploadProgress,
    setPopUp,
    setError,
    setDownloadProgress,
    showToast,
  } = useApp();

  const isCreatingRef = useRef(false);
  const isJoiningRef = useRef(false);

  const createRoom = useCallback(
    async (password) => {
      if (!password.trim()) {
        setError("Password is required");
        return;
      }

      if (isCreatingRef.current) {
        showToast("Already creating room, please wait...");
        return;
      }

      isCreatingRef.current = true;

      try {
        if (!socket.connected) {
          await connectSocket();
        }

        socket.emit("createRoom", password);
        isCreatingRef.current = false;
      } catch (err) {
        console.error("Connection failed:", err);
        setError("Failed to connect to server");
        showToast("Failed to connect to server", "error");
        isCreatingRef.current = false;
      }
    },
    [socket, setError, connectSocket, showToast],
  );

  const joinRoom = useCallback(
    async (code, password) => {
      if (!code.trim() || !password.trim()) {
        setError("Room code and password required");
        return;
      }

      if (isJoiningRef.current) {
        showToast("Already joining room, please wait...");
        return;
      }

      isJoiningRef.current = true;

      try {
        // Connect if not connected
        if (!socket.connected) {
          await connectSocket();
        }

        // Emit directly without setTimeout
        socket.emit("joinRoom", { code, joinedRoomPassword: password });
        isJoiningRef.current = false;
      } catch (err) {
        console.error("Connection failed:", err);
        setError("Failed to connect to server");
        showToast("Failed to connect to server", "error");
        isJoiningRef.current = false;
      }
    },
    [socket, setError, connectSocket, showToast],
  );

  const leaveRoom = useCallback(() => {
    if (socket.connected) {
      socket.emit("leaveRoom", roomCode);
      disconnectSocket();
    }

    setRoomCode("");
    setJoinedRoomPassword("");
    setCreateRoomPassword("");
    setJoinedRoom(false);
    setChat([]);
    setReceivedFiles([]);
    setSentFiles([]);
    setUploadProgress({});
    setDownloadProgress({});
    showToast("You left the room");
  }, [
    socket,
    roomCode,
    setRoomCode,
    setJoinedRoomPassword,
    setCreateRoomPassword,
    setJoinedRoom,
    setChat,
    setReceivedFiles,
    setSentFiles,
    setUploadProgress,
    setDownloadProgress,
    setPopUp,
    disconnectSocket,
  ]);

  const sendMessage = useCallback(
    (message) => {
      if (message.trim() && socket.connected) {
        socket.emit("chatMessage", { roomCode, msg: message });
      }
    },
    [socket, roomCode],
  );

  return { createRoom, joinRoom, leaveRoom, sendMessage };
};
