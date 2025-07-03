// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../renderer/supabaseClient'

const AuthContext = createContext({
  user:    null,
  session: null,
  loading: true,
  signIn:  async () => ({ data: null, error: null }),
  signUp:  async () => ({ data: null, error: null }),
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let sub
    ;(async () => {
      const {
        data: { session: s },
        error: sessError
      } = await supabase.auth.getSession()
      if (!sessError && s) {
        setSession(s)
        setUser(s.user)
      }
      setLoading(false)
    })()

    sub = supabase.auth
      .onAuthStateChange((_, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (_ === 'SIGNED_IN' && s?.user) {
          const u = s.user
          supabase
            .from('profiles')
            .upsert({ id: u.id, email: u.email, role: 'admin' }, {
              onConflict: 'id',
              returning: 'minimal'
            })
            .then(({ error }) => error && console.error('upsert profile:', error))
        }
      })
      .data.subscription

    return () => sub?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    let data = null, error = null

    try {
      const res = await supabase.auth.signInWithPassword({ email, password })
      data  = res.data
      error = res.error
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.user)
      }
    } catch (err) {
      error = err
    } finally {
      setLoading(false)
    }
    return { data, error }
  }

  const signUp = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.session) {
      setSession(data.session)
      setUser(data.user)
    }
    setLoading(false)
    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
