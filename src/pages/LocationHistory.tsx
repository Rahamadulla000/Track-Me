import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setHistory, setCurrentLocation } from "../redux/store";
import api from "../services/api";
import { Calendar, Trash2, ShieldAlert, Download, Clock, MapPin, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LocationHistory() {
  const dispatch = useDispatch();
  const { history } = useSelector((state: RootState) => state.tracking);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Clear History
  const handleClearHistory = async () => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete your entire location history? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete("/api/location/history");
      dispatch(setHistory([]));
      dispatch(setCurrentLocation(null));
      triggerToast("Your location history ledger has been purged");
    } catch (err: any) {
      console.error("Failed to delete history", err);
      triggerToast("Failed to delete history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Export for Personal Data
  const handleExportCSV = () => {
    if (history.length === 0) {
      triggerToast("No location records to export");
      return;
    }

    const csvHeaders = "ID,Latitude,Longitude,Accuracy(m),Timestamp\n";
    const csvRows = history
      .map((l) => `${l.id},${l.latitude},${l.longitude},${l.accuracy || ""},"${new Date(l.created_at).toISOString()}"`)
      .join("\n");

    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trackme_my_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("History exported successfully as CSV");
  };

  // Filter history chronologically
  const filteredHistory = history.filter((l) => {
    if (!filterDate) return true;
    const itemDate = new Date(l.created_at).toISOString().split("T")[0];
    return itemDate === filterDate;
  });

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
      id="location-history-page" 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="fixed top-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider px-4 py-3 rounded shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b dark:border-slate-800 pb-6" variants={panelVariants}>
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white tracking-tight font-display">Location History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wider">Review, filter, and manage your stored geographic travel path data.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all font-mono shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" /> Export CSV
          </button>
          <button
            onClick={handleClearHistory}
            disabled={loading || history.length === 0}
            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all font-mono shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Purge History
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Filter and Summary */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div className="geo-card p-6 space-y-4" variants={panelVariants}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">Filter Ledger</h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-10 pr-4 py-2 text-xs outline-none focus:border-blue-500 transition-colors dark:text-white font-mono"
                />
              </div>
            </div>

            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-bold font-mono uppercase tracking-wider"
              >
                Clear Date Filter
              </button>
            )}
          </motion.div>

          <motion.div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded space-y-3" variants={panelVariants}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 text-blue-500" /> Privacy Assurance
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never share your location data with third parties. All coordinate logs are stored directly on our servers and can be deleted instantly using the purge tool above.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Ledger Table */}
        <motion.div className="lg:col-span-8 geo-card overflow-hidden flex flex-col" variants={panelVariants}>
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">Coordinate Logs</h3>
            <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">{filteredHistory.length} records shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950 text-slate-400 uppercase font-bold tracking-widest border-b border-slate-200/60 dark:border-slate-800 font-mono text-[10px]">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Latitude</th>
                  <th className="px-5 py-3">Longitude</th>
                  <th className="px-5 py-3">Accuracy</th>
                  <th className="px-5 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-200/50 dark:divide-slate-850">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                      {filterDate ? "No location logs matching the selected date." : "No GPS logs recorded yet. Turn on Live Tracking from the console!"}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.slice().reverse().map((log) => (
                    <motion.tr 
                      key={log.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-350"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-mono">{log.latitude.toFixed(6)}</td>
                      <td className="px-5 py-3 font-mono">{log.longitude.toFixed(6)}</td>
                      <td className="px-5 py-3">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-750">
                          {log.accuracy ? `±${log.accuracy}m` : "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            dispatch(setCurrentLocation(log));
                            triggerToast(`Centered map on coordinates: ${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-all cursor-pointer"
                          title="Focus Map on Point"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
