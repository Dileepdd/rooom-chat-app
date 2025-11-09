import React, { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  function showToast(type, message) {
    setToast({ type, message });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });

      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        showToast("success", "Login successful!");
        setTimeout(() => navigate("/rooms"), 1000);
      } else {
        showToast("error", res.data?.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        err.response?.data?.message || "Something went wrong, try again"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Welcome Back 👋
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
