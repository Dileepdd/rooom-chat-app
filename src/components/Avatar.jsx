import React from "react";

export default function Avatar({ user, size = 40 }) {
  const initials = (user?.firstname?.[0] || "") + (user?.lastname?.[0] || "");

  const randomColor =
    (user?._id || user?.email || "default")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.firstname || user.username}`}
        className="rounded-full object-cover border border-gray-200"
        style={{ width: size, height: size }}
        onError={(e) => (e.target.style.display = "none")}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold uppercase border border-gray-200"
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${randomColor}, 70%, 50%)`,
      }}
    >
      {initials || "?"}
    </div>
  );
}
