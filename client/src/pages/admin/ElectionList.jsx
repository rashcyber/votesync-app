import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { EVENT_TYPES, ELECTION_STATUSES, VOTING_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import SkeletonCard from '../../components/common/SkeletonCard';
import { Plus, Eye, Pencil, Trash2, Tag, Calendar, FileText, Loader2, EyeOff } from 'lucide-react';

const STATUS_BADGE = {
  draft: 'badge badge-gray',
  active: 'badge badge-success',
  paused: 'badge badge-warning',
  completed: 'badge badge-primary',
};

const EVENT_TYPE_STYLES = {
  src: 'bg-primary-50 text-primary-700 ring-1 ring-primary-600/20',
  class_rep: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  hall: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  pageant: 'bg-pink-50 text-pink-700 ring-1 ring-pink-600/20',
  custom: 'bg-surface-100 text-surface-600 ring-1 ring-surface-300',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused', label: 'Paused' },
];

export default function ElectionList() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = () => {
    setLoading(true);
    api.get('/api/elections')
      .then(res => setElections(res.data.elections))
      .catch(() => toast.error('Failed to load elections'))
      .finally(() => setLoading(false));
  };

  const handleToggleLanding = async (election) => {
    if (toggling === election.id) return;
    setToggling(election.id);
    try {
      const res = await api.put(`/api/elections/${election.id}`, { 
        show_on_landing: election.show_on_landing ? 0 : 1 
      });
      setElections(prev => prev.map(e => 
        e.id === election.id ? { ...e, show_on_landing: res.data.election.show_on_landing } : e
      ));
      toast.success(res.data.election.show_on_landing ? 'Shown on landing page' : 'Hidden from landing page');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update visibility');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/api/elections/${deleteTarget.id}`);
      setElections(prev => prev.filter(e => e.id !== deleteTarget.id));
      toast.success('Election deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete election');
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const filtered = filter === 'all' ? elections : elections.filter(e => e.status === filter);

  const filterCounts = {
    all: elections.length,
    active: elections.filter(e => e.status === 'active').length,
    draft: elections.filter(e => e.status === 'draft').length,
    completed: elections.filter(e => e.status === 'completed').length,
    paused: elections.filter(e => e.status === 'paused').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Elections</h1>
          <p className="text-surface-500 mt-1">Manage and monitor all your elections</p>
        </div>
        <Link to="/admin/elections/create" className="btn btn-primary inline-flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          Create Election
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-surface-200'
                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
            }`}
          >
            {tab.label}
            {filterCounts[tab.key] > 0 && (
              <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-surface-200 text-surface-500'
              }`}>
                {filterCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-4">
          <SkeletonCard count={6} />
          <p className="text-surface-400 mt-4 text-sm">Loading elections...</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-surface-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-surface-800 mb-1">
            {filter === 'all' ? 'No elections yet' : `No ${filter} elections`}
          </h3>
          <p className="text-surface-400 text-sm text-center max-w-sm mb-6">
            {filter === 'all'
              ? 'Get started by creating your first election. Set up candidates, configure voting, and go live.'
              : `There are no elections with "${filter}" status right now.`}
          </p>
          {filter === 'all' && (
            <Link to="/admin/elections/create" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Election
            </Link>
          )}
        </div>
      ) : (
        /* Election Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(election => {
            const statusConfig = ELECTION_STATUSES[election.status] || ELECTION_STATUSES.draft;
            const eventStyle = EVENT_TYPE_STYLES[election.event_type] || EVENT_TYPE_STYLES.custom;
            const eventLabel = EVENT_TYPES[election.event_type] || 'Custom';
            const votingLabel = VOTING_TYPES[election.voting_type] || election.voting_type;

            return (
              <div
                key={election.id}
                className="card-hover bg-white rounded-xl border border-surface-200 overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-5 pb-3 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${STATUS_BADGE[election.status] || 'badge badge-gray'}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${eventStyle}`}>
                        {eventLabel}
                      </span>
                    </div>
                    {election.voting_type === 'paid' && (
                      <span className="badge badge-warning text-xs whitespace-nowrap">
                        Paid
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/admin/elections/${election.id}`}
                    className="block group"
                  >
                    <h3 className="text-lg font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                      {election.title}
                    </h3>
                  </Link>

                  {election.description && (
                    <p className="text-sm text-surface-400 line-clamp-2 mt-1">
                      {election.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <Tag className="w-3.5 h-3.5 text-surface-300" />
                      <span>{votingLabel}</span>
                    </div>
                    {election.start_date && (
                      <div className="flex items-center gap-2 text-xs text-surface-400">
                        <Calendar className="w-3.5 h-3.5 text-surface-300" />
                        <span>{formatDate(election.start_date)}</span>
                        {election.end_date && (
                          <>
                            <span className="text-surface-300">-</span>
                            <span>{formatDate(election.end_date)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 bg-surface-50 border-t border-surface-100 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleLanding(election)}
                    disabled={toggling === election.id}
                    className={`btn btn-sm flex items-center justify-center gap-1.5 ${
                      election.show_on_landing
                        ? 'btn-success !bg-success-100 !text-success-700 !border-success-200 hover:!bg-success-200'
                        : 'btn-warning !bg-warning-100 !text-warning-700 !border-warning-200 hover:!bg-warning-200'
                    }`}
                    title={election.show_on_landing ? 'Click to hide from landing page' : 'Click to show on landing page'}
                  >
                    {toggling === election.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : election.show_on_landing ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <Link
                    to={`/admin/elections/${election.id}`}
                    className="btn btn-sm btn-secondary flex-1 text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <Link
                    to={`/admin/elections/${election.id}/edit`}
                    className="btn btn-sm btn-secondary flex-1 text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  {election.status === 'draft' && (
                    <button
                      onClick={() => handleDelete(election.id, election.title)}
                      disabled={deleting === election.id}
                      className="btn btn-sm btn-danger inline-flex items-center justify-center gap-1.5"
                    >
                      {deleting === election.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Election"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deleting}
      />
    </div>
  );
}
