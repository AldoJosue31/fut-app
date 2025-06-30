// src/renderer/pages/Signup.jsx
import React, { useState } from 'react';
import { useAuth }         from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const { signUp }           = useAuth();
  const navigate             = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading]   = useState(false);

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const onSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');

    // 1) Validaciones locales
    if (!emailRegex.test(email)) {
      setErrorMsg('Email con formato inválido.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // 2) Solo registra en Auth
      const { data, error } = await signUp(email, password);
      if (error) throw error;

      // 3) Navega al login o muestra instrucción de confirmación
      navigate('/login');
      // Alternativa: mostrar “Revisa tu email para confirmar la cuenta”
    } catch (err) {
      console.error('Error en signUp:', err);
      setErrorMsg(
        err.message.includes('invalid')
          ? 'El email no es válido para nuestro sistema.'
          : 'Error al registrarse. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="main"
      style={{
        minHeight: '100vh',
        backgroundColor: '#2D2D2D',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="content-box" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="title" style={{ textAlign: 'center' }}>Regístrate</h1>

        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {errorMsg && (
            <p style={{ color: '#DC2626', textAlign: 'center', marginTop: '0.5rem' }}>
              {errorMsg}
            </p>
          )}

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn success"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#16A34A' }}
            >
              {loading ? 'Procesando…' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#9CA3AF' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#16A34A', fontWeight: '600' }}>
            Inicia Sesión
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
