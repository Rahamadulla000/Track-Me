import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, updateProfileSuccess, setAuthError, setAuthLoading } from "../redux/store";
import api from "../services/api";
import { User as UserIcon, Mail, KeyRound, Save, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    dispatch(setAuthError(null));

    if (password && password !== confirmPassword) {
      dispatch(setAuthError("Passwords do not match"));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const payload: any = { name, email };
      if (password) {
        payload.password = password;
      }

      const response = await api.put("/api/profile", payload);
      const { token, user: updatedUser } = response.data;
      
      dispatch(updateProfileSuccess({ token, user: updatedUser }));
      setSuccessMsg("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to update profile. Email might be in use.";
      dispatch(setAuthError(errMsg));
    }
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
  };

  return (
    <motion.div 
      id="profile-page" 
      className="max-w-4xl mx-auto px-4 py-8 space-y-6 relative"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 geometric-dots -z-10 pointer-events-none opacity-40"></div>
      <motion.div variants={panelVariants}>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white tracking-tight font-display">Account Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wider">Manage your identity credentials and security preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Card Summary */}
        <motion.div className="md:col-span-4 space-y-4" variants={panelVariants}>
          <motion.div 
            className="geo-card p-6 text-center space-y-4"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20 flex items-center justify-center mx-auto text-xl font-bold font-mono">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white font-display">{user?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{user?.email}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-850">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-mono ${
                user?.role === "admin" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
              }`}>
                {user?.role} Account
              </span>
            </div>
          </motion.div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded text-xs space-y-2 text-slate-500 font-mono">
            <h4 className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
              <ShieldAlert className="w-4 h-4 text-blue-500" /> Security Tip
            </h4>
            <p className="leading-relaxed">
              Ensure you choose a complex password to protect your location streams from unauthorized eyes.
            </p>
          </div>
        </motion.div>

        {/* Update Profile Form */}
        <motion.div className="md:col-span-8 geo-card p-6 md:p-8" variants={panelVariants}>
          <AnimatePresence>
            {successMsg && (
              <motion.div 
                className="mb-6 p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs flex gap-3 items-center font-mono"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {error && (
              <motion.div 
                className="mb-6 p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex gap-3 items-start font-mono"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-800 pt-5 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Change Password (Optional)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-mono">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-mono">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-6 rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <Save className="w-3.5 h-3.5" /> Save Profile Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
