
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/app/integrations/supabase/client';

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Hardcoded user for avelezsanti - no authentication required
const HARDCODED_USER_EMAIL = 'avelezsanti@example.com';
const HARDCODED_USER_ID = '00000000-0000-0000-0000-000000000001'; // Mock UUID

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[SupabaseContext] Initializing with hardcoded user: avelezsanti');
    
    // Create a mock user object for avelezsanti
    const mockUser: User = {
      id: HARDCODED_USER_ID,
      email: HARDCODED_USER_EMAIL,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    // Create a mock session
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: mockUser,
    } as Session;

    setUser(mockUser);
    setSession(mockSession);
    setLoading(false);

    console.log('[SupabaseContext] Mock user and session created for avelezsanti');
  }, []);

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        loading,
        isConfigured: true,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
