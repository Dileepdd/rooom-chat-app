import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./services/api";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatLayout from "./pages/ChatLayout";
import Toast from "./components/Toast";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // ✅ Restore token on app mount
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // ✅ Global 401 interceptor (token expired or invalid)
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete api.defaults.headers.common["Authorization"];
          setToast({
            type: "error",
            message: "Session expired. Please log in again.",
          });
          setTimeout(() => (window.location.href = "/login"), 2000);
        }
        return Promise.reject(err);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <>
      {/* ✅ Global Toast always above everything */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/rooms"
            element={
              <RequireAuth>
                <ChatLayout showToast={setToast} />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/rooms" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
