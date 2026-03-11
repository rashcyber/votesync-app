import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Send, Users, Mail, Bell, MessageSquare, CheckCircle, Loader2, Trash2, GraduationCap, Building } from 'lucide-react';

export default function Messages() {
  const { id: electionId } = useParams();
  const [election, setElection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [messageType, setMessageType] = useState('election'); // 'election' or 'general'
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    target_group: 'all',
    class_filter: '',
    hall_filter: '',
  });

  useEffect(() => {
    fetchData();
  }, [electionId]);

  const fetchData = async () => {
    try {
      const promises = [
        api.get(`/api/elections/${electionId}`),
        api.get(`/api/elections/${electionId}/notifications`).catch(() => ({ data: { notifications: [] } })),
        api.get('/api/voters/students').catch(() => ({ data: { students: [] } })),
      ];
      
      if (!electionId) {
        promises[0] = api.get('/api/public/notifications').catch(() => ({ data: { notifications: [] } }));
      }
      
      const results = await Promise.all(promises);
      if (electionId) {
        setElection(results[0].data.election);
        setNotifications(results[1].data.notifications || []);
      } else {
        setNotifications(results[0].data.notifications || []);
      }
      setStudents(results[2].data.students || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      if (messageType === 'general') {
        await api.post(`/api/announcements`, form);
        toast.success('Announcement sent successfully');
      } else {
        await api.post(`/api/elections/${electionId}/notifications`, form);
        toast.success('Message sent successfully');
      }
      setForm({ title: '', message: '', type: 'announcement', target_group: 'all', class_filter: '', hall_filter: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {electionId && (
            <Link
              to={`/admin/elections/${electionId}`}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Bulk Messages</h1>
            <p className="text-surface-500">{election?.title || 'General Announcements'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Send className="w-4 h-4" />
          Send Message
        </button>
      </div>

      {/* Send Message Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Send Bulk Message</h2>
          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Group */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Send To</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setMessageType('general'); setForm({ ...form, target_group: 'all' }); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messageType === 'general'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-surface-100 text-surface-600 border border-surface-200 hover:bg-surface-200'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  All Students (General)
                </button>
                <button
                  type="button"
                  onClick={() => { setMessageType('election'); setForm({ ...form, target_group: 'all' }); }}
                  disabled={!electionId}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messageType === 'election'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-surface-100 text-surface-600 border border-surface-200 hover:bg-surface-200 disabled:opacity-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Election Voters
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Message Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Election Reminder"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Message Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input w-full"
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
            </div>

            {/* Filter by Class/Hall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  Filter by Class
                </label>
                <select
                  value={form.class_filter}
                  onChange={(e) => setForm({ ...form, class_filter: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All Classes</option>
                  {[...new Set(students.map(s => s.class_name).filter(Boolean))].map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Filter by Hall/House
                </label>
                <select
                  value={form.hall_filter}
                  onChange={(e) => setForm({ ...form, hall_filter: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All Halls/Houses</option>
                  {[...new Set(students.map(s => s.hall).filter(Boolean))].map(hall => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
              </div>
              {(form.class_filter || form.hall_filter) && (
                <p className="col-span-full text-xs text-surface-500">
                  Message will only be sent to students matching the selected filters.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Enter your message to voters..."
                rows={4}
                className="input w-full resize-none"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">About Bulk Messaging</h3>
            <p className="text-sm text-primary-700 mt-1">
              Send announcements, reminders, and alerts to all voters in this election. 
              Messages will be stored and displayed to voters when they log in to vote.
            </p>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-surface-800">Message History</h2>
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No messages sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    notification.type === 'alert' ? 'bg-danger-100 text-danger-600' :
                    notification.type === 'reminder' ? 'bg-warning-100 text-warning-600' :
                    'bg-primary-100 text-primary-600'
                  }`}>
                    {notification.type === 'alert' ? <Bell className="w-5 h-5" /> :
                     notification.type === 'reminder' ? <Mail className="w-5 h-5" /> :
                     <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-800">{notification.title}</h3>
                    <p className="text-sm text-surface-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-surface-400 mt-2">
                      Sent {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
