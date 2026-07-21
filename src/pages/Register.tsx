import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { loginSuccess, setAuthLoading, setAuthError } from "../redux/store";
import api from "../services/api";
import { UserPlus, Mail, KeyRound, User as UserIcon, AlertCircle, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      dispatch(setAuthError("Please fill in all fields"));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const response = await api.post("/api/register", {
        name,
        email,
        password,
        role,
      });
      const { token, user } = response.data;
      dispatch(loginSuccess({ token, user }));
      
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Registration failed. Email might already be taken.";
      dispatch(setAuthError(errMsg));
    }
  };

  return (
    <motion.div 
      id="register-page" 
      className="max-w-md mx-auto px-4 py-12 md:py-20 relative"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="absolute inset-0 geometric-dots -z-10 pointer-events-none opacity-40"></div>
      <motion.div 
        className="geo-card overflow-hidden"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-950 dark:text-white">Create Account</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Join TrackMe and secure your journeys today</p>
          </div>

          {error && (
            <motion.div 
              className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex gap-3 items-start font-mono"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2.5 text-xs font-mono outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2.5 text-xs font-mono outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2.5 text-xs font-mono outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Role Select - Super convenient for testing */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Account Type (Role)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer font-mono ${
                    role === "user"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer font-mono ${
                    role === "admin"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
