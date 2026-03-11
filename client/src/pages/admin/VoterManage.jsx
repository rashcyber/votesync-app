import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { ArrowLeft, KeyRound, RefreshCw, Download, Ticket, Settings, Info, Inbox, Trash2, Search, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';


/* ────────────────────────────────────────────
   Pagination Component
   ──────────────────────────────────────────── */

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 bg-surface-50">
      <p className="text-xs text-surface-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────
   VoterManage component
   ──────────────────────────────────────────── */

export default function VoterManage() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codeCount, setCodeCount] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [assignToStudents, setAssignToStudents] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  /* Tabs */
  const [activeTab, setActiveTab] = useState('codes');

  /* Search/filter */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  
  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  /* ── Fetch data ── */
  useEffect(() => {
    Promise.all([
      api.get(`/api/elections/${id}`),
      api.get(`/api/voters/elections/${id}/codes`),
    ]).then(([elRes, codeRes]) => {
      setElection(elRes.data.election);
      setCodes(codeRes.data.codes);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  /* ── Generate codes ── */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const body = assignToStudents
        ? { count: 0, assignToStudents: true }
        : { count: codeCount };
      const res = await api.post(`/api/voters/elections/${id}/codes/generate`, body);
      setCodes(prev => [...prev, ...res.data.codes]);
      toast.success(`${res.data.count} codes generated successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  /* ── Export PDF ── */
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const res = await api.get(`/api/voters/elections/${id}/codes/export-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voter-codes-election-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported');
    } catch (err) {
      toast.error('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  /* ── Delete single code ── */
  const handleDeleteCode = async (codeId) => {
    try {
      await api.delete(`/api/voters/elections/${id}/codes/${codeId}`);
      setCodes(prev => prev.filter(c => c.id !== codeId));
      toast.success('Code deleted');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete code');
    }
  };

  /* ── Revoke all unused codes ── */
  const handleRevokeAll = () => {
    setShowRevokeModal(true);
  };

  const confirmRevokeAll = async () => {
    try {
      const res = await api.delete(`/api/voters/elections/${id}/codes`);
      setCodes(prev => prev.filter(c => c.is_used));
      toast.success(`${res.data.count} unused codes revoked`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to revoke codes');
    } finally {
      setShowRevokeModal(false);
    }
  };

  /* ── Export codes ── */
  const exportCodes = () => {
    const unused = codes.filter(c => !c.is_used);
    const csv = 'Code,Status\n' + unused.map(c => `${c.code},Unused`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voter-codes-election-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Derived data ── */
  const usedCount = codes.filter(c => c.is_used).length;
  const availableCount = codes.length - usedCount;
  const usagePercent = codes.length > 0 ? Math.round((usedCount / codes.length) * 100) : 0;

  /* ── Filter codes ── */
  const filteredCodes = codes.filter(c => {
    const matchesSearch = searchQuery === '' ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'used' && c.is_used) ||
      (statusFilter === 'available' && !c.is_used);
    return matchesSearch && matchesStatus;
  });
  
  /* ── Paginate codes ── */
  const totalPages = Math.ceil(filteredCodes.length / PAGE_SIZE);
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCodes.slice(start, start + PAGE_SIZE);
  }, [filteredCodes, currentPage]);
  
  /* Reset page when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-surface-200 border-t-primary-600" />
          <p className="text-sm text-surface-500">Loading voter data...</p>
        </div>
      </div>
    );
  }

  /* ── Tab definitions ── */
  const tabs = [
    { id: 'codes', label: 'Voter Codes', icon: <Ticket className="h-5 w-5" /> },
    { id: 'management', label: 'Code Management', icon: <Settings className="h-5 w-5" /> },
  ];

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
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Manage Voters
            </h1>
            {election && (
              <p className="text-sm text-surface-500 mt-0.5">{election.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STUDENT_ID_PIN INFO
          ═══════════════════════════════════════════ */}
      {election?.auth_method === 'student_id_pin' && (
        <div className="bg-primary-50 border border-primary-500/20 rounded-xl p-5 flex items-start gap-3">
          <div className="flex-shrink-0 text-primary-600 mt-0.5">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-800 mb-1">Student ID + PIN Authentication</h3>
            <p className="text-sm text-surface-600">
              This election uses Student ID + PIN authentication. Manage students from the{' '}
              <Link to="/admin/students" className="text-primary-600 font-medium hover:underline">
                Students page
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VOTER CODE CONTENT
          ═══════════════════════════════════════════ */}
      {election?.auth_method === 'voter_code' && (
        <>
          {/* ── Stats cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="text-sm font-medium text-surface-500">Total Codes</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{codes.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="text-sm font-medium text-surface-500">Available</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{availableCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="text-sm font-medium text-surface-500">Used</p>
              <p className="text-2xl font-bold text-danger-500 mt-1">{usedCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="text-sm font-medium text-surface-500">Usage Rate</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold text-surface-900">{usagePercent}%</p>
              </div>
              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-surface-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Tab navigation ── */}
          <div className="border-b border-surface-200">
            <nav className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ════════════════════════════════════
              TAB: VOTER CODES
              ════════════════════════════════════ */}
          {activeTab === 'codes' && (
            <div className="space-y-4">
              {/* Generate codes card */}
              <div className="bg-white rounded-xl border border-surface-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-surface-800 mb-1">
                      Generate Voter Codes
                    </h3>
                    <p className="text-sm text-surface-500 mb-3">
                      Create unique voter codes for this election. Each code can only be used once.
                    </p>

                    {/* Assign toggle */}
                    <div className="flex items-center gap-3 mb-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignToStudents}
                          onChange={(e) => setAssignToStudents(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                        <span className="ml-2 text-sm font-medium text-surface-700">Assign to registered students</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      {!assignToStudents && (
                        <div>
                          <label className="block text-xs font-medium text-surface-500 mb-1">
                            Number of codes
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={codeCount}
                            onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                            className="input w-32"
                          />
                        </div>
                      )}
                      <div className={assignToStudents ? '' : 'pt-5'}>
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="btn btn-primary"
                        >
                          <RefreshCw className="h-5 w-5" />
                          {generating ? 'Generating...' : assignToStudents ? 'Generate for Students' : 'Generate'}
                        </button>
                      </div>
                    </div>
                    {assignToStudents && (
                      <p className="text-xs text-primary-600 mt-2">
                        One code will be generated per registered student.
                      </p>
                    )}
                  </div>
                  {codes.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={exportCodes} className="btn btn-secondary">
                        <Download className="h-5 w-5" />
                        CSV
                      </button>
                      <button onClick={handleExportPDF} disabled={exportingPDF} className="btn btn-secondary">
                        <FileDown className="h-5 w-5" />
                        {exportingPDF ? 'Exporting...' : 'PDF'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Codes table */}
              <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
                {/* Table header with search and filter */}
                <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base font-semibold text-surface-800">
                    Voter Codes
                    <span className="text-sm font-normal text-surface-400 ml-2">
                      ({filteredCodes.length} of {codes.length})
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search codes..."
                        className="input !pl-9 w-48"
                      />
                    </div>
                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input w-auto"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                {codes.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
                        <Inbox className="h-12 w-12 text-surface-300" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-surface-700 mb-1">No codes generated yet</h3>
                    <p className="text-sm text-surface-500">
                      Use the form above to generate voter codes for this election.
                    </p>
                  </div>
                ) : filteredCodes.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-surface-500">No codes match your search criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-50 border-b border-surface-100">
                          <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Code
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Class
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Used Date
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {paginatedCodes.map((c, i) => (
                          <tr
                            key={c.code || i}
                            className="hover:bg-surface-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-medium text-surface-800 bg-surface-100 px-2 py-0.5 rounded">
                                {c.code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-surface-600">
                              {c.student_name || c.student_full_name || (
                                <span className="text-surface-400">--</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-surface-500 text-xs">
                              {c.class_name || (
                                <span className="text-surface-400">--</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {c.is_used ? (
                                <span className="badge badge-danger">Used</span>
                              ) : (
                                <span className="badge badge-success">Available</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-surface-500 text-xs">
                              {c.used_at ? new Date(c.used_at).toLocaleString() : (
                                <span className="text-surface-400">--</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!c.is_used ? (
                                <button
                                  onClick={() => handleDeleteCode(c.id)}
                                  className="text-danger-500 hover:text-danger-700 transition-colors p-1"
                                  title="Delete code"
                                >
                                  <Trash2 className="w-4 h-4" /></button>
                              ) : (
                                <span className="text-surface-300">--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table footer */}
                {filteredCodes.length > 0 && (
                  <>
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages} 
                      onPageChange={setCurrentPage} 
                    />
                    <div className="px-4 py-3 border-t border-surface-100 bg-surface-50 flex items-center justify-between">
                      <p className="text-xs text-surface-500">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredCodes.length)} of {filteredCodes.length}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-success-500" />
                          <span className="text-xs text-surface-500">Available: {availableCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-danger-500" />
                          <span className="text-xs text-surface-500">Used: {usedCount}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB: CODE MANAGEMENT
              ════════════════════════════════════ */}
          {activeTab === 'management' && (
            <div className="space-y-4">
              {/* Bulk actions */}
              <div className="bg-white rounded-xl border border-surface-200 p-6">
                <h3 className="text-base font-semibold text-surface-800 mb-1">
                  Bulk Actions
                </h3>
                <p className="text-sm text-surface-500 mb-4">
                  Manage all voter codes for this election.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={exportCodes} className="btn btn-secondary" disabled={codes.length === 0}>
                    <Download className="h-5 w-5" />
                    Export Unused Codes
                  </button>
                  <button onClick={handleRevokeAll} className="btn btn-danger" disabled={availableCount === 0}>
                    <Trash2 className="h-5 w-5" />Revoke All Unused Codes
                  </button>
                </div>
              </div>

              {/* Code statistics summary */}
              <div className="bg-white rounded-xl border border-surface-200 p-6">
                <h3 className="text-base font-semibold text-surface-800 mb-4">
                  Code Statistics
                </h3>
                <div className="space-y-4">
                  {/* Usage bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-600">Usage Progress</span>
                      <span className="text-sm font-semibold text-surface-800">{usagePercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-surface-50 rounded-lg">
                      <p className="text-2xl font-bold text-surface-900">{codes.length}</p>
                      <p className="text-xs text-surface-500 mt-0.5">Total Generated</p>
                    </div>
                    <div className="text-center p-3 bg-success-50 rounded-lg">
                      <p className="text-2xl font-bold text-success-600">{availableCount}</p>
                      <p className="text-xs text-surface-500 mt-0.5">Available</p>
                    </div>
                    <div className="text-center p-3 bg-danger-50 rounded-lg">
                      <p className="text-2xl font-bold text-danger-500">{usedCount}</p>
                      <p className="text-xs text-surface-500 mt-0.5">Used</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips card */}
              <div className="bg-primary-50 border border-primary-500/20 rounded-xl p-5 flex items-start gap-3">
                <div className="flex-shrink-0 text-primary-600 mt-0.5">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-800 mb-1">Tips</h3>
                  <ul className="text-sm text-surface-600 space-y-1">
                    <li>Each voter code can only be used once to cast a vote.</li>
                    <li>Export unused codes as CSV to distribute to voters.</li>
                    <li>Generate additional codes at any time during the election.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={confirmRevokeAll}
        title="Revoke All Unused Codes"
        message="Are you sure you want to revoke ALL unused codes? This cannot be undone."
        confirmLabel="Revoke All"
        variant="danger"
      />
    </div>
  );
}
