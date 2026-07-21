import React, { useState, useEffect, ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, logout } from "./redux/store";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import LiveTracking from "./pages/LiveTracking";
import LocationHistory from "./pages/LocationHistory";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import {
  Compass,
  MapPin,
  ShieldCheck,
  User as UserIcon,
  History,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Navigation,
} from "lucide-react";

// Protected Route Wrapper for Authenticated Users
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useSelector((state: RootState) => state.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Protected Route Wrapper for Admin Users
function AdminRoute({ children }: { children: ReactNode }) {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Nav Header Component to leverage React Router hooks
function NavigationHeader({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isActive } = useSelector((state: RootState) => state.tracking);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActiveLink = (path: string) => location.pathname === path;

  const linkStyle = (path: string) =>
    `px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 border font-mono ${
      isActiveLink(path)
        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
        : "text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
    }`;

  const mobileLinkStyle = (path: string) =>
    `px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 border font-mono ${
      isActiveLink(path)
        ? "bg-blue-600 text-white border-blue-600"
        : "text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-slate-950/85 border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 text-slate-900 dark:text-white hover:opacity-90">
          <div className="relative w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm shadow-blue-500/25">
            <Compass className="w-4.5 h-4.5 animate-spin-slow" />
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white dark:border-slate-950"></span>
              </span>
            )}
          </div>
          <span className="text-xl font-bold tracking-tight font-display text-slate-900 dark:text-white">
            Track<span className="text-blue-600 dark:text-blue-400">Me</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link to="/" className={linkStyle("/")}>Home</Link>
          <Link to="/about" className={linkStyle("/about")}>About</Link>

          {user && (
            <>
              {user.role === "admin" ? (
                <Link to="/admin" className={linkStyle("/admin")}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Admin Portal
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" className={linkStyle("/dashboard")}>
                    <Compass className="w-4 h-4" /> Console
                  </Link>
                  <Link to="/tracking" className={linkStyle("/tracking")}>
                    <Navigation className="w-4 h-4" /> Live Map
                  </Link>
                  <Link to="/history" className={linkStyle("/history")}>
                    <History className="w-4 h-4" /> History
                  </Link>
                </>
              )}
              <Link to="/profile" className={linkStyle("/profile")}>
                <UserIcon className="w-4 h-4" /> Profile
              </Link>
            </>
          )}
        </nav>

        {/* Utility / Right-side Action Items */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Switcher */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-3 border-l dark:border-slate-800 pl-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 border-l dark:border-slate-800 pl-3">
              <Link
                to="/login"
                className="text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t dark:border-slate-850 bg-white dark:bg-slate-950 px-4 py-4 space-y-2 shadow-inner">
          <Link to="/" className={mobileLinkStyle("/")}>Home</Link>
          <Link to="/about" className={mobileLinkStyle("/about")}>About</Link>

          {user ? (
            <>
              {user.role === "admin" ? (
                <Link to="/admin" className={mobileLinkStyle("/admin")}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Admin Portal
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" className={mobileLinkStyle("/dashboard")}>
                    <Compass className="w-4 h-4" /> Console
                  </Link>
                  <Link to="/tracking" className={mobileLinkStyle("/tracking")}>
                    <Navigation className="w-4 h-4" /> Live Map
                  </Link>
                  <Link to="/history" className={mobileLinkStyle("/history")}>
                    <History className="w-4 h-4" /> History
                  </Link>
                </>
              )}
              <Link to="/profile" className={mobileLinkStyle("/profile")}>
                <UserIcon className="w-4 h-4" /> Profile
              </Link>
              
              <div className="border-t dark:border-slate-850 mt-4 pt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t dark:border-slate-850 mt-4">
              <Link
                to="/login"
                className="w-full text-center border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

// Inner Application layout with context
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("trackme_dark_mode") === "true";
    } catch (e) {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#020617"; // slate-950 background
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc"; // slate-50 background
    }
    try {
      localStorage.setItem("trackme_dark_mode", String(isDarkMode));
    } catch (e) {}
  }, [isDarkMode]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <NavigationHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <LiveTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <LocationHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="border-t bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} TrackMe System. All rights reserved.
            </div>
            <div className="flex gap-4 font-semibold text-slate-500 dark:text-slate-400">
              <Link to="/about" className="hover:underline">Privacy Policy</Link>
              <span>&middot;</span>
              <Link to="/about" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Global entry point wrapping Redux state provider
export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
