"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Users, Info, Settings, Trash2, Shield, ShieldOff } from "lucide-react";
import Header from "@/components/ui/Header";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { IRoom } from "@/types/room";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import { timeAgo } from "@/utils/date";
import Image from "next/image";

export default function RoomChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { on, off, sendMessage, joinRoom, leaveRoom } = useSocket();
  const [room, setRoom] = useState<IRoom | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<IRoom>>(`/rooms/${id}`);
      if (!res.data.error) {
        setRoom(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load room details");
    }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<any[]>>(`/room-messages/${id}`);
      if (!res.data.error) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoomDetails();
    fetchMessages();
    joinRoom(Number(id));

    const handleNewRoomMessage = (data: { roomId: number; message: any }) => {
      if (data.roomId === Number(id)) {
        setMessages((prev) => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    on("newRoomMessage", handleNewRoomMessage);

    return () => {
      leaveRoom(Number(id));
      off("newRoomMessage", handleNewRoomMessage);
    };
  }, [id, fetchRoomDetails, fetchMessages, on, off, joinRoom, leaveRoom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!content.trim()) return;
    sendMessage({
      roomId: Number(id),
      content,
    });
    setContent("");
  };

  const toggleAnonymous = async () => {
    try {
      const res = await api.post(`/rooms/${id}/toggle-anonymous`);
      if (res.data.error) toast.error(res.data.message);
      else {
        toast.success(`Anonymous mode ${res.data.data.anonymous_mode ? "enabled" : "disabled"}`);
        setRoom(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to toggle anonymous mode");
    }
  };

  const dissolveRoom = async () => {
    if (!confirm("Are you sure you want to dissolve this room? This cannot be undone.")) return;
    try {
      const res = await api.delete(`/rooms/${id}`);
      if (!res.data.error) {
        toast.success("Room dissolved");
        router.push("/rooms");
      }
    } catch (err) {
      toast.error("Failed to dissolve room");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-teal-500">Loading Gossip...</div>;
  if (!room) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Room not found</div>;

  const isOwner = user?.id === room.owner[0]?.id;

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <Header />
      <div className="flex-1 flex flex-col pt-28 pb-4 max-w-6xl mx-auto w-full px-4 overflow-hidden">
        {/* Room Header */}
        <div className="flex items-center justify-between py-4 border-b border-teal-500/20 bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-teal-500/30">
                <Image src={room.photo || "/default-room.png"} alt={room.name} width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-fredoka flex items-center gap-2">
                  {room.name}
                  {room.is_disposable && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Disposable</span>}
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                   <Users className="w-3 h-3" /> {room.members?.length || 0} gossipers
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <button 
                  onClick={toggleAnonymous}
                  className={`p-2 rounded-xl transition-colors ${room.anonymous_mode ? "bg-teal-500/20 text-teal-400" : "bg-zinc-900 text-gray-400 hover:text-white"}`}
                  title="Toggle Anonymous Mode"
                >
                  {room.anonymous_mode ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={dissolveRoom}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                  title="Dissolve Room"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4 scroll-smooth pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 grayscale opacity-50">
               <Info className="w-12 h-12 mb-2" />
               <p className="text-sm">No gossip yet. Be the first to speak!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender?.id === user?.id ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!room.anonymous_mode && msg.sender?.id !== user?.id && (
                    <>
                      {msg.sender?.photo ? (
                        <Image src={msg.sender.photo} alt={msg.sender.username} width={16} height={16} className="rounded-full" />
                      ) : (
                        <div className="w-4 h-4 bg-teal-500 rounded-full" />
                      )}
                      <span className="text-[10px] text-gray-500 font-medium">@{msg.sender?.username}</span>
                    </>
                  )}
                  {room.anonymous_mode && msg.sender?.id !== user?.id && (
                    <span className="text-[10px] text-teal-500 font-medium italic opacity-70">Anonymous Gossip</span>
                  )}
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  msg.sender?.id === user?.id 
                    ? "bg-teal-600 text-white rounded-tr-none shadow-lg shadow-teal-500/10" 
                    : "bg-zinc-900 text-gray-200 rounded-tl-none border border-white/5"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-[9px] text-gray-600 mt-1 px-1">{timeAgo(msg.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="py-4 border-t border-teal-500/10">
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 focus-within:border-teal-500/30 transition-all">
            <input 
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={room.anonymous_mode ? "Gossip anonymously..." : "Share some gossip..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 placeholder:text-gray-600"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!content.trim()}
              className="bg-teal-500 hover:bg-teal-400 text-black p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-600 mt-3 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> All gossip is encrypted and gasless.
          </p>
        </div>
      </div>
    </div>
  );
}
