import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          
          // Verify token validity with backend
          try {
             await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/profile`, {
               headers: { Authorization: `Bearer ${storedToken}` }
             });
             // Token is valid
          } catch (err) {
            console.error("Token verification failed:", err);
            // Token invalid or expired - logout
            setToken(null);
            setUser(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }

        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const getToken = async () => {
    return token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      getToken,
      isAuthenticated: !!token,
      isLoaded: !loading
    }}>
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
