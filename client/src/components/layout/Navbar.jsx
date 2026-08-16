import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();

  const bg    = dark ? 'bg-slate-900/90 border-white/10 shadow-black/20' : 'bg-gray-100/95 border-gray-300 shadow-gray-300';
  const brand = dark ? 'text-white' : 'text-gray-900';
  const div   = dark ? 'bg-white/20' : 'bg-gray-200';
  const name  = dark ? 'text-indigo-200/80' : 'text-gray-700';
  const tog   = dark ? 'bg-white/8 hover:bg-white/15 border-white/15 text-indigo-200 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 hover:text-gray-900';
  const out   = dark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600';

  return (
    <nav className={`sticky top-0 z-40 backdrop-blur-xl border-b px-6 py-3.5 flex justify-between items-center shadow-sm transition-colors ${bg}`}>
      <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <span className={`font-bold text-lg tracking-tight ${brand}`}>TestSeries</span>
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span className={`text-sm hidden sm:block ${name}`}>{user.name}</span>
            </div>
          </>
        )}

        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl border transition cursor-pointer ${tog}`}>
          {dark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {user && (
          <button onClick={logout} className={`flex items-center gap-1.5 text-sm transition cursor-pointer ${out}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
