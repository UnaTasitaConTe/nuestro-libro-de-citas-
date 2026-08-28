import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DragonIcon from '../components/DragonIcon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
      {/* ---------- Hero ---------- */}
      <section className="fade-in-up min-w-0 text-center lg:text-left">
        <span className="chip chip-gold mx-auto lg:mx-0">Para dos, para siempre</span>

        <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-ink-strong sm:text-5xl lg:text-6xl">
          Nuestro Libro
          <br />
          <span className="title-gold">de Citas</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink lg:mx-0">
          Cada cita tiene dos versiones: la tuya y la suya. Guárdenlas juntas, con sus fotos,
          sus corazones y lo que sintieron esa noche.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <span className="chip">💛 Dos versiones por cita</span>
          <span className="chip">📸 Álbum tipo polaroid</span>
          <span className="chip">✨ Backlog de ideas</span>
        </div>
      </section>

      {/* ---------- Formulario ---------- */}
      <section className="min-w-0">
        <form
          onSubmit={handleSubmit}
          className="surface-glass surface-accent fade-in-up mx-auto w-full max-w-md p-7 sm:p-9"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="mb-5 flex justify-center">
            <DragonIcon className="h-16 w-16 drop-shadow-[0_0_18px_rgba(255,204,51,0.4)]" />
          </div>

          <h2 className="text-center font-display text-2xl font-semibold text-ink-strong">
            ¡Hola de nuevo!
          </h2>
          <p className="mb-7 mt-1.5 text-center text-sm text-ink">
            Entra para seguir escribiendo su historia.
          </p>

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger"
            >
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="mb-7">
            <label className="field-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="mt-6 text-center text-sm text-ink">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="font-semibold text-royal-light underline-offset-4 transition-colors hover:text-ink-dark hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
