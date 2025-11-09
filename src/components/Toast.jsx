import React, { useEffect } from "react";

export default function Toast({ type = "info", message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // auto hide after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-transform transform animate-slide-in ${colors[type]}`}
    >
      {message}
    </div>
  );
}
