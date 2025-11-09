import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatPane from "../components/ChatPane";
import RoomDrawer from "./RoomDrawer";
import api from "../services/api";
import Toast from "../components/Toast";

export default function ChatLayout() {
  const [rooms, setRooms] = useState([]);
  const [cachedRooms, setCachedRooms] = useState({
    all: [],
    direct: [],
    group: [],
  });
  const [activeRoom, setActiveRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [roomType, setRoomType] = useState(""); // "", "direct", "group"
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);

  // 🧠 Show temporary toast message
  function showToast(type, message) {
    setToast({ type, message });
  }

  // 🧩 Load user
  useEffect(() => {
    const cached = localStorage.getItem("user");
    if (cached) setUser(JSON.parse(cached));
    else fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await api.get("/api/user/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      showToast("error", "Session expired, please login again");
    }
  }

  // 🧩 Handle tab switching
  useEffect(() => {
    // reset fetch guards and pagination on tab switch
    isFetchingRef.current = false;
    setHasMore(true);
    setPage(1);

    const cached = getCachedRooms(roomType);
    if (cached.length > 0) {
      // use cache immediately
      setRooms(cached);
    } else {
      // fetch fresh for this tab
      fetchRooms(1, true);
    }
  }, [roomType]);

  // 🧩 Helper: get cached rooms for tab
  const getCachedRooms = (type) => {
    if (type === "direct") return cachedRooms.direct || [];
    if (type === "group") return cachedRooms.group || [];
    return cachedRooms.all || [];
  };

  // 🧩 Fetch rooms
  async function fetchRooms(currentPage = 1, reset = false) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);

    try {
      let endpoint = `/api/room?page=${currentPage}&limit=20`;

      if (roomType === "direct") endpoint += "&type=direct";
      else if (roomType === "group") endpoint += "&type=group";

      const res = await api.get(endpoint);
      let newRooms = res.data?.data || [];
      const totalPages = res.data?.meta?.totalPages || 1;

      // update rooms
      setRooms((prev) => (reset ? newRooms : [...prev, ...newRooms]));

      // update cache for this tab
      const cacheKey = roomType || "all";
      setCachedRooms((prev) => ({
        ...prev,
        [cacheKey]: reset ? newRooms : [...(prev[cacheKey] || []), ...newRooms],
      }));

      setHasMore(currentPage < totalPages);
      setPage(currentPage);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      showToast("error", "Failed to fetch rooms");
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  }

  // 🧩 Infinite Scroll
  const handleScroll = (e) => {
    const nearBottom =
      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;

    if (nearBottom && hasMore && !isFetchingRef.current) {
      const nextPage = page + 1;
      fetchRooms(nextPage);
    }
  };

  // 🧩 When a new room is created
  function handleRoomCreated(room) {
    const typeKey = room.isGroup ? "group" : "direct";

    // clear cache for safety
    setCachedRooms({
      all: [],
      direct: [],
      group: [],
    });

    // refresh rooms for the current tab
    setRooms((prev) => [room, ...prev]);
    setShowDrawer(false);
    showToast("success", "Room created!");
    fetchRooms(1, true);
  }

  function handleRoomUpdated(update) {
    // if called with "refresh" → force backend refetch
    if (update === "refresh") {
      refreshRoomsAfterMessage();
      return;
    }

    // otherwise just merge the update (used for local instant updates)
    const updateCache = (list) =>
      list.map((r) => (r._id === update._id ? { ...r, ...update } : r));

    setRooms((prev) => updateCache(prev));
    setCachedRooms((prev) => ({
      all: updateCache(prev.all),
      direct: updateCache(prev.direct),
      group: updateCache(prev.group),
    }));
  }

  // 🧹 Clears cache for current tab and refetches rooms fresh
  let refreshTimer;
  function refreshRoomsAfterMessage() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      const key = roomType || "all";
      setCachedRooms((prev) => ({ ...prev, [key]: [] }));
      fetchRooms(1, true);
    }, 500);
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        rooms={rooms}
        user={user}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        onAdd={() => setShowDrawer(true)}
        roomType={roomType}
        setRoomType={setRoomType}
        onScroll={handleScroll}
        isFetching={isFetching}
      />

      {/* Chat Panel */}
      <div className="flex-1">
        {activeRoom ? (
          <ChatPane room={activeRoom} onRoomUpdated={handleRoomUpdated} />
        ) : isFetching ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Loading chats...
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center bg-gray-50">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <div className="text-gray-600 text-lg font-medium mb-1">
              Select or create a chat
            </div>
            <p className="text-gray-400 text-sm">
              Start messaging your teammates in real time
            </p>
          </div>
        )}
      </div>

      {/* Drawer */}
      {showDrawer && (
        <RoomDrawer
          onClose={() => setShowDrawer(false)}
          onRoomCreated={handleRoomCreated}
          existingRooms={rooms}
        />
      )}
    </div>
  );
}
