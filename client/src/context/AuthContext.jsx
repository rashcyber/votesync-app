import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [voterToken, setVoterToken] = useState(null);
  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminToken) {
      api.get('/api/admin/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then(res => setAdmin(res.data.admin))
        .catch(() => {
          setAdminToken(null);
          localStorage.removeItem('adminToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [adminToken]);

  const loginAdmin = async (username, password) => {
    const res = await api.post('/api/admin/login', { username, password });
    setAdminToken(res.data.token);
    setAdmin(res.data.admin);
    localStorage.setItem('adminToken', res.data.token);
    return res.data;
  };

  const logoutAdmin = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
  };

  const loginVoter = async (data) => {
    const res = await api.post('/api/voters/login', data);
    setVoterToken(res.data.token);
    setVoter(res.data.voter);
    return res.data;
  };

  const logoutVoter = () => {
    setVoter(null);
    setVoterToken(null);
  };

  // Normalize role for frontend checks
  const adminRole = admin?.role === 'superadmin' ? 'super_admin' : (admin?.role || 'admin');
  const isSuperAdmin = adminRole === 'super_admin';

  return (
    <AuthContext.Provider value={{
      admin, adminToken, adminRole, isSuperAdmin, voter, voterToken, loading,
      loginAdmin, logoutAdmin, loginVoter, logoutVoter,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
