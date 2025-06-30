import React, { useState } from 'react';
import { useAuth }        from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { signIn } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch {
      setErrorMsg('Credenciales incorrectas');
    }
  };

  return (
    <main
      className="main"
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2D2D2D'
      }}
    >
      <div
        className="content-box"
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 className="title" style={{ textAlign: 'center' }}>
          Iniciar Sesión
        </h1>

        <form onSubmit={onSubmit} className="modal-body">
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <p style={{ color: '#DC2626', textAlign: 'center', marginTop: '0.5rem' }}>
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn success" style={{ width: '100%' }}>
              Entrar
            </button>
          </div>
        </form>

        {/* Link a Signup */}
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#9CA3AF' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" style={{ color: '#16A34A', fontWeight: '600' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
