// src/renderer/pages/Login.jsx
import React, { useState } from 'react'
import { useAuth }          from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Login = () => {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading,  setLoading]  = useState(false)

  const onSubmit = async e => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      // si hay error, signIn hará 'throw', y caeremos al catch
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
           console.error('Error en login:', err)
      // aquí sí recibimos el AuthApiError de Supabase
      setErrorMsg(err.message || 'Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="main" style={{
      minHeight: '100vh', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#2D2D2D'
    }}>
      <div className="content-box" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="title" style={{ textAlign: 'center' }}>
          Iniciar Sesión
        </h1>

        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>



          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn success"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>

        {/* Error de autenticación */}
        {errorMsg && (
          <div
            className="login-error"
            style={{
              color: '#DC2626',
              textAlign: 'center',
              marginTop: '1rem',
              padding: '0.5rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <p style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" style={{ color: '#16A34A', fontWeight: '600' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
