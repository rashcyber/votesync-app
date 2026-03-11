import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Plus, FileText, Trash2, Loader2, Copy, Calendar, User, ChevronRight } from 'lucide-react';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    setLoading(true);
    api.get('/api/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/api/templates/${deleteTarget.id}`);
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast.success('Template deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete template');
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const newConfig = {
        ...template.config,
        positions: template.config.positions || [],
      };
      await api.post('/api/templates', {
        name: `${template.name} (Copy)`,
        description: template.description,
        config: newConfig,
      });
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to duplicate template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Election Templates</h1>
          <p className="text-surface-500 mt-1">Create and manage reusable election templates</p>
        </div>
        <Link to="/admin/elections/create" className="btn btn-primary inline-flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          Create Template
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">What are templates?</h3>
            <p className="text-sm text-primary-700 mt-1">
              Templates let you save election configurations (positions, settings) and reuse them when creating new elections. 
              Save time by creating templates for recurring election types.
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-surface-200"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-surface-400 mt-4 text-sm">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-surface-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-surface-800 mb-1">No templates yet</h3>
          <p className="text-surface-400 text-sm text-center max-w-sm mb-6">
            Create your first template by setting up an election and saving it as a template.
          </p>
          <Link to="/admin/elections/create" className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-surface-200 overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Duplicate template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: template.id, name: template.name })}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-surface-900 mb-1 line-clamp-2">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-surface-500 line-clamp-2 mt-1">
                    {template.description}
                  </p>
                )}

                {/* Template Details */}
                <div className="mt-4 space-y-2">
                  {template.config?.positions?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>{template.config.positions.length} position{template.config.positions.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {template.created_by_name && (
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Created by {template.created_by_name}</span>
                    </div>
                  )}
                  {template.created_at && (
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-5 py-3 bg-surface-50 border-t border-surface-100">
                <Link
                  to={`/admin/elections/create?template=${template.id}`}
                  className="btn btn-sm btn-primary w-full justify-center"
                >
                  Use Template
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deleting}
      />
    </div>
  );
}
