import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navCls = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`;

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <Link to="/dashboard" className="text-xl font-bold text-indigo-600">TestSeries</Link>
      {user && (
        <div className="flex gap-6 items-center">
          <NavLink to="/dashboard" className={navCls}>Dashboard</NavLink>
          <NavLink to="/tests" className={navCls}>Tests</NavLink>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      )}
    </nav>
  );
}
