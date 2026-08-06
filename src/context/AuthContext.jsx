import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token on mount
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(user => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('token');
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function register(email, password) {
    await api.post('/auth/register', { email, password });
    // After register, automatically login
    return login(email, password);
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setCurrentUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setCurrentUser(null);
  }

  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
