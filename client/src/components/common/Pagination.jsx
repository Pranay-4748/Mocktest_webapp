export default function Pagination({ page, pages, total, limit, onPage }) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // Build page numbers with ellipsis
  const range = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) range.push(i);
    else if (range[range.length - 1] !== '…') range.push('…');
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        >
          ‹
        </button>
        {range.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                p === page
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)} disabled={page === pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        >
          ›
        </button>
      </div>
    </div>
  );
}
