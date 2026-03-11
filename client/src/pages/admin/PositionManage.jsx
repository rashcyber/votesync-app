import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { ArrowLeft, Plus, GripHorizontal, Trash2, Layers, Inbox } from 'lucide-react';

const IconArrowLeft = () => <ArrowLeft className="h-4 w-4" />;
const IconPosition = () => <Layers className="h-5 w-5" />;
const IconPlus = () => <Plus className="h-4 w-4" />;
const IconDragHandle = () => <GripHorizontal className="h-4 w-4 text-surface-400 group-hover:text-surface-600" />;
const IconTrash = () => <Trash2 className="h-4 w-4" />;
const IconEmpty = () => <Inbox className="h-10 w-10 text-surface-300" strokeWidth={1.5} />;

export default function PositionManage() {
  const { id } = useParams();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', max_votes: 1 });
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPositions = () => {
    api.get(`/api/positions/election/${id}`)
      .then(res => setPositions(res.data.positions))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPositions(); }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/positions/election/${id}`, { ...form, display_order: positions.length });
      setForm({ title: '', description: '', max_votes: 1 });
      fetchPositions();
      toast.success('Position added');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (posId) => {
    setDeleteTarget(posId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/positions/${deleteTarget}`);
      fetchPositions();
      toast.success('Position deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* ═══════════════════════════════════════════
          BACK LINK
          ═══════════════════════════════════════════ */}
      <Link
        to={`/admin/elections/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <IconArrowLeft />
        Back to Election
      </Link>

      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
          <IconPosition />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Manage Positions</h2>
          <p className="text-sm text-surface-500">{positions.length} position{positions.length !== 1 ? 's' : ''} created</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ADD FORM
          ═══════════════════════════════════════════ */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-100">
          <IconPlus />
          <h3 className="text-base font-semibold text-surface-800">Add Position</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Position Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., President"
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Max Selections</label>
            <input
              type="number"
              min="1"
              value={form.max_votes}
              onChange={(e) => setForm(p => ({ ...p, max_votes: parseInt(e.target.value) || 1 }))}
              className="input w-24"
            />
            <p className="text-xs text-surface-400 mt-1">Number of candidates a voter can select for this position</p>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={adding}
              className="btn btn-primary"
            >
              {adding ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <IconPlus />
                  <span>Add Position</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ═══════════════════════════════════════════
          POSITIONS LIST
          ═══════════════════════════════════════════ */}
      {loading ? (
        <LoadingSpinner size="md" text="Loading positions..." />
      ) : positions.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <IconEmpty />
            <p className="text-surface-500 mt-4 mb-1">No positions yet</p>
            <p className="text-sm text-surface-400">Add your first position using the form above.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos, i) => (
            <div
              key={pos.id}
              className="card-hover bg-white rounded-xl border border-surface-200 shadow-sm p-4 flex items-center gap-3 group"
            >
              {/* Drag handle indicator */}
              <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                <IconDragHandle />
              </div>

              {/* Position number badge */}
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 text-sm font-bold">
                {i + 1}
              </div>

              {/* Position info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-surface-800">{pos.title}</p>
                {pos.description && (
                  <p className="text-sm text-surface-500 mt-0.5 truncate">{pos.description}</p>
                )}
                <p className="text-xs text-surface-400 mt-1">
                  Max selections: <span className="font-medium text-surface-600">{pos.max_votes}</span>
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(pos.id)}
                className="btn btn-danger btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconTrash />
                <span>Delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Position"
        message="Delete this position and all its candidates? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
