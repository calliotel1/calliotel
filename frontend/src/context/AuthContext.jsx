import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

export const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(safeLocalStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, fullName, birthday, referralCode = null) => {
    try {
      const payload = {
        email,
        password,
        full_name: fullName,
        birthday
      };
      
      if (referralCode) {
        payload.referral_code = referralCode;
      }
      
      const response = await axios.post(`${API}/auth/signup`, payload);
      
      const { access_token, user: userData} = response.data;
      safeLocalStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login API call starting...');
      console.log('API URL:', `${API}/auth/login`);
      
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      const { access_token, user: userData} = response.data;
      safeLocalStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login API error:', error);
      console.error('Error response:', error.response);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    safeLocalStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};