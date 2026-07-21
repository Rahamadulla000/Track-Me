import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { loginSuccess, setAuthLoading, setAuthError } from "../redux/store";
import api from "../services/api";
import { KeyRound, Mail, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(setAuthError("Email and password are required"));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const response = await api.post("/api/login", { email, password });
      const { token, user } = response.data;
      dispatch(loginSuccess({ token, user }));
      
      // Route based on role
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Invalid credentials. Please try again.";
      dispatch(setAuthError(errMsg));
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <motion.div 
      id="login-page" 
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
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-950 dark:text-white">Welcome Back</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to start sharing and tracking locations</p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Quick Click Demo Filler */}
          <div className="border-t dark:border-slate-800 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-center uppercase tracking-wider text-slate-400 font-mono">Or use instant demo login</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoFill("user@trackme.com", "password123")}
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider py-2 rounded transition-all border border-blue-100/50 dark:border-blue-900/40 cursor-pointer font-mono"
              >
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("admin@trackme.com", "admin123")}
                className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider py-2 rounded transition-all border border-emerald-100/50 dark:border-emerald-900/40 cursor-pointer font-mono"
              >
                Demo Admin
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
