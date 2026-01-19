"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getFromCookie } from "@/lib/cookies";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getFromCookie("token");
    if (!token) return;

    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to websocket");
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        console.log("Disconnected from websocket");
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Connection error:", err.message);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const sendMessage = (data: { chatId?: number; roomId?: number; content: string; recipientId?: number }) => {
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", data);
    }
  };

  const joinRoom = (roomId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", { roomId });
    }
  };

  const leaveRoom = (roomId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("leaveRoom", { roomId });
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return { isConnected, sendMessage, joinRoom, leaveRoom, on, off, socket: socketRef.current };
};
