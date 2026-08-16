import { useDarkMode } from '../../context/DarkModeContext';

export default function Pagination({ page, pages, total, limit, onPage }) {
  const { dark } = useDarkMode();
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const range = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) range.push(i);
    else if (range[range.length - 1] !== '…') range.push('…');
  }

  const btn = dark
    ? 'bg-white/8 border border-white/15 text-indigo-300 hover:bg-white/15'
    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50';
  const info = dark ? 'text-indigo-300/60' : 'text-gray-400';
  const infoVal = dark ? 'text-indigo-200' : 'text-gray-700';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-1">
      <p className={`text-xs ${info}`}>
        Showing <span className={`font-medium ${infoVal}`}>{from}–{to}</span> of{' '}
        <span className={`font-medium ${infoVal}`}>{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btn}`}>
          ‹
        </button>
        {range.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className={`w-8 h-8 flex items-center justify-center text-sm ${info}`}>…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition cursor-pointer ${
                p === page ? 'bg-indigo-600 text-white shadow-sm' : btn
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btn}`}>
          ›
        </button>
      </div>
    </div>
  );
}
