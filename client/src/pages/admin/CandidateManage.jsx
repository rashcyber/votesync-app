import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { ArrowLeft, Plus, Pencil, Trash2, X, ImagePlus, AlertTriangle, Users } from 'lucide-react';

/* ────────────────────────────────────────────
   CandidateManage component
   ──────────────────────────────────────────── */

export default function CandidateManage() {
  const { id } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* Modal state */
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [form, setForm] = useState({ full_name: '', position_id: '', portfolio: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Fetch data ── */
  const fetchData = () => {
    api.get(`/api/elections/${id}`)
      .then(res => {
        setElection(res.data.election);
        setPositions(res.data.positions || []);
        setCandidates(res.data.candidates || []);
      })
      .catch(() => toast.error('Failed to load election data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  /* ── Photo preview ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /* ── Open modal for add/edit ── */
  const openAddModal = () => {
    setEditingCandidate(null);
    setForm({ full_name: '', position_id: positions[0]?.id || '', portfolio: '' });
    setPhoto(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setForm({
      full_name: candidate.full_name,
      position_id: candidate.position_id,
      portfolio: candidate.portfolio || '',
    });
    setPhoto(null);
    setPhotoPreview(candidate.photo_url || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCandidate(null);
    setForm({ full_name: '', position_id: '', portfolio: '' });
    setPhoto(null);
    setPhotoPreview(null);
  };

  /* ── Submit (add / edit) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('position_id', form.position_id);
      formData.append('portfolio', form.portfolio);
      if (photo) formData.append('photo', photo);

      if (editingCandidate) {
        await api.put(`/api/candidates/${editingCandidate.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Candidate updated');
      } else {
        await api.post(`/api/candidates/election/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Candidate added');
      }

      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save candidate');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = (candId) => {
    setDeleteTarget(candId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/candidates/${deleteTarget}`);
      fetchData();
      toast.success('Candidate deleted');
    } catch (err) {
      toast.error('Failed to delete candidate');
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── Group candidates by position ── */
  const candidatesByPosition = positions.map(pos => ({
    position: pos,
    candidates: candidates.filter(c => c.position_id === pos.id),
  }));

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-surface-200 border-t-primary-600" />
          <p className="text-sm text-surface-500">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          BACK LINK
          ═══════════════════════════════════════════ */}
      <Link
        to={`/admin/elections/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Election
      </Link>

      {/* ═══════════════════════════════════════════
          PAGE HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600">
            <Users className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Manage Candidates
            </h1>
            {election && (
              <p className="text-sm text-surface-500 mt-0.5">{election.title}</p>
            )}
          </div>
        </div>
        {positions.length > 0 && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus className="h-5 w-5" />
            Add Candidate
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          NO POSITIONS WARNING
          ═══════════════════════════════════════════ */}
      {positions.length === 0 && (
        <div className="bg-warning-50 border border-warning-500/20 rounded-xl p-5 flex items-start gap-3">
          <div className="flex-shrink-0 text-warning-600 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-800 mb-1">No positions found</h3>
            <p className="text-sm text-surface-600">
              You need to{' '}
              <Link
                to={`/admin/elections/${id}/positions`}
                className="text-primary-600 font-medium hover:underline"
              >
                add positions
              </Link>{' '}
              before you can add candidates to this election.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════ */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Total Candidates</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{candidates.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-sm font-medium text-surface-500">Positions</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{positions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 col-span-2 sm:col-span-1">
            <p className="text-sm font-medium text-surface-500">Avg. per Position</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">
              {positions.length > 0 ? (candidates.length / positions.length).toFixed(1) : 0}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CANDIDATES GROUPED BY POSITION
          ═══════════════════════════════════════════ */}
      {candidates.length === 0 && positions.length > 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
              <Users className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-surface-700 mb-1">No candidates yet</h3>
          <p className="text-sm text-surface-500 mb-4">
            Get started by adding your first candidate to this election.
          </p>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus className="h-5 w-5" />
            Add First Candidate
          </button>
        </div>
      ) : (
        candidatesByPosition.map(({ position, candidates: posCandidates }) => (
          <div key={position.id} className="space-y-3">
            {/* Position heading */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-surface-800">
                {position.title}
              </h2>
              <span className="badge badge-primary">
                {posCandidates.length} candidate{posCandidates.length !== 1 ? 's' : ''}
              </span>
            </div>

            {posCandidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-surface-300 p-6 text-center">
                <p className="text-sm text-surface-500">
                  No candidates for this position yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posCandidates.map((candidate, idx) => (
                  <div
                    key={candidate.id}
                    className="group bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200 flex flex-col"
                  >
                    {/* Photo area */}
                    <div className="relative">
                      {candidate.photo_url ? (
                        <img
                          src={candidate.photo_url}
                          alt={candidate.full_name}
                          className="w-full h-44 object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-44 bg-gradient-to-br from-primary-100 via-accent-50 to-accent-100 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-inner">
                            <span className="text-3xl font-extrabold text-primary-600">
                              {candidate.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Position number badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow text-xs font-bold text-surface-700 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      {/* Code badge */}
                      {candidate.contestant_code && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-mono font-semibold text-surface-700 px-2 py-1 rounded-lg shadow">
                          #{candidate.contestant_code}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-surface-900 text-base leading-snug group-hover:text-primary-700 transition-colors">
                        {candidate.full_name}
                      </h3>
                      {candidate.portfolio && (
                        <p className="text-sm text-surface-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                          {candidate.portfolio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 bg-surface-50 border-t border-surface-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(candidate)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* ═══════════════════════════════════════════
          ADD / EDIT MODAL
          ═══════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-100">
              <div>
                <h2 className="text-xl font-bold text-surface-900">
                  {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  {editingCandidate
                    ? 'Update the candidate details below.'
                    : 'Fill in the details to add a new candidate.'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter candidate's full name"
                  className="input"
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Position <span className="text-danger-500">*</span>
                </label>
                <select
                  value={form.position_id}
                  onChange={(e) => setForm(p => ({ ...p, position_id: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select a position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Portfolio */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Portfolio / Bio
                </label>
                <textarea
                  value={form.portfolio}
                  onChange={(e) => setForm(p => ({ ...p, portfolio: e.target.value }))}
                  placeholder="A brief description about the candidate..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Photo
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-surface-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <ImagePlus className="h-4 w-4" />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-surface-400 mt-1.5">
                      JPG, PNG or WebP. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting
                    ? (editingCandidate ? 'Updating...' : 'Adding...')
                    : (editingCandidate ? 'Update Candidate' : 'Add Candidate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
