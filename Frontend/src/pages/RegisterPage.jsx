import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/ui/Field';
import PasswordInput from '../components/ui/PasswordInput';
import StatusMessage from '../components/ui/StatusMessage';

const MIN_PASSWORD = 6; // igual que el backend (auth.schemas.js)

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
      setError(err.response?.data?.error || 'No se pudo crear la cuenta. Revisa los datos y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={
        <>
          Una historia,{' '}
          <br />
          <span className="title-gold">dos voces</span>
        </>
      }
      intro="Creen su libro compartido en un minuto. Después podrás invitar a tu pareja con un simple enlace."
      formTitle="Crear cuenta"
      formIntro={
        inviteCode ? (
          <p className="mb-7 mt-3 flex items-center justify-center gap-2 rounded-xl border border-royal-light/25 bg-royal-light/10 px-4 py-2.5 text-center text-sm text-royal-light">
            <Mail aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Te estás uniendo con una invitación de tu pareja.
          </p>
        ) : (
          <p className="mb-7 mt-1.5 text-center text-sm text-ink">
            Estás creando un libro de citas nuevo. Después podrás invitar a tu pareja.
          </p>
        )
      }
    >
      <form onSubmit={handleSubmit} aria-labelledby="auth-form-title">
        <StatusMessage tone="error" className="alert alert-danger mb-5 text-center">
          {error}
        </StatusMessage>

        <Field label="Nombre" className="mb-4">
          {(field) => (
            <input
              {...field}
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              className="field"
            />
          )}
        </Field>

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

        {/* La longitud mínima va como ayuda visible (antes solo en el placeholder, que desaparece al escribir). */}
        <Field label="Contraseña" hint={`Mínimo ${MIN_PASSWORD} caracteres.`} className="mb-7">
          {(field) => (
            <PasswordInput
              {...field}
              name="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="mt-6 text-center text-sm text-ink">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-royal-light underline underline-offset-4 transition-colors hover:text-ink-dark"
          >
            Entra
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
