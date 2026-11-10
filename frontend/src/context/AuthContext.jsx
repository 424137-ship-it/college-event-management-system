import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusx_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusx_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('campusx_access_token');
      if (accessToken) {
        try {
          const res = await authAPI.getProfile();
          setUser(res.data);
          localStorage.setItem('campusx_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired or profile fetch failed:', err);
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
      localStorage.setItem('campusx_access_token', access);
      localStorage.setItem('campusx_refresh_token', refresh);
      localStorage.setItem('campusx_user', JSON.stringify(userData));
      setToken(access);
      setUser(userData);
      toast.success(`Welcome back, ${userData.first_name || userData.username}!`);
      return userData;
    } catch (err) {
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
      localStorage.setItem('campusx_user', JSON.stringify(res.data));
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
