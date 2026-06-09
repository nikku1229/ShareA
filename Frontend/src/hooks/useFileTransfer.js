import { useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useApp } from "../context/AppContext";

export const useFileTransfer = () => {
  const { socket } = useSocket();
  const {
    roomCode,
    setUploadProgress,
    setSentFiles,
    showToast,
    setLoggedInUser,
  } = useApp();
  const transferIdRef = useRef(0);

  const saveUserSentData = useCallback(
    (fileName, fileSize, currentRoomCode) => {
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
    },
    [setLoggedInUser],
  );

  const sendFile = useCallback(
    async (file) => {
      if (!file) {
        showToast("No file selected", "error");
        return;
      }

      if (!socket.connected) {
        showToast("Not connected to server", "error");
        return;
      }

      const transferId = `${Date.now()}-${transferIdRef.current++}-${file.name}`;

      const chunkSize = 128 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);

      socket.emit("fileMeta", {
        roomCode,
        fileName: file.name,
        fileSize: file.size,
        transferId,
      });

      let offset = 0;
      let chunkIndex = 0;

      const readSlice = (o) => {
        const slice = file.slice(o, o + chunkSize);
        const reader = new FileReader();

        reader.onload = (e) => {
          const chunk = e.target.result;
          const isLastChunk = offset + chunkSize >= file.size;

          socket.emit("fileChunk", {
            roomCode,
            fileName: file.name,
            chunk: new Uint8Array(chunk),
            isLastChunk,
            transferId,
          });

          chunkIndex++;
          const progressPercent = Math.round((chunkIndex / totalChunks) * 100);
          setUploadProgress((prev) => ({
            ...prev,
            [transferId]: progressPercent,
          }));

          offset += chunkSize;
          if (!isLastChunk) {
            setTimeout(() => readSlice(offset), 80);
          } else {
            setSentFiles((prev) => [
              ...prev,
              { fileName: file.name, transferId },
            ]);

            const currentRoomCode = socket.currentRoom || roomCode || "";
            saveUserSentData(file.name, file.size, currentRoomCode);

            setTimeout(() => {
              setUploadProgress((prev) => {
                const copy = { ...prev };
                delete copy[transferId];
                return copy;
              });
            }, 1000);

            showToast(`File "${file.name}" sent successfully`, "success");
          }
        };

        reader.onerror = (error) => {
          console.error("File read error:", error);
          showToast(`Error reading file: ${file.name}`, "error");
        };

        reader.readAsArrayBuffer(slice);
      };

      readSlice(0);
    },
    [
      roomCode,
      socket,
      setUploadProgress,
      setSentFiles,
      showToast,
      saveUserSentData,
    ],
  );

  return { sendFile };
};
