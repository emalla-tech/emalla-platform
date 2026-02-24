
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role: UserRole, token: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
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
    // Simulate token verification with backend
    const verifyToken = async () => {
      if (token) {
        try {
          // In production: const response = await api.get('/auth/verify');
          // For now, we simulate a valid user based on stored role or default
          const storedUser = localStorage.getItem('emalla_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email: string, role: UserRole, authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: `USR-${Math.floor(Math.random() * 1000)}`,
        name: email.split('@')[0],
        email: email,
        role: role,
        status: 'active',
        createdAt: new Date().toISOString(),
        orderCount: 0
      };

      setToken(authToken);
      setUser(mockUser);
      localStorage.setItem('emalla_token', authToken);
      localStorage.setItem('emalla_user', JSON.stringify(mockUser));
    } catch (err) {
      setError('Invalid credentials. Please check your email and password.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Registration logic here
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
