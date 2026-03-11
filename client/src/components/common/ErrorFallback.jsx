export default function ErrorFallback({ error, resetError, level = 'page' }) {
  if (level === 'section') {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-danger-800 mb-1">Something went wrong</h3>
        <p className="text-xs text-danger-600 mb-3">{error?.message || 'An unexpected error occurred'}</p>
        {resetError && (
          <button onClick={resetError} className="btn btn-sm btn-secondary">
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-surface-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-surface-500 mb-6">{error?.message || 'An unexpected error occurred. Please try again.'}</p>
        <div className="flex items-center justify-center gap-3">
          {resetError && (
            <button onClick={resetError} className="btn btn-primary">
              Try Again
            </button>
          )}
          <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
