// src/renderer/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth }        from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { signIn, signOut } = useAuth();
  const navigate             = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => {
    return localStorage.getItem('remember') === 'true';
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Si NO marcó "remember", al cerrar pestaña hacemos signOut
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!remember) signOut().catch(console.error);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () =>
      window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [remember, signOut]);

  const onSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');
    // Guardamos la preferencia
    localStorage.setItem('remember', remember ? 'true' : 'false');

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch {
      setErrorMsg('📛 Email o contraseña incorrectos');
    }
  };

  return (
    <main className="main" style={{
      minHeight: '100vh',
      display:   'flex',
      justifyContent: 'center',
      alignItems:     'center',
      backgroundColor:'#2D2D2D'
    }}>
      <div className="content-box" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 className="title" style={{ textAlign: 'center' }}>Iniciar Sesión</h1>
        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Mantener sesión abierta
            </label>
          </div>

          {errorMsg && (
            <p style={{ color: '#DC2626', textAlign: 'center', marginTop: '0.5rem' }}>
              {errorMsg}
            </p>
          )}

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn success" style={{ width: '100%' }}>
              Entrar
            </button>
          </div>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#9CA3AF' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" style={{ color: '#16A34A', fontWeight: '600' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
