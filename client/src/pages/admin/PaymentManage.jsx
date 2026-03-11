import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Check, Inbox } from 'lucide-react';


/* ────────────────────────────────────────────
   Status badge mapping
   ──────────────────────────────────────────── */

const PAYMENT_BADGE = {
  success: 'badge badge-success',
  pending: 'badge badge-warning',
  failed:  'badge badge-danger',
};

export default function PaymentManage() {
  const { id } = useParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPayments = () => {
    api.get(`/api/payments/election/${id}`)
      .then(res => setPayments(res.data.payments))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [id]);

  const handleApprove = async (paymentId) => {
    try {
      await api.post(`/api/payments/${paymentId}/approve`);
      fetchPayments();
      toast.success('Payment approved, votes recorded');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve');
    }
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  /* ---- Filter tabs config ---- */
  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'success', label: 'Success' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          BACK LINK
          ═══════════════════════════════════════════ */}
      <Link
        to={`/admin/elections/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Election
      </Link>

      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-success-50 to-green-100 text-success-600">
            <CreditCard className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-surface-900">Payments</h2>
            <p className="text-sm text-surface-500">
              {payments.length} total &middot; {payments.filter(p => p.status === 'pending').length} pending
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FILTER TABS
          ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn-sm transition-colors ${
              filter === tab.key
                ? 'bg-primary-50 text-primary-700 border-primary-200 font-semibold'
                : 'btn-secondary'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className={`ml-1 text-xs ${filter === tab.key ? 'text-primary-500' : 'text-surface-400'}`}>
                {payments.filter(p => tab.key === 'all' || p.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          PAYMENTS TABLE
          ═══════════════════════════════════════════ */}
      {loading ? (
        <LoadingSpinner size="md" text="Loading payments..." />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Inbox className="h-12 w-12 text-surface-300" />
            <p className="text-surface-500 mt-4 mb-1">No payments found</p>
            <p className="text-sm text-surface-400">
              {filter !== 'all' ? 'Try changing your filter.' : 'Payments will appear here when voters make transactions.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Voter</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">Votes</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-surface-50 px-2 py-1 rounded text-surface-700">{p.paystack_ref}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-surface-700">
                      {p.voter_name || p.voter_phone || <span className="text-surface-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-surface-800">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-full bg-primary-50 text-primary-700 text-xs font-semibold px-2">
                        {p.vote_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={PAYMENT_BADGE[p.status] || 'badge badge-gray'}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
