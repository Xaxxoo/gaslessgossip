"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowLeft,
  Paperclip,
  MessageCircleWarningIcon,
  ArrowRightCircleIcon,
  UserX,
  Flag
} from "lucide-react"
import Header from "@/components/ui/Header";

import Image from "next/image";
import SendTokenDialog from "@/components/SendTokenDialog";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";
import { IChat, UserSearchResult } from "@/types/chat";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/utils/date";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import ReportModal from "@/components/ReportModal";

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") ?? null;
  const username = searchParams.get("u") ?? null;
  const { user } = useAuth();
  const { on, off, sendMessage } = useSocket();
  const [message, setMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [chatId, setChatId] = useState<number | null>(cid ? Number(cid) : null)
  const [chat, setChat] = useState<IChat | null>(null);
  const [chats, setChats] = useState<IChat[]>([]);
  const [userSearch, setUserSearch] = useState<string>(username ? String(username) : "")
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSendTokenOpen, setIsSendTokenOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // Socket listener for new messages
  useEffect(() => {
    const handleNewMessage = (data: { chatId: number; message: any }) => {
      if (data.chatId === chatId) {
        setChat((prev) => {
          if (!prev) return prev;
          // Avoid duplicate messages
          if (prev.messages.find(m => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message]
          };
        });
      }
      // Update sidebar preview
      setChats((prev) => 
        prev.map((c) => 
          c.id === data.chatId 
            ? { ...c, lastMessage: { content: data.message.content, createdAt: data.message.createdAt, senderId: data.message.senderId } } 
            : c
        )
      );
    };

    on("newMessage", handleNewMessage);
    return () => off("newMessage", handleNewMessage);
  }, [chatId, on, off]);

  // Fetch all chats on load
  const getAllChats = async () => {
    try {
      const res = await api.get<ApiResponse>("/chats/me")
      if (!res.data.error) setChats(res.data.data)
    } catch {
      toast.error("Failed to fetch chats")
    }
  }
  useEffect(() => {
    getAllChats()
  }, [])


  const getChat = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse>(`/chats/${chatId}`)
      if (!res.data.error) {
        const chatData = res.data.data;
        const me = chatData.sender.username === user?.username ? chatData.receiver : chatData.sender;
        setChat(chatData)
        setSelectedUser(me)
      }
    } catch {
      toast.error("Failed to fetch chat")
    }
  }, [chatId, user?.username]);

  // Get a single chat
  useEffect(() => {
    if (!chatId) {
      setChat(null)
      setSelectedUser(null)
      return;
    };
    getChat();
  }, [chatId, getChat])

  const searchUser = async (u: string) => {
    try {
      const res = await api.get<ApiResponse>(`/users/search?username=${u}`)
      const data = res.data.error ? [] : res.data.data
      if (data.length > 0) {
        data.map((user: UserSearchResult) => {
          if (user && (user?.username).toLowerCase().trim() === u.toLowerCase().trim()) {
            setSelectedUser(user)
          }
        })
      }
      return data;
    } catch {
      return []
    }
  }
  // User search
  useEffect(() => {
    if (userSearch.length < 3) {
      setUserSearchResults([])
      return
    }

    let isMounted = true
    const getSearchUser = async () => {
      setIsLoading(true)
      try {
        const data = await searchUser(userSearch);
        if (isMounted) {
          setUserSearchResults(data)
        }
      } catch {
        setIsLoading(false)
      }
    }

    const delay = setTimeout(getSearchUser, 500)
    return () => {
      isMounted = false
      clearTimeout(delay)
    }
  }, [userSearch])


  // Create new chat
  const handleCreateNewChat = async (username: string | null) => {
    if (!username) {
      toast.error("Cannot initiate chat")
      return
    }
    try {
      const res = await api.post<ApiResponse>("/chats", { username })
      if (!res.data.error) {
        toast.success("Chat initiated")
        setChatId(res.data.data.id)
      } else {
        toast.error("Failed to initiate chat")
      }
    } catch {
      toast.error("Failed to initiate chat")
    }
  }

  // send new message
  const handleSendMessage = () => {
    if (!message.trim() || !chatId) return;
    
    sendMessage({
      chatId,
      content: message,
    });
    setMessage("");
  }

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.post(`/users/${selectedUser.id}/block`);
      if (res.data.error) {
        toast.error(res.data.message || "Failed to block user");
      } else {
        toast.success(`Blocked ${selectedUser.username}`);
        setChatId(null);
        setSelectedUser(null);
        getAllChats();
      }
    } catch (err) {
      toast.error("Error blocking user");
    }
  };

  const renderUserAvatar = (photo?: string | null) => (
    photo ? (
      <Image src={photo} alt="photo" width={40} height={40} className="rounded-full object-cover" />
    ) : (
      <span className="inline-block size-10 overflow-hidden rounded-full bg-gray-800 outline outline-white/10">
        <svg fill="currentColor" viewBox="0 0 24 24" className="size-full text-gray-600">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.9 0 9.26 2.35 12 5.99zM16 9a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>
    )
  )

  return (
    <div className="relative">
      <Header />
      <div className="w-full flex bg-black mt-28 mb-28 lg:mb-0 relative min-h-[calc(100vh-112px)]">
        {/* Sidebar - Shows on desktop always, on mobile only when no chat selected */}
        <aside
          className={`${chatId === null ? "flex" : "hidden"
            } md:flex w-full md:w-[320px] h-full min-h-[calc(100vh-112px)] sticky top-28 z-40`}
        >
          <div className="w-full h-full flex-col flex relative bg-black text-white border-r border-teal-500/30">
            {/* Search Header */}
            <div className="w-full h-[72px] flex items-center gap-2 p-4 border-b border-teal-500/30">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full border-1 border-teal-400/50 rounded-full bg-teal-900/10 py-2.5 pr-10 pl-4 text-sm text-light-grey placeholder:text-light-grey/50 outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="w-full flex-1 overflow-y-auto">
              {userSearchResults.length === 0 && chats ? (
                chats.length > 0 ?
                  chats.map((chatItem) => {
                    const recipient =
                      user?.username === chatItem.sender.username
                        ? { ...chatItem.receiver, chat_id: chatItem.id }
                        : { ...chatItem.sender, chat_id: chatItem.id }

                    return (
                      <div
                        key={chatItem.id}
                        onClick={() => {
                          setSelectedUser(recipient)
                          setChatId(chatItem.id)
                        }}
                        className={`${chatItem.id == chatId && 'bg-teal-900/25'} flex items-center gap-3 p-4 hover:bg-gray-900/50 cursor-pointer border-b border-gray-800/30 transition-colors`}
                      >
                        {renderUserAvatar(recipient.photo)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center font-fredoka justify-between">
                            <span className="font-medium text-sm text-white truncate">{recipient.username}</span>
                            {chatItem.lastMessage && (
                              <span className="text-[10px] text-gray-500">{timeAgo(chatItem.lastMessage?.createdAt)}</span>
                            )}
                          </div>
                          {chatItem.lastMessage && (
                            <p className="text-xs font-fredoka text-gray-400 truncate mt-0.5">{chatItem.lastMessage?.content}</p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          {chatItem.unreadCount && chatItem.unreadCount > 0 ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-teal-500 text-black w-4 h-4 text-[10px] font-bold">
                              {chatItem.unreadCount}
                            </span>
                          ) : <></>}
                        </div>
                      </div>
                    )
                  }) : <div className="p-8 text-center text-gray-500 text-sm">No conversations yet</div>

              ) : (
                userSearchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u)
                      setChatId(u.chat_id)
                      setUserSearch("")
                      setUserSearchResults([])
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-900 cursor-pointer border-b border-gray-800/50"
                  >
                    {renderUserAvatar(u.photo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center font-fredoka justify-between">
                        <span className="font-medium text-sm text-white">{u.username}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
        </aside>

        {/* Main Chat Section - Shows on desktop always, on mobile only when chat selected */}
        <section
          className={`${selectedUser !== null ? "flex" : "hidden"
            } md:flex flex-1 flex-col w-full h-[calc(100vh-112px)]`}
        >
          {selectedUser ?
            <div className="w-full h-full flex flex-col relative">
              {/* Chat Header */}
              <header className="w-full h-16 flex items-center justify-between text-white px-4 border-b border-teal-500/30 bg-black/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-3">
                  <button className="md:hidden p-1 hover:bg-gray-800 rounded-full" onClick={() => {
                    setChatId(null);
                    getAllChats();
                  }}>
                    <ArrowLeft className="text-gray-400 w-5 h-5" />
                  </button>
                  {renderUserAvatar(selectedUser.photo)}
                  <div>
                    <h2 className="font-semibold text-sm text-white">{selectedUser.username}</h2>
                    <p className="text-[10px] text-teal-500">{selectedUser.title ?? "Gasless Gossip Member"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-500 hover:text-red-500"
                    title="Report User"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleBlockUser}
                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-500 hover:text-red-500"
                    title="Block User"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 flex flex-col overflow-hidden relative">
                {!chatId ?
                  <div className="flex flex-col flex-1 items-center justify-center text-center space-y-4 p-6">
                    <MessageCircleWarningIcon className="w-16 h-16 text-teal-500/50" />
                    <h3 className="text-xl font-semibold text-white font-fredoka">
                      Start a Conversation
                    </h3>
                    <p className="text-gray-400 text-sm max-w-sm">
                      Send a message to start chatting with <span className="text-teal-500">@{selectedUser.username}</span>.
                    </p>
                    <button
                      onClick={() => handleCreateNewChat(selectedUser.username)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-2.5 rounded-full transition-all shadow-lg shadow-teal-500/20"
                    >
                      Initialize Chat
                    </button>
                  </div> :
                  <>
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
                      {chat?.messages && chat.messages.length > 0 ?
                        chat.messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] md:max-w-[70%]`}>
                              <div
                                className={`px-4 py-2.5 shadow-sm ${msg.senderId === user?.id 
                                  ? "bg-teal-900/60 text-white rounded-2xl rounded-tr-none border border-teal-500/20" 
                                  : "bg-zinc-900 text-gray-200 rounded-2xl rounded-tl-none border border-white/5"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <div className={`text-[10px] mt-1 ${msg.senderId === user?.id ? "text-teal-400/70" : "text-gray-500"} flex items-center justify-end gap-1`}>
                                  {timeAgo(String(msg.createdAt))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )) :
                        <div className="flex flex-col flex-1 items-center justify-center text-center space-y-4 p-6">
                          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
                            <MessageCircleWarningIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
                        </div>
                      }
                    </div>

                    <div className="p-4 bg-black border-t border-gray-800/50">
                      <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <button
                          onClick={() => setIsSendTokenOpen(true)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-emerald-500"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            className="text-white placeholder:text-gray-600 bg-zinc-900 w-full py-2.5 rounded-xl pl-4 pr-12 outline-none border border-white/5 focus:border-teal-500/30 transition-all"
                          />
                          <button 
                            type="button" 
                            onClick={handleSendMessage} 
                            disabled={!message.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-500 disabled:text-gray-700 hover:text-teal-400 transition-colors"
                          >
                            <ArrowRightCircleIcon className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                }
              </div>
              <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                reportedId={selectedUser.id}
                reportedUsername={selectedUser.username}
              />
            </div> :
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-2 border border-teal-500/10">
                <MessageCircleWarningIcon size={40} className="text-gray-700" />
              </div>
              <h3 className="text-xl font-medium text-gray-500 font-fredoka">
                Select a conversation
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Pick a friend from the left or search for someone new to start gossiping!
              </p>
            </div>
          }
        </section>
      </div>
      <SendTokenDialog isOpen={isSendTokenOpen} onClose={() => setIsSendTokenOpen(false)} />
    </div>
  )
}
