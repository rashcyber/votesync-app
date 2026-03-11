import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EVENT_TYPE_OPTIONS = [
  {
    value: 'src',
    label: 'SRC / School Government',
    description: 'Student representative council elections',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    color: 'border-primary-300 bg-primary-50 text-primary-700 ring-primary-500',
  },
  {
    value: 'class_rep',
    label: 'Class Representative',
    description: 'Faculty and class-level representatives',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    color: 'border-purple-300 bg-purple-50 text-purple-700 ring-purple-500',
  },
  {
    value: 'hall',
    label: 'Hall / Hostel',
    description: 'Dormitory and hall council elections',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: 'border-orange-300 bg-orange-50 text-orange-700 ring-orange-500',
  },
  {
    value: 'pageant',
    label: 'Pageant / Contest',
    description: 'Beauty pageants and talent competitions',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    color: 'border-pink-300 bg-pink-50 text-pink-700 ring-pink-500',
  },
  {
    value: 'custom',
    label: 'Custom Event',
    description: 'Any other type of voting event',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'border-surface-300 bg-surface-50 text-surface-700 ring-surface-500',
  },
];

function formatDateForInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ElectionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`/api/elections/${id}`)
      .then(res => {
        const e = res.data.election;
        setForm({
          title: e.title || '',
          description: e.description || '',
          event_type: e.event_type || 'src',
          voting_type: e.voting_type || 'free',
          auth_method: e.auth_method || 'student_id_pin',
          price_per_vote: e.price_per_vote || 1,
          currency: e.currency || 'GHS',
          code_prefix: e.code_prefix || '',
          start_date: formatDateForInput(e.start_date),
          end_date: formatDateForInput(e.end_date),
          ussd_enabled: e.ussd_enabled || 0,
          ussd_service_code: e.ussd_service_code || '',
        });
      })
      .catch(() => toast.error('Failed to load election'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Election title is required';
    if (!form.start_date) newErrors.start_date = 'Start date is required';
    if (!form.end_date) newErrors.end_date = 'End date is required';
    if (form.start_date && form.end_date && new Date(form.start_date) >= new Date(form.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (form.voting_type === 'paid' && (!form.price_per_vote || Number(form.price_per_vote) <= 0)) {
      newErrors.price_per_vote = 'Price per vote must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/elections/${id}`, form);
      toast.success('Election updated successfully!');
      navigate(`/admin/elections/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update election');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          to={`/admin/elections/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Election Details
        </Link>
        <h1 className="text-3xl font-bold text-surface-900">Edit Election</h1>
        <p className="text-surface-500 mt-1">Update the election settings and configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-800">Basic Information</h2>
                <p className="text-xs text-surface-400">Update the election name and description</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Election Title <span className="text-danger-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., SRC Presidential Election 2025"
                className={`input w-full ${errors.title ? 'border-danger-500 ring-1 ring-danger-500' : ''}`}
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {errors.title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Briefly describe the purpose and scope of this election..."
                className="input w-full resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Election Type */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-800">Election Type</h2>
                <p className="text-xs text-surface-400">Choose the type of event for this election</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EVENT_TYPE_OPTIONS.map(option => {
                const isSelected = form.event_type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setField('event_type', option.value)}
                    className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `${option.color} ring-2`
                        : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className={`mb-2 ${isSelected ? '' : 'text-surface-400'}`}>
                      {option.icon}
                    </div>
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-surface-400'}`}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Voting Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-800">Voting Configuration</h2>
                <p className="text-xs text-surface-400">Configure how voters will participate</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Voting Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-3">Voting Type</label>
              <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setField('voting_type', 'free')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    form.voting_type === 'free'
                      ? 'bg-white text-success-700 shadow-sm ring-1 ring-surface-200'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Free Voting
                </button>
                <button
                  type="button"
                  onClick={() => setField('voting_type', 'paid')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    form.voting_type === 'paid'
                      ? 'bg-white text-warning-600 shadow-sm ring-1 ring-surface-200'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  Paid Voting
                </button>
              </div>
            </div>

            {/* Price per Vote (Paid only) */}
            {form.voting_type === 'paid' && (
              <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Price per Vote (GHS) <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">GHS</span>
                  <input
                    name="price_per_vote"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price_per_vote}
                    onChange={handleChange}
                    className={`input w-full !pl-12 ${errors.price_per_vote ? 'border-danger-500 ring-1 ring-danger-500' : ''}`}
                  />
                </div>
                {errors.price_per_vote && (
                  <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {errors.price_per_vote}
                  </p>
                )}
              </div>
            )}

            {/* Auth Method */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-3">Authentication Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setField('auth_method', 'student_id_pin')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    form.auth_method === 'student_id_pin'
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-500'
                      : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    form.auth_method === 'student_id_pin' ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${form.auth_method === 'student_id_pin' ? 'text-primary-700' : 'text-surface-700'}`}>
                      Student ID + PIN
                    </span>
                    <p className="text-xs text-surface-400 mt-0.5">Voters authenticate with their student ID and PIN</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setField('auth_method', 'voter_code')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    form.auth_method === 'voter_code'
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-500'
                      : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    form.auth_method === 'voter_code' ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${form.auth_method === 'voter_code' ? 'text-primary-700' : 'text-surface-700'}`}>
                      Voter Code
                    </span>
                    <p className="text-xs text-surface-400 mt-0.5">Voters use a unique one-time code to vote</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Code Prefix */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Code Prefix
                <span className="text-surface-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                name="code_prefix"
                value={form.code_prefix}
                onChange={handleChange}
                placeholder="e.g., SRC, PGT, HALL"
                className="input w-full max-w-xs"
              />
              <p className="text-xs text-surface-400 mt-1.5">A short prefix added to generated voter codes</p>
            </div>
          </div>
        </div>

        {/* Section 4: USSD Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-800">USSD Voting</h2>
                <p className="text-xs text-surface-400">Allow voters to cast votes via USSD short code</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-700">Enable USSD Voting</p>
                <p className="text-xs text-surface-400 mt-0.5">Allow votes via Africa's Talking USSD gateway</p>
              </div>
              <button
                type="button"
                onClick={() => setField('ussd_enabled', form.ussd_enabled ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.ussd_enabled ? 'bg-primary-500' : 'bg-surface-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.ussd_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {form.ussd_enabled ? (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  USSD Service Code
                </label>
                <input
                  name="ussd_service_code"
                  value={form.ussd_service_code}
                  onChange={handleChange}
                  placeholder="e.g., *384*12345#"
                  className="input w-full max-w-xs"
                />
                <p className="text-xs text-surface-400 mt-1.5">The short code voters will dial to vote</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Section 5: Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-800">Schedule</h2>
                <p className="text-xs text-surface-400">Update the start and end dates for voting</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Start Date <span className="text-danger-500">*</span>
                </label>
                <input
                  name="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={handleChange}
                  className={`input w-full ${errors.start_date ? 'border-danger-500 ring-1 ring-danger-500' : ''}`}
                />
                {errors.start_date && (
                  <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {errors.start_date}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  End Date <span className="text-danger-500">*</span>
                </label>
                <input
                  name="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={handleChange}
                  className={`input w-full ${errors.end_date ? 'border-danger-500 ring-1 ring-danger-500' : ''}`}
                />
                {errors.end_date && (
                  <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-lg w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Save Changes
              </>
            )}
          </button>
          <Link
            to={`/admin/elections/${id}`}
            className="btn btn-secondary w-full sm:w-auto text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
