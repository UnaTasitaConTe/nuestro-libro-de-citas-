import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DragonIcon from '../components/DragonIcon';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite') || undefined;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, inviteCode);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <section className="fade-in-up min-w-0 text-center lg:text-left">
        <span className="chip chip-gold mx-auto lg:mx-0">Empieza su libro</span>

        <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-ink-strong sm:text-5xl lg:text-6xl">
          Una historia,
          <br />
          <span className="title-gold">dos voces</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink lg:mx-0">
          Creen su libro compartido en un minuto. Después podrás invitar a tu pareja con un
          simple enlace.
        </p>
      </section>

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
            Crear cuenta
          </h2>

          {inviteCode ? (
            <p className="mb-7 mt-3 rounded-xl border border-royal-light/25 bg-royal-light/10 px-4 py-2.5 text-center text-sm text-royal-light">
              Te estás uniendo con una invitación 💌
            </p>
          ) : (
            <p className="mb-7 mt-1.5 text-center text-sm text-ink">
              Estás creando un libro de citas nuevo. Después podrás invitar a tu pareja.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger"
            >
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="field-label" htmlFor="register-name">
              Nombre
            </label>
            <input
              id="register-name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="¿Cómo te llamas?"
            />
          </div>

          <div className="mb-4">
            <label className="field-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
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
            <label className="field-label" htmlFor="register-password">
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>

          <p className="mt-6 text-center text-sm text-ink">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-royal-light underline-offset-4 transition-colors hover:text-ink-dark hover:underline"
            >
              Entra
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
