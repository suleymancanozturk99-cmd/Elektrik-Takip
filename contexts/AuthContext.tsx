import React, { createContext, ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: { email: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  tempEmail: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'electrician_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempEmail, setTempEmail] = useState<string | null>(null);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const { email } = JSON.parse(authData);
        setUser({ email });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string) => {
    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Geçersiz email adresi');
      }

      setTempEmail(email);
      
      // Simulate sending OTP (in real app, this would call an API)
      console.log(`OTP gönderildi: ${email} adresine`);
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      // Simulate OTP verification (in real app, this would verify with backend)
      // For demo purposes, accept any 6-digit number
      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new Error('OTP 6 haneli sayı olmalıdır');
      }

      // In real app, verify OTP with backend here
      // For demo, accept any 6-digit OTP
      
      const authData = { email, loginDate: new Date().toISOString() };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      setUser({ email });
      setTempEmail(null);
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setTempEmail(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      verifyOTP,
      logout,
      tempEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}