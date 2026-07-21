import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { MapPin, Shield, Users, Compass, Activity, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const { user } = useSelector((state: RootState) => state.auth);

  const demoAccounts = [
    { role: "User Account", email: "user@trackme.com", pass: "password123", color: "blue" },
    { role: "Admin Account", email: "admin@trackme.com", pass: "admin123", color: "emerald" },
  ];

  // Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4, 
      boxShadow: "0 10px 30px -15px rgba(59, 130, 246, 0.15)",
      transition: { duration: 0.25, ease: "easeInOut" }
    }
  };

  return (
    <motion.div 
      id="home-page" 
      className="max-w-7xl mx-auto px-4 py-12 md:py-20 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Decorative dot matrix background */}
      <div className="absolute inset-0 geometric-dots -z-10 pointer-events-none opacity-60"></div>
      
      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24 relative">
        <motion.div className="lg:col-span-7 space-y-6" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" /> Real-time Location Sharing & Safety
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight font-display">
            Keep Your Loved Ones Safe, <br />
            <span className="text-blue-600 dark:text-blue-400 relative inline-block">
              Track in Real-Time
              <motion.span 
                className="absolute bottom-0 left-0 h-1 bg-blue-500/30 rounded"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              ></motion.span>
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            TrackMe is a robust location tracking platform enabling live GPS updates directly from your mobile browser, route history visualization, and advanced dashboard controls.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded shadow transition-all flex items-center gap-2 border border-blue-600 hover:translate-x-1"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded shadow transition-all flex items-center gap-2 border border-blue-600 hover:translate-x-1"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:border-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded transition-all"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Floating Mockup / Stats Card */}
        <motion.div 
          className="lg:col-span-5 relative"
          variants={itemVariants}
        >
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 opacity-20 blur-xl"></div>
          <motion.div 
            className="relative geo-card p-6 md:p-8 space-y-6"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold font-mono flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              Demo Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Test out all user and administrator role privileges instantly with preloaded accounts.
            </p>
            <div className="space-y-4">
              {demoAccounts.map((account) => (
                <motion.div
                  key={account.role}
                  className="p-4 rounded border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded ${
                        account.color === "blue"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {account.role}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Email:</span>
                      <span className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-1.5 py-0.5 rounded text-[11px] select-all font-medium">
                        {account.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Password:</span>
                      <span className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-1.5 py-0.5 rounded text-[11px] select-all font-medium">
                        {account.pass}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="pt-2 text-center border-t border-slate-200/60 dark:border-slate-800">
              <Link to="/login" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono uppercase tracking-wider font-bold">
                Go to Sign In &rarr;
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Feature section */}
      <motion.div className="border-t border-slate-200/60 dark:border-slate-800 pt-16" variants={itemVariants}>
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-blue-500 font-mono font-bold">Capabilities Matrix</span>
          <h2 className="text-3xl font-bold font-display text-slate-950 dark:text-white">Core Architecture</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Engineered with complete client-server precision to serve responsive real-time capabilities.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div 
            className="geo-card p-6 space-y-4"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 p-2.5 rounded border border-blue-500/20 w-fit">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-display">Live Geolocation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Secures your current coordinates directly from your mobile device or desktop browser using the HTML5 Geolocation API.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            className="geo-card p-6 space-y-4"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded border border-emerald-500/20 w-fit">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-display">Travel Path Tracking</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Records updates in our backend, compiling detailed tracking history lines to chart previous travel paths interactively.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            className="geo-card p-6 space-y-4"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 p-2.5 rounded border border-indigo-500/20 w-fit">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-display">Supervision Portal</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Provides administrator authorization to monitor active users, inspect records, delete accounts, and export location history.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
