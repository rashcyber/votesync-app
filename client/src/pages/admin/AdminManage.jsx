import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Shield, ShieldCheck, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const ROLE_BADGES = {
  superadmin: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-700' },
  super_admin: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', cls: 'bg-primary-100 text-primary-700' },
};

const emptyForm = { username: '', password: '', full_name: '', role: 'admin' };

export default function AdminManage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = () => {
    api.get('/api/admin/users')
      .then(res => setAdmins(res.data.admins || []))
      .catch(() => toast.error('Failed to load admins'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setEditing(admin);
    setForm({
      username: admin.username,
      password: '',
      full_name: admin.full_name,
      role: admin.role === 'superadmin' ? 'super_admin' : admin.role,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/api/admin/users/${editing.id}`, payload);
        toast.success('Admin updated successfully');
      } else {
        await api.post('/api/admin/users', form);
        toast.success('Admin created successfully');
      }
      setModalOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success('Admin deleted');
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const formatRole = (role) => {
    const badge = ROLE_BADGES[role] || ROLE_BADGES.admin;
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Admin Users</h1>
          <p className="text-sm text-surface-500 mt-1">Manage administrator accounts</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">No admin users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-5 py-3 font-semibold text-surface-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-600">Username</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-surface-600">Created</th>
                  <th className="text-right px-5 py-3 font-semibold text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-primary-700 text-xs font-semibold">
                          {admin.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                        </div>
                        <span className="font-medium text-surface-900">{admin.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-surface-600 font-mono text-xs">{admin.username}</td>
                    <td className="px-5 py-3">{formatRole(admin.role)}</td>
                    <td className="px-5 py-3 text-surface-500 text-xs">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Admin' : 'Create Admin'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="input w-full"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="input w-full"
              placeholder="johndoe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Password {editing && <span className="text-surface-400 font-normal">(leave blank to keep current)</span>}
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!editing}
              minLength={6}
              className="input w-full"
              placeholder={editing ? '••••••' : 'Min 6 characters'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role: 'admin' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.role === 'admin'
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-surface-200 text-surface-500 hover:border-surface-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role: 'super_admin' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.role === 'super_admin'
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-surface-200 text-surface-500 hover:border-surface-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Super Admin
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : editing ? 'Update Admin' : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Admin"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.full_name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
