
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: { name: string; email: string; password: string; role: UserRole }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<User>;
  logoutAllDevices: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('emalla_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('emalla_token');
      if (storedToken) {
        try {
          const verifiedUser = await authService.verifyToken(storedToken);
          setUser(verifiedUser);
          localStorage.setItem('emalla_user', JSON.stringify(verifiedUser));
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('emalla_token');
          localStorage.removeItem('emalla_user');
        }
      }
      setIsLoading(false);
    };
    verifyStoredToken();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('emalla_token', response.token);
      localStorage.setItem('emalla_user', JSON.stringify(response.user));
      return response.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please check your email and password.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('emalla_token', response.token);
      localStorage.setItem('emalla_user', JSON.stringify(response.user));
      return response.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.changePassword(currentPassword, newPassword);
      setUser(updatedUser);
      localStorage.setItem('emalla_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password right now.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAllDevices = async () => {
    try {
      await authService.logoutAllSessions();
    } finally {
      logout();
    }
  };

  const logout = () => {
    authService.logoutCurrentSession().catch(() => undefined);
    setToken(null);
    setUser(null);
    localStorage.removeItem('emalla_token');
    localStorage.removeItem('emalla_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      isLoading, 
      login, 
      register, 
      changePassword,
      logoutAllDevices,
      logout,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
