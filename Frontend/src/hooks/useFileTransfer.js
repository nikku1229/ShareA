import { useCallback, useRef, useState } from "react";
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

  const queueRef = useRef([]);
  const activeUploadsRef = useRef(new Map());
  const transferIdRef = useRef(0);
  const MAX_CONCURRENT_UPLOADS = 3;

  const saveUserSentData = useCallback(
    (fileName, fileSize, currentRoomCode, transferId) => {
      const newEntry = {
        FileName: fileName,
        FileSize: fileSize,
        RoomCode: currentRoomCode,
        TransferId: transferId,
        Timestamp: Date.now(),
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

  const uploadSingleFile = useCallback(
    async (file) => {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }

        if (!socket.connected) {
          reject(new Error("Not connected to server"));
          return;
        }

        const transferId = `${Date.now()}-${transferIdRef.current++}-${file.name}`;
        const chunkSize = 128 * 1024; // 128KB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);

        socket.emit("fileMeta", {
          roomCode,
          fileName: file.name,
          fileSize: file.size,
          transferId,
        });

        let offset = 0;
        let chunkIndex = 0;
        let lastProgressUpdate = 0;

        const sendNextChunk = () => {
          if (offset >= file.size) {
            setSentFiles((prev) => [
              ...prev,
              { fileName: file.name, transferId },
            ]);

            const currentRoomCode = socket.currentRoom || roomCode || "";
            saveUserSentData(file.name, file.size, currentRoomCode, transferId);

            setTimeout(() => {
              setUploadProgress((prev) => {
                const copy = { ...prev };
                delete copy[transferId];
                return copy;
              });
            }, 1000);

            showToast(`${file.name} sent successfully`, "success");
            resolve({ success: true, fileName: file.name });
            return;
          }

          const slice = file.slice(offset, offset + chunkSize);
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
            const progressPercent = Math.round(
              (chunkIndex / totalChunks) * 100,
            );

            if (
              progressPercent - lastProgressUpdate >= 5 ||
              progressPercent === 100
            ) {
              lastProgressUpdate = progressPercent;
              setUploadProgress((prev) => ({
                ...prev,
                [transferId]: progressPercent,
              }));
            }

            offset += chunkSize;

            setTimeout(sendNextChunk, 10);
          };

          reader.onerror = (error) => {
            console.error(`❌ Error reading ${file.name}:`, error);
            reject(error);
          };

          reader.readAsArrayBuffer(slice);
        };

        sendNextChunk();
      });
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

  const processQueue = useCallback(() => {
    while (
      queueRef.current.length > 0 &&
      activeUploadsRef.current.size < MAX_CONCURRENT_UPLOADS
    ) {
      const nextFile = queueRef.current.shift();
      const transferId = `${Date.now()}-${transferIdRef.current++}-${nextFile.name}`;

      activeUploadsRef.current.set(transferId, nextFile);

      uploadSingleFile(nextFile).finally(() => {
        activeUploadsRef.current.delete(transferId);
        processQueue();
      });
    }
  }, [uploadSingleFile]);

  const sendFiles = useCallback(
    async (files) => {
      if (!files) return;

      const fileArray = Array.isArray(files) ? files : Array.from(files);

      if (fileArray.length === 0) {
        showToast("No files selected", "error");
        return;
      }

      if (!socket.connected) {
        showToast("Not connected to server", "error");
        return;
      }

      fileArray.forEach((file) => {
        queueRef.current.push(file);
      });

      showToast(`${fileArray.length} file(s) added to queue`, "success");

      processQueue();
    },
    [socket, showToast, processQueue],
  );

  const getQueueStatus = useCallback(() => {
    return {
      queued: queueRef.current.length,
      active: activeUploadsRef.current.size,
      total: queueRef.current.length + activeUploadsRef.current.size,
    };
  }, []);

  const cancelUpload = useCallback(
    (transferId) => {
      if (activeUploadsRef.current.has(transferId)) {
        activeUploadsRef.current.delete(transferId);
        setUploadProgress((prev) => {
          const copy = { ...prev };
          delete copy[transferId];
          return copy;
        });
        showToast("Upload cancelled", "info");
      }

      queueRef.current = queueRef.current.filter((file) => {
        const fileTransferId = `${Date.now()}-${file.name}`;
        return fileTransferId !== transferId;
      });
    },
    [setUploadProgress, showToast],
  );

  return {
    sendFiles,
    sendFile: sendFiles,
    getQueueStatus,
    cancelUpload,
    activeUploads: activeUploadsRef.current.size,
    queuedFiles: queueRef.current.length,
  };
};
