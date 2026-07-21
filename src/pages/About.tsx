import { Link } from "react-router-dom";
import { Compass, GitBranch, ShieldAlert, Cpu, Heart } from "lucide-react";
import { motion } from "motion/react";

export default function About() {
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
      scale: 1.01, 
      y: -3, 
      boxShadow: "0 10px 25px -15px rgba(59, 130, 246, 0.12)",
      transition: { duration: 0.25, ease: "easeInOut" }
    }
  };

  return (
    <motion.div 
      id="about-page" 
      className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-12 relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 geometric-dots -z-10 pointer-events-none opacity-40"></div>
      
      <motion.div className="space-y-4 text-center" variants={itemVariants}>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white font-display">About TrackMe</h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A secure, low-latency, and interactive location sharing and tracking infrastructure designed for mobile-first safety.
        </p>
      </motion.div>

      <motion.div 
        className="geo-card p-6 md:p-8 space-y-6" 
        variants={itemVariants}
        whileHover={{ y: -2 }}
      >
        <h2 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2 font-display">
          <ShieldAlert className="w-5 h-5 text-blue-500" />
          The Mission & Core Safety Philosophy
        </h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs md:text-sm">
          TrackMe is built to resolve real-world security challenges. Whether sharing your journey with family members during a solo trip, monitoring safety routes, or orchestrating small-scale team field activities, TrackMe ensures your coordinates are securely saved and rendered in real-time.
        </p>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs md:text-sm">
          By utilizing standard HTML5 browser geolocation protocols, users avoid the need to install intrusive binary phone applications. Simply load the app in your mobile web browser, start tracking, and securely lock your device.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          className="geo-card p-6 space-y-3"
          variants={itemVariants}
          whileHover={{ scale: 1.01, y: -3 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        >
          <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-2 rounded border border-indigo-500/20 w-fit">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="font-bold text-sm md:text-base text-slate-950 dark:text-white font-display">Technical Architecture</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Engineered with a modern client-server layout. The React frontend leverages Redux Toolkit state storage, standard Axios API calls, and Leaflet JS mapping overlays. The unified Express Node.js container facilitates JWT authorization, secure bcrypt hashing, and robust file-backed persistent SQLite schemas.
          </p>
        </motion.div>

        <motion.div 
          className="geo-card p-6 space-y-3"
          variants={itemVariants}
          whileHover={{ scale: 1.01, y: -3 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        >
          <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2 rounded border border-rose-500/20 w-fit">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm md:text-base text-slate-950 dark:text-white font-display">Privacy First Design</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Privacy control is explicitly delegated to the user. Start and stop tracking whenever necessary. When tracking is halted, zero data is compiled. Users can purge their entire location ledger instantly at any time. Administrators also possess manual switches to pause tracking profiles securely.
          </p>
        </motion.div>
      </div>

      <motion.div className="text-center pt-4" variants={itemVariants}>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold"
        >
          <Compass className="w-4 h-4" /> Back to Home Page
        </Link>
      </motion.div>
    </motion.div>
  );
}
