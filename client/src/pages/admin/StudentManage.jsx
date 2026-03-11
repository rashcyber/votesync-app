import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Upload, Plus, Trash2, Download, Search, ArrowLeftRight, Check, FileText, X, Inbox, Wand2, Pencil } from 'lucide-react';


/* ────────────────────────────────────────────
   Field labels for the column mapping UI
   ──────────────────────────────────────────── */

const FIELD_META = {
  student_id: { label: 'Student ID', required: true },
  full_name:  { label: 'Full Name',  required: true },
  class_name: { label: 'Class',      required: false },
  hall:       { label: 'Hall / House', required: false },
  pin:        { label: 'PIN',        required: false, auto: true },
};

/* ────────────────────────────────────────────
   StudentManage component
   ──────────────────────────────────────────── */

export default function StudentManage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ student_id: '', pin: '', full_name: '', class_name: '', hall: '' });
  const [adding, setAdding] = useState(false);

  // Auto-generate state
  const [generateConfig, setGenerateConfig] = useState({
    idPrefix: 'STU',
    startNumber: 1,
    count: 10,
    className: '',
    hall: '',
    pinLength: 4
  });
  const [generating, setGenerating] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMapping, setImportMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [autoGeneratePins, setAutoGeneratePins] = useState(true);

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Edit state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ student_id: '', pin: '', full_name: '', class_name: '', hall: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchStudents = () => {
    api.get('/api/voters/students')
      .then(res => setStudents(res.data.students))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/api/voters/students', form);
      setForm({ student_id: '', pin: '', full_name: '', class_name: '', hall: '' });
      fetchStudents();
      toast.success('Student added');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/voters/students/${deleteTarget}`);
      fetchStudents();
      toast.success('Student deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      student_id: student.student_id || '',
      pin: student.pin || '',
      full_name: student.full_name || '',
      class_name: student.class_name || '',
      hall: student.hall || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      await api.put(`/api/voters/students/${editingStudent.id}`, editForm);
      fetchStudents();
      setEditingStudent(null);
      toast.success('Student updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update student');
    } finally {
      setSavingEdit(false);
    }
  };

  // Generate unique PIN
  const generatePin = (length) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const studentsToAdd = [];
      const { idPrefix, startNumber, count, class: className, hall, pinLength } = generateConfig;
      
      for (let i = 0; i < count; i++) {
        const num = startNumber + i;
        const numStr = num.toString().padStart(3, '0');
        studentsToAdd.push({
          student_id: `${idPrefix}${numStr}`,
          pin: generatePin(pinLength),
          full_name: `${idPrefix}${numStr} Student`,
          class_name: className || '',
          hall: hall || ''
        });
      }

      // Add students in batch
      for (const student of studentsToAdd) {
        await api.post('/api/voters/students', student).catch(() => {});
      }
      
      toast.success(`Generated ${count} student records`);
      fetchStudents();
      setShowGenerate(false);
    } catch (err) {
      toast.error('Failed to generate students');
    } finally {
      setGenerating(false);
    }
  };

  // Import handlers
  const handleFileUpload = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/api/voters/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportPreview(res.data);
      setImportMapping(res.data.suggestedMapping);
      toast.success('File parsed. Review the column mapping below.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to parse file');
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/api/voters/students/import/confirm', {
        fileId: importPreview.fileId,
        mapping: importMapping,
        generatePins: autoGeneratePins,
      });
      setImportResult(res.data);
      fetchStudents();
      toast.success(`${res.data.imported} students imported`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadPins = () => {
    if (!importResult?.generatedPins) return;
    const csv = 'Student ID,Name,PIN\n' + importResult.generatedPins.map(p =>
      `${p.student_id},"${p.full_name}",${p.pin}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-pins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllCredentials = () => {
    api.get('/api/students/export', { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student-credentials.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Student credentials downloaded');
      })
      .catch(() => toast.error('Failed to download credentials'));
  };

  /* ── Derived data ── */
  const uniqueClasses = [...new Set(students.map(s => s.class_name).filter(Boolean))].sort();

  const filteredStudents = students.filter(s => {
    const matchesSearch = searchQuery === '' ||
      s.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hall?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || s.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading students..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          PAGE HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
            <Users className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Students
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              {students.length} student{students.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowImport(!showImport); setShowAdd(false); }}
            className="btn btn-success"
          >
            <Upload className="h-5 w-5" />
            Import CSV/Excel
          </button>
          <button
            onClick={() => { setShowAdd(!showAdd); setShowImport(false); }}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5" />
            Add Student
          </button>
          <button
            onClick={() => { setShowGenerate(!showGenerate); setShowAdd(false); setShowImport(false); }}
            className="btn btn-warning"
          >
            <Wand2 className="h-5 w-5" />
            Auto Generate
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          AUTO GENERATE MODAL
          ═══════════════════════════════════════════ */}
      {showGenerate && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-800">Auto-Generate Students</h3>
            <button
              onClick={() => setShowGenerate(false)}
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Generate multiple student records at once. Student IDs will be in the format: PREFIX + NUMBER (e.g., STU001, STU002).
                PINs will be automatically generated.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">ID Prefix</label>
                <input
                  type="text"
                  value={generateConfig.idPrefix}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, idPrefix: e.target.value.toUpperCase() }))}
                  placeholder="e.g. STU, 24/25"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Starting Number</label>
                <input
                  type="number"
                  value={generateConfig.startNumber}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, startNumber: parseInt(e.target.value) || 1 }))}
                  min={1}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Number of Students</label>
                <input
                  type="number"
                  value={generateConfig.count}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, count: parseInt(e.target.value) || 10 }))}
                  min={1}
                  max={500}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">PIN Length</label>
                <select
                  value={generateConfig.pinLength}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, pinLength: parseInt(e.target.value) }))}
                  className="input w-full"
                >
                  <option value={4}>4 digits</option>
                  <option value={5}>5 digits</option>
                  <option value={6}>6 digits</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Class (optional)</label>
                <input
                  type="text"
                  value={generateConfig.className}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, className: e.target.value }))}
                  placeholder="e.g. Form 3A"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Hall / House (optional)</label>
                <input
                  type="text"
                  value={generateConfig.hall}
                  onChange={(e) => setGenerateConfig(p => ({ ...p, hall: e.target.value }))}
                  placeholder="e.g. Hall 1"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-surface-600">
                Preview: Will generate <strong>{generateConfig.idPrefix}{String(generateConfig.startNumber).padStart(3, '0')}</strong> to 
                <strong> {generateConfig.idPrefix}{String(generateConfig.startNumber + generateConfig.count - 1).padStart(3, '0')}</strong>
                ({generateConfig.count} students)
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAutoGenerate}
                disabled={generating || !generateConfig.idPrefix}
                className="btn btn-warning"
              >
                <Wand2 className="h-5 w-5" />
                {generating ? 'Generating...' : 'Generate Students'}
              </button>
              <button
                onClick={() => setShowGenerate(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ADD SINGLE STUDENT CARD
          ═══════════════════════════════════════════ */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-800">Add New Student</h3>
            <button
              onClick={() => setShowAdd(false)}
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddStudent} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Student ID <span className="text-danger-500">*</span>
                </label>
                <input
                  value={form.student_id}
                  onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))}
                  placeholder="e.g. STU001"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  PIN <span className="text-danger-500">*</span>
                </label>
                <input
                  value={form.pin}
                  onChange={(e) => setForm(p => ({ ...p, pin: e.target.value }))}
                  placeholder="4-6 digits"
                  type="password"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Class <span className="text-surface-400">(optional)</span>
                </label>
                <input
                  value={form.class_name}
                  onChange={(e) => setForm(p => ({ ...p, class_name: e.target.value }))}
                  placeholder="e.g. Form 3A"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Hall / House <span className="text-surface-400">(optional)</span>
                </label>
                <input
                  value={form.hall}
                  onChange={(e) => setForm(p => ({ ...p, hall: e.target.value }))}
                  placeholder="e.g. Hall 1 or House A"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={adding} className="btn btn-primary">
                <Plus className="h-5 w-5" />
                {adding ? 'Adding...' : 'Add Student'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          IMPORT SECTION
          ═══════════════════════════════════════════ */}
      {showImport && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-800">Import Students from CSV/Excel</h3>
            <button
              onClick={() => { setShowImport(false); setImportPreview(null); setImportResult(null); setImportFile(null); }}
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {!importPreview ? (
              /* ── Step 1: File Upload ── */
              <div className="space-y-4">
                <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors">
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                      <FileText className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-surface-700 mb-1">
                    Choose a file to upload
                  </p>
                  <p className="text-xs text-surface-400 mb-4">
                    Supports CSV, XLS, and XLSX formats
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="block w-full text-sm text-surface-500
                      file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                      file:bg-primary-50 file:text-primary-700 file:font-medium file:text-sm
                      hover:file:bg-primary-100 file:cursor-pointer file:transition-colors"
                  />
                  {importFile && (
                    <p className="mt-3 text-sm text-success-600 flex items-center justify-center gap-1.5">
                      <Check className="h-5 w-5" />
                      {importFile.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleFileUpload}
                  disabled={!importFile}
                  className="btn btn-primary"
                >
                  <Upload className="h-5 w-5" />
                  Upload &amp; Preview
                </button>
              </div>
            ) : !importResult ? (
              /* ── Step 2: Column Mapping & Preview ── */
              <div className="space-y-6">
                {/* Row count info */}
                <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 border border-primary-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-surface-700">
                    Found <span className="font-semibold text-primary-700">{importPreview.totalRows} rows</span> in your file. Map the columns below to proceed.
                  </p>
                </div>

                {/* Column mapping */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowLeftRight className="h-5 w-5" />
                    <h4 className="text-sm font-semibold text-surface-800">Column Mapping</h4>
                  </div>
                  <div className="bg-surface-50 rounded-xl border border-surface-100 divide-y divide-surface-100">
                    {Object.entries(FIELD_META).map(([field, meta]) => (
                      <div key={field} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-32 flex-shrink-0">
                          <span className="text-sm font-medium text-surface-700">
                            {meta.label}
                          </span>
                          {meta.required && (
                            <span className="text-danger-500 ml-0.5">*</span>
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-surface-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <select
                          value={importMapping[field] || ''}
                          onChange={(e) => setImportMapping(m => ({ ...m, [field]: e.target.value }))}
                          className="input flex-1"
                        >
                          <option value="">-- Not mapped --</option>
                          {importPreview.columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                        {importMapping[field] && (
                          <span className="badge badge-success text-xs flex-shrink-0">Mapped</span>
                        )}
                        {!importMapping[field] && !meta.required && (
                          <span className="badge badge-gray text-xs flex-shrink-0">Skipped</span>
                        )}
                        {!importMapping[field] && meta.required && (
                          <span className="badge badge-danger text-xs flex-shrink-0">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview table */}
                <div>
                  <h4 className="text-sm font-semibold text-surface-800 mb-3">Data Preview</h4>
                  <div className="overflow-x-auto rounded-xl border border-surface-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-50 border-b border-surface-100">
                          {importPreview.columns.map(col => (
                            <th key={col} className="text-left px-3 py-2.5 font-medium text-surface-500 uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {importPreview.preview.map((row, i) => (
                          <tr key={i} className="hover:bg-surface-50 transition-colors">
                            {importPreview.columns.map(col => (
                              <td key={col} className="px-3 py-2 text-surface-700">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PIN Generation Option */}
                <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGeneratePins}
                      onChange={(e) => setAutoGeneratePins(e.target.checked)}
                      className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-surface-700">Auto-generate PINs</span>
                      <p className="text-xs text-surface-500">
                        {autoGeneratePins 
                          ? 'PINs will be automatically generated for each student. If PIN column is mapped, existing values will be used.'
                          : 'PINs will be taken from the file. Make sure your file has a PIN column mapped.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Confirm button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || !importMapping.student_id || !importMapping.full_name}
                    className="btn btn-success"
                  >
                    <Check className="h-5 w-5" />
                    {importing ? 'Importing...' : 'Confirm Import'}
                  </button>
                  <button
                    onClick={() => { setImportPreview(null); setImportFile(null); }}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              /* ── Step 3: Import Results ── */
              <div className="space-y-4">
                <div className="bg-success-50 border border-success-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center text-success-600">
                        <Check className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-800 mb-1">Import Completed</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                          <span className="badge badge-success">{importResult.imported} imported</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="badge badge-warning">{importResult.skipped} skipped</span>
                        </span>
                      </div>
                      {importResult.errors?.length > 0 && (
                        <div className="mt-3 text-sm text-danger-600 bg-danger-50 rounded-lg p-3 border border-danger-100">
                          <p className="font-medium mb-1">Errors:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">
                            {importResult.errors.map((e, i) => (
                              <li key={i}>Row {e.row}: {e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {importResult.generatedPins && (
                    <button
                      onClick={downloadPins}
                      className="btn btn-primary"
                    >
                      <Download className="h-5 w-5" />
                      Download PIN Sheet (CSV)
                    </button>
                  )}
                  <button
                    onClick={() => { setImportPreview(null); setImportResult(null); setImportFile(null); }}
                    className="btn btn-secondary"
                  >
                    Import More
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STUDENTS TABLE
          ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        {/* Table header with search and filter */}
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-surface-800">
              All Students
              <span className="text-sm font-normal text-surface-400 ml-2">
                ({filteredStudents.length} of {students.length})
              </span>
            </h3>
            {students.length > 0 && (
              <button
                onClick={downloadAllCredentials}
                className="btn btn-secondary btn-sm"
                title="Download all student credentials"
              >
                <Download className="h-4 w-4" />
                Download Credentials
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="input !pl-9 w-48"
              />
            </div>
            {/* Class filter */}
            {uniqueClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table content */}
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
                <Inbox className="h-12 w-12 text-surface-300" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-surface-700 mb-1">No students registered yet</h3>
            <p className="text-sm text-surface-500 mb-4">
              Add students individually or import from a CSV/Excel file.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setShowImport(true); setShowAdd(false); }}
                className="btn btn-success btn-sm"
              >
                <Upload className="h-5 w-5" />
                Import File
              </button>
              <button
                onClick={() => { setShowAdd(true); setShowImport(false); }}
                className="btn btn-primary btn-sm"
              >
                <Plus className="h-5 w-5" />
                Add Student
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-surface-500">No students match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider hidden md:table-cell">
                    Class
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider hidden md:table-cell">
                    Hall
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-surface-800">{s.student_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-surface-900">{s.full_name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.class_name ? (
                        <span className="badge badge-primary">{s.class_name}</span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.hall ? (
                        <span className="text-sm text-surface-600">{s.hall}</span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h3 className="text-lg font-semibold text-surface-800">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Student ID <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.student_id}
                  onChange={(e) => setEditForm(p => ({ ...p, student_id: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  New PIN <span className="text-surface-400">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editForm.pin}
                  onChange={(e) => setEditForm(p => ({ ...p, pin: e.target.value }))}
                  placeholder="4-6 digits"
                  className="input w-full"
                />
                {editingStudent?.hasPin && (
                  <p className="text-xs text-success-600 mt-1">✓ Student has a PIN set</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={editForm.class_name}
                  onChange={(e) => setEditForm(p => ({ ...p, class_name: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">
                  Hall / House
                </label>
                <input
                  type="text"
                  value={editForm.hall}
                  onChange={(e) => setEditForm(p => ({ ...p, hall: e.target.value }))}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingStudent(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editForm.student_id || !editForm.full_name}
                className="btn btn-primary"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
