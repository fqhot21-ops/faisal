import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

  // Configure axios to send cookies with every request
  axios.defaults.withCredentials = true;

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      // User not authenticated or token expired
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch user:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    // Check if user is authenticated on mount
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { user: userData } = response.data;
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name, role = 'user') => {
    const response = await axios.post(`${API_URL}/auth/register`, { 
      email, 
      password, 
      full_name, 
      role 
    });
    const { user: userData } = response.data;
    setUser(userData);
    return userData;
  };

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }
    } finally {
      setUser(null);
    }
  }, [API_URL]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};