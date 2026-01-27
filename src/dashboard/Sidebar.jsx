import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-200">
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          DSA Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Build daily revision habit
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {/* Daily */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Daily
          </p>

          <NavLink
            to="/dashboard/today"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
              ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">📝</span>
            Today
          </NavLink>
        </div>

        {/* Archive */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Archive
          </p>

          <NavLink
            to="/dashboard/all"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
              ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">📚</span>
            All Problems
          </NavLink>

          <NavLink
            to="/dashboard/progress"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
              ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">📊</span>
            Progress
          </NavLink>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg
            text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
