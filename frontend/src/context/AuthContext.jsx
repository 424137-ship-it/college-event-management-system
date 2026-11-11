import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('harshax_user') || localStorage.getItem('campusx_user');
    if (!saved || saved === 'undefined' || saved === 'null' || saved === '[object Object]') {
      return null;
    }
    return JSON.parse(saved);
  } catch (e) {
    console.warn('Corrupt user object in localStorage, clearing cache:', e);
    try {
      localStorage.removeItem('harshax_user');
      localStorage.removeItem('campusx_user');
    } catch (_) {}
    return null;
  }
};

const getStoredToken = () => {
  try {
    const t = localStorage.getItem('harshax_access_token') || localStorage.getItem('campusx_access_token');
    if (!t || t === 'undefined' || t === 'null') {
      return null;
    }
    return t;
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getStoredToken();
      if (accessToken && accessToken !== 'demo-token') {
        try {
          const res = await authAPI.getProfile();
          setUser(res.data);
          localStorage.setItem('harshax_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or profile fetch failed:', err);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('harshax_access_token', access);
      localStorage.setItem('harshax_refresh_token', refresh);
      localStorage.setItem('harshax_user', JSON.stringify(userData));
      setToken(access);
      setUser(userData);
      toast.success(`Welcome back, ${userData.first_name || userData.username}!`);
      return userData;
    } catch (err) {
      // Offline / Preview Demo Accounts fallback for National Institute of Technology (NIT)
      const u = (credentials.username || '').toLowerCase();
      if (!err.response && (u === 'harsha' || u === 'organizer' || u === 'admin')) {
        let role = 'STUDENT';
        let fullName = 'Harsha Vardhan';
        if (u === 'organizer') {
          role = 'ORGANIZER';
          fullName = 'Campus Organizer';
        } else if (u === 'admin') {
          role = 'ADMIN';
          fullName = 'NIT Administrator';
        }

        const demoUser = {
          id: 999,
          username: u,
          email: `${u}@nit.ac.in`,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ')[1] || '',
          role: role,
          is_superuser: role === 'ADMIN',
          student_profile: {
            roll_number: '424137',
            department_name: 'Computer Science & Engineering',
            year_of_study: 4,
          },
        };

        localStorage.setItem('harshax_access_token', 'demo-token');
        localStorage.setItem('harshax_user', JSON.stringify(demoUser));
        setToken('demo-token');
        setUser(demoUser);
        toast.success(`Welcome to NIT Portal, ${demoUser.first_name}! (Campus Preview)`);
        return demoUser;
      }

      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid username or password';
      toast.error(errorMsg);
      throw err;
    }
  };

  const register = async (data) => {
    try {
      const res = await authAPI.register(data);
      toast.success(res.data.message || 'Registration successful! You can now log in.');
      return res.data;
    } catch (err) {
      const errorMsg = Object.values(err.response?.data || {})?.[0]?.[0] || 'Registration failed. Please check inputs.';
      toast.error(errorMsg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('harshax_access_token');
    localStorage.removeItem('harshax_refresh_token');
    localStorage.removeItem('harshax_user');
    localStorage.removeItem('campusx_access_token');
    localStorage.removeItem('campusx_refresh_token');
    localStorage.removeItem('campusx_user');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully.');
  };

  const updateProfile = async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      setUser(res.data);
      localStorage.setItem('harshax_user', JSON.stringify(res.data));
      toast.success('Profile updated successfully!');
      return res.data;
    } catch (err) {
      toast.error('Failed to update profile.');
      throw err;
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
  const isOrganizer = user?.role === 'ORGANIZER' || isAdmin;
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isOrganizer,
        isStudent,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
