export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-3xl">
        {icon ?? '📭'}
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-300">{title ?? 'Nothing here yet'}</p>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
