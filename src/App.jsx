import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatLayout from "./pages/ChatLayout";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/rooms"
          element={
            <RequireAuth>
              <ChatLayout />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
