import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import InteractiveMap from "../components/InteractiveMap";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft, ShieldAlert, Navigation } from "lucide-react";
import { motion } from "motion/react";

export default function LiveTracking() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isActive, currentLocation, history } = useSelector((state: RootState) => state.tracking);

  const mapPathCoords: [number, number][] = history.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  return (
    <motion.div 
      id="live-tracking-page" 
      className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Mini info drawer */}
      <motion.div 
        className="w-full md:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col shrink-0 justify-between space-y-6"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <div className="space-y-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline font-mono uppercase tracking-wider">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
 
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2 font-display">
              <Navigation className="w-5 h-5 text-blue-500 animate-pulse" /> Full Screen Map
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Immersive real-time positioning stage</p>
          </div>

          {isActive ? (
            <motion.div 
              className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS Active
              </div>
              <div className="mt-3 text-xs space-y-1 font-mono">
                <div><strong>Latitude:</strong> {currentLocation?.latitude.toFixed(5)}</div>
                <div><strong>Longitude:</strong> {currentLocation?.longitude.toFixed(5)}</div>
                {currentLocation?.accuracy && <div><strong>Accuracy:</strong> ±{currentLocation.accuracy}m</div>}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="p-4 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                GPS Inactive
              </div>
              <p className="mt-2 text-xs leading-relaxed">
                Go back to the Console dashboard to enable your mobile Geolocation sharing engine.
              </p>
            </motion.div>
          )}

          {/* Path history stats */}
          <div className="space-y-2 font-mono">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Route Ledger</h3>
            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded p-3 text-xs">
              <span className="text-slate-500">Collected points</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{history.length} pts</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 border-t border-slate-200/60 dark:border-slate-800 pt-4 leading-relaxed">
          <ShieldAlert className="w-4 h-4 shrink-0 text-blue-500" />
          <span>Updates are transmitted securely using high-grade JWT tokens.</span>
        </div>
      </motion.div>

      {/* Main Map Stage */}
      <div className="flex-grow h-full bg-slate-100 dark:bg-slate-950 relative">
        <InteractiveMap
          latitude={currentLocation?.latitude}
          longitude={currentLocation?.longitude}
          accuracy={currentLocation?.accuracy}
          path={mapPathCoords}
          isDarkMode={document.documentElement.classList.contains("dark")}
        />
      </div>
    </motion.div>
  );
}
