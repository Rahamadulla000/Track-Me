import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "../redux/store";
import {
  setTrackingActive,
  setCurrentLocation,
  addHistoryLocation,
  setHistory,
} from "../redux/store";
import api from "../services/api";
import InteractiveMap from "../components/InteractiveMap";
import {
  Play,
  Square,
  MapPin,
  Map,
  History,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  Settings,
  HelpCircle,
  User as UserIcon,
} from "lucide-react";
import { LocationRecord } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isActive, currentLocation, history } = useSelector(
    (state: RootState) => state.tracking
  );

  const [intervalTime, setIntervalTime] = useState<number>(10); // in seconds
  const [lastPostedTime, setLastPostedTime] = useState<Date | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Helper for triggering visual toast alerts
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Load Location History from server on Mount
  const fetchLocationHistory = async () => {
    try {
      setIsRefreshing(true);
      const response = await api.get("/api/location/history");
      dispatch(setHistory(response.data));
      
      // Update current location with last item in history if available and not currently tracking
      if (response.data.length > 0 && !currentLocation) {
        dispatch(setCurrentLocation(response.data[response.data.length - 1]));
      }
    } catch (error: any) {
      console.error("Failed to load history", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocationHistory();
    return () => {
      // Clear timers on unmount but leave tracking slice intact in redux if we navigate away
    };
  }, []);

  // 2. Start tracking helper
  const startTrackingSession = () => {
    if (!navigator.geolocation) {
      setGpsError("HTML5 Geolocation is not supported by your browser");
      showToast("Geolocation is not supported", "error");
      return;
    }

    setGpsError(null);
    dispatch(setTrackingActive(true));
    showToast("Live GPS tracking started");

    // Perform immediate single grab
    grabAndPostLocation();

    // Setup interval to post to backend
    intervalIdRef.current = setInterval(() => {
      grabAndPostLocation();
    }, intervalTime * 1000);
  };

  // 3. Stop tracking helper
  const stopTrackingSession = () => {
    dispatch(setTrackingActive(false));
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    showToast("GPS tracking session stopped");
  };

  // Re-setup interval if intervalTime changes while tracking is active
  useEffect(() => {
    if (isActive) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      intervalIdRef.current = setInterval(() => {
        grabAndPostLocation();
      }, intervalTime * 1000);
    }
    return () => {
      if (intervalIdRef.current && !isActive) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [intervalTime, isActive]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // 4. Core function to retrieve GPS and POST to backend
  const grabAndPostLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsError(null);

        try {
          // POST to server
          const response = await api.post("/api/location", {
            latitude,
            longitude,
            accuracy: Math.round(accuracy || 0),
          });

          const recordedLoc: LocationRecord = response.data.location;
          dispatch(addHistoryLocation(recordedLoc));
          setLastPostedTime(new Date());
        } catch (error: any) {
          console.error("Failed to transmit location to server", error);
          if (error.response?.status === 403) {
            // Admin disabled tracking for this user account
            stopTrackingSession();
            setGpsError("Location sharing is disabled for your user profile by the Administrator.");
            showToast("Tracking halted by Admin", "error");
          } else {
            showToast("Failed to sync location to cloud database", "error");
          }
        }
      },
      (error) => {
        let errorMsg = "Unable to retrieve your location coordinates";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "GPS permission denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "GPS satellite coordinates are currently unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Retrying...";
        }
        setGpsError(errorMsg);
        showToast("GPS tracking failed", "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Format date helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Convert history items to leaflet polyline path [lat, lng][]
  const mapPathCoords: [number, number][] = history.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  // Motion Variants
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
      id="user-dashboard-page" 
      className="max-w-7xl mx-auto px-4 py-8 space-y-8"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`w-2 h-2 rounded-full ${toastMessage.type === "success" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/85 pb-6" variants={panelVariants}>
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white tracking-tight font-display">
            User Geolocation Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 leading-relaxed font-mono">
            Welcome back, <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</span>. Securely share your GPS coordinates or inspect your previous routes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLocationHistory}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all cursor-pointer"
            title="Refresh History Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/profile"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all font-mono"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
        </div>
      </motion.div>

      {/* Account Status and Security Notice if Admin Disabled */}
      {user?.tracking_enabled === false && (
        <motion.div className="p-4 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex gap-3 items-start font-mono" variants={panelVariants}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="font-bold uppercase tracking-wider">Location Sharing Admin-Disabled</h4>
            <p className="mt-1 leading-relaxed">
              Your location tracking permissions have been suspended by an administrator. Please reach out to your system admin to re-enable location sharing.
            </p>
          </div>
        </motion.div>
      )}

      {/* Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tracking Trigger Box */}
          <motion.div className="geo-card p-6 space-y-5" variants={panelVariants}>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold font-mono flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <MapPin className="w-4 h-4 text-blue-500 animate-bounce" />
              Live Geolocation Engine
            </h2>

            {/* Error notifications */}
            {gpsError && (
              <motion.div 
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded text-xs flex gap-2 items-start font-mono"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded border border-slate-200/50 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Engine Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse status-glow-emerald" : "bg-slate-300"}`} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {isActive ? "Active Sharing" : "Offline"}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Accuracy</div>
                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {currentLocation?.accuracy ? `±${currentLocation.accuracy}m` : "Checking..."}
                    </div>
                  </div>
                )}
              </div>

              {/* Interval Tuning */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <label className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> GPS Frequency
                  </label>
                  <span>Every {intervalTime} Seconds</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={intervalTime}
                  onChange={(e) => setIntervalTime(Number(e.target.value))}
                  disabled={isActive}
                  className="w-full accent-blue-600 dark:bg-slate-800 rounded h-1 cursor-pointer bg-slate-200 dark:bg-slate-800"
                />
                <p className="text-[10px] text-slate-400 leading-normal font-mono">
                  Higher frequency yields tighter route granularity, but consumes more device battery.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {!isActive ? (
                  <button
                    onClick={startTrackingSession}
                    disabled={user?.tracking_enabled === false}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold uppercase tracking-wider py-3 rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Location Sharing
                  </button>
                ) : (
                  <button
                    onClick={stopTrackingSession}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-3 rounded border border-slate-700/60 dark:border-slate-800 shadow transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse-slow"
                  >
                    <Square className="w-3.5 h-3.5 fill-current text-rose-500 animate-pulse" />
                    Stop Location Sharing
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div className="geo-card p-6 space-y-4" variants={panelVariants}>
            <h3 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Journey Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded border border-slate-200/50 dark:border-slate-850/80">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <History className="w-3.5 h-3.5 text-blue-500" /> Points
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {history.length}
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded border border-slate-200/50 dark:border-slate-850/80">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Transmit
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-100 truncate mt-1.5 uppercase">
                  {lastPostedTime ? formatDateTime(lastPostedTime.toISOString()) : formatDateTime(currentLocation?.created_at)}
                </div>
              </div>
            </div>

            {/* Tracking tips */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded border border-slate-200/50 dark:border-slate-850/80 text-[10px] font-mono text-slate-400 flex gap-2 items-start leading-normal">
              <HelpCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <span>
                Make sure you keep this tab open on your phone's browser so that tracking persists as you move.
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right Map Panel */}
        <motion.div className="lg:col-span-8 flex flex-col h-[500px] lg:h-[650px] space-y-4" variants={panelVariants}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <Map className="w-4 h-4 text-indigo-500 animate-spin-slow" /> Interactive Journey Path
            </h3>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>History Path</span>
            </div>
          </div>

          <div className="flex-grow rounded overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 shadow-sm relative">
            <InteractiveMap
              latitude={currentLocation?.latitude}
              longitude={currentLocation?.longitude}
              accuracy={currentLocation?.accuracy}
              path={mapPathCoords}
              isDarkMode={document.documentElement.classList.contains("dark")}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
