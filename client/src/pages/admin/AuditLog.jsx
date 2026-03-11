import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const ENTITY_BADGES = {
  election: 'badge-primary',
  candidate: 'badge-success',
  position: 'badge-warning',
  payment: 'badge-danger',
  student: 'badge-gray',
  voter_codes: 'badge-gray',
  template: 'badge-gray',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity_type: '', page: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filters.page, limit: 30 });
      if (filters.entity_type) params.set('entity_type', filters.entity_type);
      const res = await api.get(`/api/audit?${params}`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const parseDetails = (details) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return details; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">Audit Log</h1>
        <p className="text-sm text-surface-500 mt-1">Track all admin actions across the system</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filters.entity_type}
          onChange={(e) => setFilters({ entity_type: e.target.value, page: 1 })}
          className="input w-auto"
        >
          <option value="">All Types</option>
          <option value="election">Elections</option>
          <option value="candidate">Candidates</option>
          <option value="position">Positions</option>
          <option value="payment">Payments</option>
          <option value="student">Students</option>
          <option value="voter_codes">Voter Codes</option>
          <option value="template">Templates</option>
        </select>
        <span className="text-sm text-surface-400">{pagination.total} total entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-surface-200 border-t-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-surface-500">No audit log entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {logs.map(log => {
                  const details = parseDetails(log.details);
                  return (
                    <tr key={log.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 text-xs text-surface-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-surface-700 font-medium whitespace-nowrap">
                        {log.admin_name || log.admin_username || 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-surface-800">{formatAction(log.action)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${ENTITY_BADGES[log.entity_type] || 'badge-gray'}`}>
                          {log.entity_type}
                        </span>
                        {log.entity_id && (
                          <span className="text-xs text-surface-400 ml-1">#{log.entity_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500 max-w-xs truncate">
                        {details && typeof details === 'object'
                          ? Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ')
                          : details || '--'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-surface-100 bg-surface-50 flex items-center justify-between">
            <p className="text-xs text-surface-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
