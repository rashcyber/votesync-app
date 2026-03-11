import { Link, Outlet } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';

export default function VoterLayout() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-sm">
              <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-surface-800 tracking-tight text-lg group-hover:text-primary-600 transition-colors">
              VoteSync Pro
            </span>
          </Link>

          <Link to="/" className="btn btn-secondary btn-sm">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <ErrorBoundary level="section">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
