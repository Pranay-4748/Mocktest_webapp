import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useDarkMode } from '../../context/DarkModeContext';

const DIFFICULTIES = [
  { value: '', label: 'Mixed / All' },
  { value: 'pre', label: 'Pre (Easy)' },
  { value: 'mains', label: 'Mains (Medium)' },
  { value: 'advance', label: 'Advance (Hard)' }
];

export default function TopicPracticePage() {
  const { dark } = useDarkMode();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');

  const handleStart = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    navigate(`/tests/practice?topic=${encodeURIComponent(topic.trim())}`);
  };

  const page  = dark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gray-100';
  const card  = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15' : 'bg-white border border-gray-100 shadow-sm';
  const title = dark ? 'text-white' : 'text-gray-900';
  const sub   = dark ? 'text-indigo-300/70' : 'text-gray-500';
  const input = dark 
    ? 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition'
    : 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition';

  return (
    <div className={`min-h-screen transition-colors ${page}`}>
      {dark && <>
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </>}

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16 relative">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className={`text-3xl font-bold ${title}`}>Topic-Wise Practice</h1>
          <p className={`text-sm mt-2 ${sub}`}>
            Generate a dynamic mock test based on a specific topic. All question difficulties will be mixed together! Perfect for comprehensive focused preparation.
          </p>
        </div>

        <form onSubmit={handleStart} className={`${card} rounded-2xl p-6 sm:p-8 space-y-6 animate-slide-up`}>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-indigo-200' : 'text-gray-700'}`}>
              Topic
            </label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Percentage, Algebra, Number Series" 
              required
              className={input}
            />
            <p className={`text-xs mt-1.5 ${dark ? 'text-indigo-300/50' : 'text-gray-400'}`}>
              Enter a specific topic to pull questions dynamically from the question bank.
            </p>
          </div>



          <div className="pt-4">
            <button 
              type="submit"
              disabled={!topic.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition cursor-pointer"
            >
              🚀 Generate Practice Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
