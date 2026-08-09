export default function Spinner({ size = 'md', className = '' }) {
  const sz = {
    xs: 'w-3 h-3 border-[2px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[3px]',
    lg: 'w-10 h-10 border-4',
  }[size] ?? 'w-7 h-7 border-[3px]';

  const spinner = (
    <div className={`${sz} border-indigo-500 border-t-transparent rounded-full animate-spin ${className}`} />
  );

  if (size === 'xs' || size === 'sm') return spinner;

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[80px]">
      {spinner}
    </div>
  );
}
