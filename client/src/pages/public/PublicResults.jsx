import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useLiveResults } from '../../hooks/useSocket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Home } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const VIEW_MODES = [
  { key: 'chart', label: 'Chart' },
  { key: 'table', label: 'Table' },
  { key: 'podium', label: 'Podium' },
  { key: 'pie', label: 'Pie' },
];

export default function PublicResults() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('chart');
  const liveData = useLiveResults(id, '/public');

  useEffect(() => {
    api.get(`/api/results/elections/${id}`)
      .then(res => setInitialData(res.data))
      .catch(err => setError(err.response?.data?.error?.message || 'Failed to load results'));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-surface-200/60 text-center max-w-md">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-surface-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <LoadingSpinner size="lg" text="Loading results..." />
      </div>
    );
  }

  const { election, results, totalVoters } = initialData;

  // Merge live data if available
  const getVotesForCandidate = (candidateId) => {
    if (liveData?.results) {
      const live = liveData.results.find(r => r.candidate_id === candidateId);
      return live ? live.total_votes : 0;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-72 h-72 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold gradient-text">{election.title}</h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            {liveData ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500"></span>
                </span>
                Live Results
              </span>
            ) : (
              <span className="badge badge-gray">Final Results</span>
            )}
          </div>
          <p className="text-sm text-surface-500 mt-2">Total Voters: {liveData?.totalVoters ?? totalVoters}</p>
        </div>

        {/* View mode switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/70 backdrop-blur-sm rounded-xl border border-surface-200/60 shadow-sm p-1 gap-1">
            {VIEW_MODES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-surface-500 hover:text-surface-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Position Results */}
        {results.map((posResult, idx) => {
          const sorted = [...posResult.candidates].sort(
            (a, b) => (getVotesForCandidate(b.id) ?? b.total_votes) - (getVotesForCandidate(a.id) ?? a.total_votes)
          );
          const chartData = sorted.map(c => ({
            name: c.full_name,
            votes: getVotesForCandidate(c.id) ?? c.total_votes,
            code: c.contestant_code,
            photo: c.photo_url,
          }));
          const totalVotesInPos = chartData.reduce((s, c) => s + c.votes, 0);
          const maxVotes = Math.max(...chartData.map(c => c.votes), 1);

          return (
            <div key={posResult.position.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-surface-900">{posResult.position.title}</h2>
                <span className="text-xs text-surface-400 font-medium uppercase tracking-wider">
                  {totalVotesInPos} votes
                </span>
              </div>

              {/* ── Bar Chart ── */}
              {viewMode === 'chart' && (
                <>
                  <div className="h-64 bg-surface-50/50 rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#374151', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          formatter={(v) => [`${v} votes`, 'Votes']}
                        />
                        <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {chartData.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2.5 rounded-lg hover:bg-surface-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-surface-700 font-medium">{c.name}</span>
                          {c.code && <span className="badge badge-gray text-xs">{c.code}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.votes / maxVotes) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="font-semibold text-surface-900 tabular-nums min-w-[60px] text-right">{c.votes} votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Table View ── */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-lg border border-surface-100">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Rank</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Candidate</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Votes</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">%</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((c, i) => {
                        const pct = totalVotesInPos > 0 ? ((c.votes / totalVotesInPos) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={i} className="border-t border-surface-100 hover:bg-surface-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                i === 0 ? 'bg-warning-100 text-warning-700' : i === 1 ? 'bg-surface-100 text-surface-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-surface-50 text-surface-400'
                              }`}>{i + 1}</span>
                            </td>
                            <td className="py-3 px-4 font-medium text-surface-800">{c.name}</td>
                            <td className="py-3 px-4 text-right font-bold text-surface-900 tabular-nums">{c.votes}</td>
                            <td className="py-3 px-4 text-right text-surface-500 tabular-nums">{pct}%</td>
                            <td className="py-3 px-4 w-28">
                              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Podium View ── */}
              {viewMode === 'podium' && (
                <div className="py-2">
                  {chartData.length >= 2 && (
                    <div className="flex items-end justify-center gap-4 mb-6">
                      {chartData[1] && (
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-surface-200 bg-surface-100 flex items-center justify-center text-xl font-bold text-surface-600">
                            {chartData[1].photo ? <img src={chartData[1].photo} className="w-full h-full object-cover" alt="" /> : chartData[1].name.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold text-center line-clamp-2 text-surface-700">{chartData[1].name}</p>
                          <p className="text-sm font-bold text-surface-800">{chartData[1].votes}</p>
                          <div className="w-full bg-surface-200 rounded-t-lg flex items-end justify-center" style={{ height: 64 }}>
                            <span className="text-2xl pb-1">🥈</span>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                        <div className="relative">
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-warning-300 bg-warning-100 flex items-center justify-center text-2xl font-bold text-warning-700">
                            {chartData[0].photo ? <img src={chartData[0].photo} className="w-full h-full object-cover" alt="" /> : chartData[0].name.charAt(0)}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-center line-clamp-2 text-surface-700">{chartData[0].name}</p>
                        <p className="text-base font-bold text-warning-700">{chartData[0].votes}</p>
                        <div className="w-full bg-warning-200 rounded-t-lg flex items-end justify-center" style={{ height: 96 }}>
                          <span className="text-2xl pb-1">🥇</span>
                        </div>
                      </div>
                      {chartData[2] && (
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-orange-200 bg-orange-50 flex items-center justify-center text-xl font-bold text-orange-600">
                            {chartData[2].photo ? <img src={chartData[2].photo} className="w-full h-full object-cover" alt="" /> : chartData[2].name.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold text-center line-clamp-2 text-surface-700">{chartData[2].name}</p>
                          <p className="text-sm font-bold text-surface-800">{chartData[2].votes}</p>
                          <div className="w-full bg-orange-100 rounded-t-lg flex items-end justify-center" style={{ height: 48 }}>
                            <span className="text-2xl pb-1">🥉</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {chartData.length === 1 && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <span className="text-5xl">🥇</span>
                      <p className="font-bold text-lg text-surface-800">{chartData[0].name}</p>
                      <p className="text-2xl font-extrabold text-warning-600">{chartData[0].votes} votes</p>
                    </div>
                  )}
                  {chartData.slice(3).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-t border-surface-100">
                      <span className="w-6 text-center text-sm font-semibold text-surface-400">{i + 4}</span>
                      <span className="flex-1 text-sm text-surface-700 font-medium">{c.name}</span>
                      <span className="text-sm font-bold text-surface-900 tabular-nums">{c.votes}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Pie Chart ── */}
              {viewMode === 'pie' && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="votes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={45}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} votes`, 'Votes']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
