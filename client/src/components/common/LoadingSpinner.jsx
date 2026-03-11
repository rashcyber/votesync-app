export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className={`animate-spin rounded-full border-primary-200 border-t-primary-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-surface-500">{text}</p>}
    </div>
  );
}
