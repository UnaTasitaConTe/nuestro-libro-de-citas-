import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookHeart, Images, KanbanSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/ui/Field';
import PasswordInput from '../components/ui/PasswordInput';
import StatusMessage from '../components/ui/StatusMessage';

const FEATURES = [
  { Icon: BookHeart, text: 'Dos versiones por cita' },
  { Icon: Images, text: 'Álbum tipo polaroid' },
  { Icon: KanbanSquare, text: 'Backlog de ideas' },
];

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
      setError(err.response?.data?.error || 'No se pudo iniciar sesión. Revisa tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={
        <>
          Nuestro Libro{' '}
          <br />
          <span className="title-gold">de Citas</span>
        </>
      }
      intro="Cada cita tiene dos versiones: la tuya y la suya. Guárdenlas juntas, con sus fotos, sus corazones y lo que sintieron esa noche."
      aside={
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {FEATURES.map(({ Icon, text }) => (
            <li key={text} className="chip">
              <Icon aria-hidden="true" className="h-3.5 w-3.5 text-ink-dark" strokeWidth={1.75} />
              {text}
            </li>
          ))}
        </ul>
      }
      formTitle="Hola de nuevo"
      formIntro={<p className="mb-7 mt-1.5 text-center text-sm text-ink">Entra para seguir escribiendo su historia.</p>}
    >
      <form onSubmit={handleSubmit} aria-labelledby="auth-form-title">
        <StatusMessage tone="error" className="alert alert-danger mb-5 text-center">
          {error}
        </StatusMessage>

        <Field label="Email" className="mb-4">
          {(field) => (
            <input
              {...field}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="field"
            />
          )}
        </Field>

        <Field label="Contraseña" className="mb-7">
          {(field) => (
            <PasswordInput
              {...field}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-6 text-center text-sm text-ink">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-royal-light underline underline-offset-4 transition-colors hover:text-ink-dark"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
