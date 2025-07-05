// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../renderer/supabaseClient'

const AuthContext = createContext({
  user:    null,
  session: null,
  loading: true,
  signIn:  async () => {},
  signUp:  async () => {},
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(null)
  const [session,        setSession]        = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [processing,     setProcessing]     = useState(false)

  useEffect(() => {
    let sub
    ;(async () => {
      const {
        data: { session: s },
        error: sessErr
      } = await supabase.auth.getSession()

      if (s && !sessErr) {
        setSession(s)
        setUser(s.user)
      }
      setInitialLoading(false)
    })()

    sub = supabase.auth
      .onAuthStateChange((event, s) => {
        setSession(s)
        setUser(s?.user ?? null)

        if (event === 'SIGNED_IN' && s?.user) {
          const u = s.user
          supabase
            .from('profiles')
            .upsert(
              { id: u.id, email: u.email, role: 'admin' },
              { onConflict: 'id', returning: 'minimal' }
            )
            .then(({ error }) => error && console.error('upsert profile:', error))
        }
      })
      .data.subscription

    return () => sub?.unsubscribe()
  }, [])

  // --- Traducción de errores comunes ---
  const traducirError = (msg) => {
    switch (msg) {
      case 'Invalid login credentials':
        return 'Correo o contraseña incorrectos'
      case 'Invalid input':
        return 'Formato de dato inválido'
      // añade más casos si quieres traducir otros mensajes de Supabase
      default:
        return msg
    }
  }

  const signIn = async (email, password) => {
    setProcessing(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // traducimos antes de lanzar
        throw new Error(traducirError(error.message || error.error_description))
      }
      setSession(data.session)
      setUser(data.user)
      return data.session
    } finally {
      setProcessing(false)
    }
  }

  const signUp = async (email, password) => {
    setProcessing(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        throw new Error(traducirError(error.message || error.error_description))
      }
      setSession(data.session)
      setUser(data.user)
      return data.session
    } finally {
      setProcessing(false)
    }
  }

  const signOut = async () => {
    setProcessing(true)
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProcessing(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading:  initialLoading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
