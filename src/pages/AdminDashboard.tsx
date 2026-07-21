import { useState, useEffect } from "react";
import api from "../services/api";
import InteractiveMap from "../components/InteractiveMap";
import {
  Users as UsersIcon,
  MapPin,
  Search,
  Trash2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Download,
  Loader2,
  RefreshCw,
  Clock,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  tracking_enabled: boolean;
  created_at: string;
}

interface AdminLocation {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, locationsRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/locations"),
      ]);
      setUsers(usersRes.data);
      setLocations(locationsRes.data);
    } catch (err: any) {
      console.error("Failed to load admin data", err);
      setError("Failed to load administration reports. Please make sure you are logged in as an Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Admin toggles location sharing for a specific user
  const handleToggleTracking = async (userId: number, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const response = await api.put(`/api/admin/user/${userId}/toggle-tracking`, {
        tracking_enabled: !currentStatus,
      });
      setUsers(users.map((u) => (u.id === userId ? { ...u, tracking_enabled: !currentStatus } : u)));
      showToast(response.data.message || `Tracking status updated`);
    } catch (err) {
      console.error("Failed to toggle user tracking", err);
      showToast("Failed to modify user tracking access");
    } finally {
      setActionLoading(null);
    }
  };

  // Admin deletes user and all user coordinates
  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user "${userName}"? This will permanently delete their account and all associated location history records.`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await api.delete(`/api/admin/user/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      setLocations(locations.filter((l) => l.user_id !== userId));
      showToast(response.data.message || "User deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete user", err);
      showToast(err.response?.data?.error || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  // Export Joint Location History for ALL Users
  const handleExportAllHistoryCSV = () => {
    if (locations.length === 0) {
      showToast("No location records available to export");
      return;
    }

    const csvHeaders = "Log_ID,User_ID,Name,Email,Latitude,Longitude,Accuracy(m),Timestamp\n";
    const csvRows = locations
      .map((l) => `${l.id},${l.user_id},"${l.user_name}","${l.user_email}",${l.latitude},${l.longitude},${l.accuracy || ""},"${new Date(l.created_at).toISOString()}"`)
      .join("\n");

    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trackme_admin_master_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Master history logs exported successfully");
  };

  // Export Individual User's History CSV
  const handleExportUserHistoryCSV = (userId: number, userName: string) => {
    const userLocs = locations.filter((l) => l.user_id === userId);
    if (userLocs.length === 0) {
      showToast(`No location history records found for ${userName}`);
      return;
    }

    const csvHeaders = "Log_ID,Latitude,Longitude,Accuracy(m),Timestamp\n";
    const csvRows = userLocs
      .map((l) => `${l.id},${l.latitude},${l.longitude},${l.accuracy || ""},"${new Date(l.created_at).toISOString()}"`)
      .join("\n");

    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trackme_history_user_${userId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`History for ${userName} exported as CSV`);
  };

  // --- Filtering & Calculations ---

  // 1. Filter Users by search text
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // 2. Filter Locations by Date
  const filteredLocations = locations.filter((loc) => {
    if (!filterDate) return true;
    const itemDate = new Date(loc.created_at).toISOString().split("T")[0];
    return itemDate === filterDate;
  });

  // Calculate stats based on reports
  const totalRegistered = users.length;
  // Active users: users who shared location in the filtered dataset or has tracking_enabled
  const activeUsersCount = users.filter((u) => u.tracking_enabled).length;
  const loggedPointsCount = locations.length;

  // Build the most recent coordinate marker for each active tracking user to render on admin interactive map
  const uniqueLastLocationsMap = new Map<number, AdminLocation>();
  // Process oldest to newest so last set overwrites, securing the absolute newest record
  locations
    .slice()
    .reverse()
    .forEach((loc) => {
      // apply date filter to map visualizers too
      if (filterDate) {
        const itemDate = new Date(loc.created_at).toISOString().split("T")[0];
        if (itemDate !== filterDate) return;
      }
      if (!uniqueLastLocationsMap.has(loc.user_id)) {
        uniqueLastLocationsMap.set(loc.user_id, loc);
      }
    });

  const mapMarkers = Array.from(uniqueLastLocationsMap.values()).map((loc) => ({
    userId: loc.user_id,
    userName: loc.user_name,
    userEmail: loc.user_email,
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy,
    updatedAt: loc.created_at,
  }));

  // Motion variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="text-slate-500 text-xs font-mono uppercase tracking-wider font-bold">Generating Administration reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="max-w-xl mx-auto mt-20 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-md text-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-950 dark:text-white font-display">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">{error}</p>
        <button
          onClick={fetchAdminData}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-all font-mono"
        >
          Retry Authorization
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      id="admin-dashboard-page" 
      className="max-w-7xl mx-auto px-4 py-8 space-y-8"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            className="fixed top-5 right-5 z-50 bg-slate-950 border border-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider px-4 py-3 rounded shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-6" variants={panelVariants}>
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-2 font-display">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Administrator Control Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 leading-relaxed font-mono uppercase tracking-wider">
            Perform global monitoring, audit client coordinate feeds, and toggle tracking access rights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 p-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-mono"
            title="Reload Server Reports"
          >
            <RefreshCw className="w-4 h-4" /> Reload Logs
          </button>
          <button
            onClick={handleExportAllHistoryCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Master
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-6" variants={panelVariants}>
        <div className="geo-card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest">Total Registers</div>
            <div className="text-2xl font-bold text-slate-950 dark:text-white mt-1 font-mono">{totalRegistered}</div>
          </div>
        </div>

        <div className="geo-card p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest">Authorized Sharers</div>
            <div className="text-2xl font-bold text-slate-950 dark:text-white mt-1 font-mono">{activeUsersCount}</div>
          </div>
        </div>

        <div className="geo-card p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest">Total GPS Logs</div>
            <div className="text-2xl font-bold text-slate-950 dark:text-white mt-1 font-mono">{loggedPointsCount}</div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Map Block */}
      <motion.div className="space-y-4" variants={panelVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <MapPin className="w-4 h-4 text-indigo-500" /> Active Tracking Map (All Users)
          </h3>

          {/* Date Filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Map Filter:
            </span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs px-3 py-1.5 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 font-mono"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-bold font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="h-[450px] rounded overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <InteractiveMap
            markers={mapMarkers}
            isDarkMode={document.documentElement.classList.contains("dark")}
          />
        </div>
      </motion.div>

      {/* User Administration List */}
      <motion.div className="geo-card overflow-hidden flex flex-col" variants={panelVariants}>
        {/* Sub Header / Filters */}
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/30 dark:bg-slate-950/20">
          <h3 className="font-bold text-sm md:text-base text-slate-950 dark:text-white font-display">Registered Accounts & Settings</h3>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-9 pr-4 py-1.5 text-xs font-mono outline-none focus:border-blue-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 uppercase font-mono font-bold tracking-wider border-b border-slate-200/60 dark:border-slate-850">
                <th className="px-5 py-3 text-[10px]">User Details</th>
                <th className="px-5 py-3 text-[10px]">Account Created</th>
                <th className="px-5 py-3 text-[10px]">Tracking State</th>
                <th className="px-5 py-3 text-[10px]">Coordinates Shared</th>
                <th className="px-5 py-3 text-right text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-850">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">
                    No registered users match your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const userCoordsCount = locations.filter((l) => l.user_id === userItem.id).length;
                  const isActionLoading = actionLoading === userItem.id;

                  return (
                     <tr key={userItem.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10 text-slate-600 dark:text-slate-350">
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                            {userItem.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5 font-display">
                              {userItem.name}
                              {userItem.role === "admin" && (
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold font-mono px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-mono">{userItem.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 font-mono text-xs">
                        {new Date(userItem.created_at).toLocaleDateString()}
                      </td>

                      {/* Tracking Toggle Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTracking(userItem.id, userItem.tracking_enabled)}
                            disabled={isActionLoading || userItem.role === "admin"}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={userItem.role === "admin" ? "Admins cannot have tracking disabled" : "Toggle Geolocation Sharing privilege"}
                          >
                            {userItem.tracking_enabled ? (
                              <ToggleRight className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                            )}
                          </button>
                          <span className={`text-[9px] font-bold font-mono uppercase tracking-widest ${userItem.tracking_enabled ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                            {userItem.tracking_enabled ? "Allowed" : "Revoked"}
                          </span>
                        </div>
                      </td>

                      {/* Coordinates count */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {userCoordsCount} pts
                      </td>

                      {/* User Actions */}
                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleExportUserHistoryCSV(userItem.id, userItem.name)}
                          disabled={isActionLoading || userCoordsCount === 0}
                          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-40"
                          title="Download user CSV ledger"
                        >
                          <Download className="w-3 h-3" /> CSV
                        </button>

                        <button
                          onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                          disabled={isActionLoading || userItem.role === "admin"}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-40"
                          title="Delete User account permanently"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
