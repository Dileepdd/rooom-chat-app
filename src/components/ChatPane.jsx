import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { Check, CheckCheck, ArrowLeft, Send } from "lucide-react";
import Avatar from "./Avatar";

export default function ChatPane({ room, onRoomUpdated, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Scroll to bottom smoothly
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  // Load messages on room change
  useEffect(() => {
    if (room?._id) fetchMessages(room._id);
  }, [room?._id]);

  // Auto scroll when new messages appear
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  async function fetchMessages(roomId) {
    try {
      setLoading(true);
      const res = await api.get(`/api/message/${roomId}`);
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 100);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const content = message.trim();
    if (!content) return;

    setMessage(""); // clear input immediately
    setSending(true);

    const tempMsg = {
      _id: Date.now().toString(),
      content,
      senderId: user._id,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom(false);

    try {
      const res = await api.post("/api/message", {
        roomId: room._id,
        content,
      });
      const newMsg = res.data;

      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? newMsg : m))
      );

      onRoomUpdated?.("refresh");
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setSending(false);
      scrollToBottom();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const getTickStatus = (msg) => {
    const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
    if (!isMine) return null;
    if (msg.seenBy?.length > 0)
      return <CheckCheck size={14} className="text-blue-500 inline" />;
    if (msg.deliveredTo?.length > 0)
      return <CheckCheck size={14} className="text-gray-400 inline" />;
    return <Check size={14} className="text-gray-400 inline" />;
  };

  const renderMessage = (msg) => {
    const mine = msg.senderId === user?.id || msg.senderId === user?._id;
    return (
      <div
        key={msg._id}
        className={`flex ${
          mine ? "justify-end" : "justify-start"
        } mb-1 items-end`}
      >
        <div
          className={`inline-flex flex-col items-end rounded-2xl text-sm max-w-xs md:max-w-md leading-snug px-3 py-2 ${
            mine
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
        >
          <div className="break-words whitespace-pre-wrap w-full">
            {msg.content}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] mt-[2px] ${
              mine ? "text-gray-200" : "text-gray-500"
            }`}
          >
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {mine && getTickStatus(msg)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      {/* 🔹 Sticky Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-50 h-14 flex items-center px-4 gap-3 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-2 p-1 rounded-md text-gray-600 hover:bg-gray-100 sm:hidden"
            aria-label="Back"
            disabled={sending || !message.trim()}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <Avatar
          user={
            room.isGroup
              ? { firstname: room.name?.[0], lastname: "" }
              : room.members?.find((m) => m._id !== user?._id)
          }
          size={38}
        />
        <div className="flex flex-col truncate leading-tight">
          <h2 className="text-[15px] font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
            {room?.name ||
              room.members?.find((m) => m._id !== user?._id)?.firstname ||
              "Chat"}
          </h2>
          <p className="text-[11px] text-gray-500 truncate">
            {room?.isGroup
              ? `${room.members?.length || 0} members`
              : "Direct chat"}
          </p>
        </div>
      </div>

      {/* 🔹 Scrollable Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 pt-3 pb-2 scroll-smooth min-h-0"
        style={{
          WebkitOverflowScrolling: "touch",
          transform: "translateZ(0)", // Hardware acceleration for smoother scrolling
        }}
      >
        {loading ? (
          <div className="text-center text-gray-400 mt-10">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Say hi 👋
          </div>
        ) : (
          <div className="min-h-full">
            {messages.map((msg) => renderMessage(msg))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* 🔹 Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t z-40 p-2 sm:p-3 flex-shrink-0">
        <div className=" mx-auto flex items-center gap-2 px-2 sm:px-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            placeholder="Type a message..."
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend(e)}
            className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
          />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSend(e);
            }}
            onClick={(e) => handleSend(e)}
            disabled={sending || !inputRef.current?.value.trim()}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center active:scale-95 select-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
