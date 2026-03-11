import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function Analytics() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/elections/${id}`),
      api.get(`/api/analytics/elections/${id}/timeline`),
      api.get(`/api/analytics/elections/${id}/demographics`),
    ]).then(([elRes, timeRes, demoRes]) => {
      setElection(elRes.data.election);
      setTimeline(timeRes.data.timeline);
      setDemographics(demoRes.data);
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-surface-200 border-t-primary-600" />
      </div>
    );
  }

  const timelineData = timeline.map(t => ({
    hour: t.hour ? t.hour.substring(5, 16) : '',
    votes: t.vote_count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/admin/elections/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Election
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
          Voter Analytics
        </h1>
        {election && <p className="text-sm text-surface-500 mt-0.5">{election.title}</p>}
      </div>

      {/* Summary Stats */}
      {demographics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Free Votes</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{demographics.summary.totalFreeVotes}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Paid Votes</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{demographics.summary.totalPaidVotes}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Total Students</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{demographics.summary.totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Turnout</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{demographics.summary.turnoutPercent}%</p>
          </div>
        </div>
      )}

      {/* Votes Over Time */}
      <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-surface-800 mb-4">Votes Over Time</h3>
        {timelineData.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-8">No vote data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Line type="monotone" dataKey="votes" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Class */}
        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-surface-800 mb-4">Turnout by Class</h3>
          {demographics?.byClass?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={demographics.byClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="class_name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Bar dataKey="vote_count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No class data available</p>
          )}
        </div>

        {/* By Hall */}
        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-surface-800 mb-4">Turnout by Hall</h3>
          {demographics?.byHall?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={demographics.byHall}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hall" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Bar dataKey="vote_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No hall data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
