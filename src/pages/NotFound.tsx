import { Link } from "react-router-dom";
import { Compass, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center px-4 py-16 sm:py-24 space-y-6">
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute -inset-1 rounded-full bg-blue-500 opacity-25 blur-lg"></div>
        <HelpCircle className="w-20 h-20 text-blue-600 relative z-10 animate-bounce" />
      </div>

      <div className="space-y-2">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white font-mono">404</h1>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Route Coordinates Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          The tracking coordinates you requested appear to be off-grid. Please verify the URL endpoint or return to home base.
        </p>
      </div>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
        >
          <Compass className="w-4 h-4" /> Return to Home Base
        </Link>
      </div>
    </div>
  );
}
