import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { Check, CheckCheck } from "lucide-react";
import Avatar from "./Avatar";

export default function ChatPane({ room, onRoomUpdated }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // auto-scroll when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (room?._id) fetchMessages(room._id);
  }, [room?._id]);

  useEffect(() => {
    scrollToBottom();
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
    }
  }

  async function handleSend() {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      const res = await api.post("/api/message", {
        roomId: room._id,
        content,
      });
      const newMsg = res.data;

      // ✅ Update local chat immediately
      setMessages((prev) => [...prev, newMsg]);

      onRoomUpdated?.("refresh");

      // ✅ Instantly update sidebar room (no API fetch)
      onRoomUpdated?.({
        ...room,
        lastMessage: newMsg.content,
        lastMessageAt: newMsg.createdAt,
        lastMessageSenderId: newMsg.senderId,
        deliveredTo: newMsg.deliveredTo || [],
        seenBy: newMsg.seenBy || [],
      });
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }

  // ✅ Tick status
  function getTickStatus(msg) {
    const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
    if (!isMine) return null;
    if (msg.seenBy?.length > 0)
      return <CheckCheck size={14} className="text-blue-500 inline" />;
    if (msg.deliveredTo?.length > 0)
      return <CheckCheck size={14} className="text-gray-400 inline" />;
    return <Check size={14} className="text-gray-400 inline" />;
  }

  // ✅ Render each message
  const renderMessage = (msg, index) => {
    const mine = msg.senderId === user?.id || msg.senderId === user?._id;
    const isGroup = room?.isGroup;
    const showAvatar =
      isGroup &&
      !mine &&
      (index === messages.length - 1 ||
        messages[index + 1]?.senderId !== msg.senderId);

    return (
      <div
        key={msg._id}
        className={`flex ${
          mine ? "justify-end" : "justify-start"
        } mb-2 items-end`}
      >
        {!mine && showAvatar && (
          <Avatar
            user={room.members?.find((m) => m._id === msg.senderId)}
            size={28}
            className="mr-2"
          />
        )}

        <div
          className={`max-w-xs md:max-w-md px-3 py-2 rounded-2xl text-sm shadow-sm relative ${
            mine
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
        >
          <span className="break-words block">{msg.content}</span>
          <div
            className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm sticky top-0 z-10">
        <Avatar
          user={
            room.isGroup
              ? { firstname: room.name?.[0], lastname: "" }
              : room.members?.find((m) => m._id !== user?._id)
          }
          size={40}
        />
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800">
            {room?.name ||
              room.members?.find((m) => m._id !== user?._id)?.firstname ||
              "Chat"}
          </h2>
          <p className="text-xs text-gray-500">
            {room?.isGroup
              ? `${room.members?.length || 0} members`
              : "Direct chat"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((msg, i) => renderMessage(msg, i))
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-white">
        <input
          type="text"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={sending}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !messageText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
