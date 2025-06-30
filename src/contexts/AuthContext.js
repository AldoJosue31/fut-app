// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase }       from '../renderer/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Rehidratar sesión al montar
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (err) {
        console.error('Error al rehidratar sesión:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // 2) Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      // Solo tras iniciar sesión exitosamente
      if (event === 'SIGNED_IN' && newSession?.user) {
        const user = newSession.user;
        try {
          // Inserta o actualiza el perfil con rol "admin"
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id:   user.id,
              email: user.email,
              role: 'admin'
            }, { onConflict: 'id' })
            .single();
          if (error) console.error('Error upsert profile:', error);
        } catch (err) {
          console.error('Excepción al upsert profile:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return { data, error };
    } catch (err) {
      console.error('Error al iniciar sesión:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      const response = await supabase.auth.signUp({ email, password });
      const { data, error } = response;
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return response;
    } catch (err) {
      console.error('Error al registrarse:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
