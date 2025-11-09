import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  LogOut,
  User,
  Settings,
  Check,
  CheckCheck,
} from "lucide-react";
import Avatar from "./Avatar";
import { formatRelativeTime } from "../utils/timeUtils";

export default function Sidebar({
  rooms,
  user,
  activeRoom,
  setActiveRoom,
  onAdd,
  roomType,
  setRoomType,
  onScroll,
  isFetching,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef();

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <aside className="w-80 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          {user && <Avatar user={user} size={36} />}
          <div>
            <div className="font-semibold text-gray-800 text-sm">
              {user ? `${user.firstname} ${user.lastname}` : ""}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition"
            title="New Chat"
          >
            +
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-fade-in z-20">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  onClick={() => {
                    setMenuOpen(false);
                    alert("Profile page coming soon 🧑‍💻");
                  }}
                >
                  <User size={16} /> Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  onClick={() => {
                    setMenuOpen(false);
                    alert("Settings page coming soon ⚙️");
                  }}
                >
                  <Settings size={16} /> Settings
                </button>
                <hr className="my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowConfirm(true);
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-around border-b bg-white text-sm font-medium text-gray-600">
        {["", "direct", "group"].map((type) => (
          <button
            key={type}
            onClick={() => setRoomType(type)}
            className={`flex-1 py-2 transition-colors ${
              roomType === type
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "hover:text-blue-500"
            }`}
          >
            {type === "" ? "All" : type === "direct" ? "Individual" : "Group"}
          </button>
        ))}
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]" onScroll={onScroll}>
        {rooms.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No rooms found</div>
        ) : (
          rooms.map((room) => {
            console.log("Logged in user:", user);

            const members = room.members || [];
            const otherMembers = members.filter(
              (m) => m._id !== user?._id && m.id !== user?.id
            );
            const displayUser = !room.isGroup ? otherMembers[0] || user : null;

            return (
              <div
                key={room._id}
                onClick={() => setActiveRoom(room)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                  activeRoom?._id === room._id
                    ? "bg-blue-100 font-semibold"
                    : "text-gray-700"
                }`}
              >
                <Avatar
                  user={
                    room.isGroup
                      ? { firstname: room.name?.[0], lastname: "" }
                      : room.members?.find((m) => m._id !== user?._id)
                  }
                  size={42}
                />

                <div className="flex-1 min-w-0">
                  {/* Room Name */}
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900 truncate">
                      {room.name}
                    </div>

                    {/* Time (lastMessageAt) */}
                    {room.lastMessageAt && (
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {formatRelativeTime(room.lastMessageAt)}
                      </div>
                    )}
                  </div>

                  {/* Last message or fallback */}
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    {room.lastMessage &&
                      room.lastMessageSenderId?.toString() ===
                        user?.id?.toString() && (
                        <>
                          {room.seenBy?.length > 0 ? (
                            <CheckCheck size={14} className="text-blue-500" />
                          ) : room.deliveredTo?.length > 0 ? (
                            <CheckCheck size={14} className="text-gray-500" />
                          ) : (
                            <Check size={14} className="text-gray-500" />
                          )}
                        </>
                      )}
                    <span className="truncate">{room.lastMessage}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isFetching && (
          <div className="text-center text-gray-400 py-3 text-sm">
            Loading more...
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
