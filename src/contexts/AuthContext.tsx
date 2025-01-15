import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthState } from '../types';

const AuthContext = createContext<{
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session && mounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setAuthState({ session: null, user: null, loading: false });
            return;
          }

          setAuthState({
            session,
            user: profile,
            loading: false,
          });
        } else if (mounted) {
          setAuthState({
            session: null,
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            session: null,
            user: null,
            loading: false,
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      try {
        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setAuthState({ session: null, user: null, loading: false });
            return;
          }

          setAuthState({
            session,
            user: profile,
            loading: false,
          });
        } else {
          setAuthState({
            session: null,
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({
          session: null,
          user: null,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;

      // Wait for session to be established
      if (!data.session) {
        throw new Error('No session established after sign in');
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError) throw profileError;

      setAuthState({
        session: data.session,
        user: profile,
        loading: false,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: {
            full_name: '',
            avatar_url: '',
          }
        }
      });
      
      if (error) throw error;

      if (data.user) {
        // Create profile immediately after signup
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: '',
            bio: '',
            interests: [],
            services_offered: [],
          }]);

        if (profileError) throw profileError;
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return { requiresEmailConfirmation: !data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        session: null,
        user: null,
        loading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, signIn, signUp, signOut }}>
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