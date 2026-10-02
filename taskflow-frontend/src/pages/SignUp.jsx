import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/signup", { name, email, password });
      await login(email, password);
      navigate("/");
    } catch (er) {
      setErr(er.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        {err && (
          <p className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3">
            {err}
          </p>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
          className="w-full border p-2.5 rounded mb-3 outline-none focus:border-black"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          className="w-full border p-2.5 rounded mb-3 outline-none focus:border-black"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 char)"
          required
          className="w-full border p-2.5 rounded mb-4 outline-none focus:border-black"
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-sm mt-4 text-center text-gray-600">
          Already have account?{" "}
          <Link to="/login" className="underline font-medium text-black">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
