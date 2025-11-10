import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function RoomDrawer({ onClose, onRoomCreated, existingRooms }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(
          `/api/user?page=1&limit=50${search ? `&search=${search}` : ""}`
        );
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, [search]);

  function toggleUser(user) {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  }

  async function handleCreate() {
    if (selected.length === 0) return;

    // If it's a single user, check for existing chat
    if (selected.length === 1) {
      const existing = existingRooms.find((room) =>
        room.members.some((m) => m._id === selected[0]._id)
      );
      if (existing) {
        onRoomCreated(existing);
        onClose();
        return;
      }
    }

    setLoading(true);
    try {
      const memberIds = selected.map((u) => u._id);
      const isGroup = selected.length > 1;
      let name = "";

      if (isGroup) {
        name = prompt("Enter group name");
      } else {
        const user = selected[0];
        name =
          `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
          user.username;
      }

      const res = await api.post("/api/room", {
        name: name || "New Room",
        members: memberIds,
        isGroup,
      });

      onRoomCreated(res.data.data);
      onClose();
    } catch (err) {
      console.error("Error creating room:", err);
      alert(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 🔹 Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-fadeIn"
        onClick={onClose}
      />

      {/* 🔹 Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-[100] shadow-2xl border-l border-gray-200 flex flex-col animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-lg text-gray-800">New Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              No users found
            </div>
          )}

          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => toggleUser(user)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                selected.some((u) => u._id === user._id)
                  ? "bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <div>
                <div className="font-medium text-gray-800">
                  {user.firstname} {user.lastname}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              {selected.some((u) => u._id === user._id) && (
                <span className="text-blue-600 font-bold text-lg">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white sticky bottom-0">
          <button
            onClick={handleCreate}
            disabled={loading || selected.length === 0}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading || selected.length === 0
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Processing..."
              : selected.length > 1
              ? "Create Group"
              : "Start Chat"}
          </button>
        </div>
      </div>
    </>
  );
}
