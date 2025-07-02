// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../renderer/supabaseClient';

const AuthContext = createContext({ /* ... */ });

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // rehidratar…
    const fetchSession = async () => {
      try {
        if (!navigator.onLine) {
          // sin Internet, salimos rápido
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (err) {
        console.error('Error rehidratando sesión:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    // listener onAuthStateChange (igual, solo si hay Internet)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' && newSession?.user && navigator.onLine) {
        // upsert perfil…
        supabase
          .from('profiles')
          .upsert({ /* … */ }, { onConflict: 'id' })
          .single()
          .catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error('No hay conexión');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error('No hay conexión');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn('Logout supabase falló:', error);
      } else {
        console.warn('Logout local sin Internet');
      }
      // limpiamos localmente igual
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
