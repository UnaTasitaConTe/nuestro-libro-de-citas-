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
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-card/70 backdrop-blur-xl border border-line p-8 shadow-[0_0_40px_rgba(255,204,51,0.12)]"
      >
        <div className="flex justify-center mb-4">
          <DragonIcon className="w-16 h-16 drop-shadow-[0_0_16px_rgba(255,204,51,0.4)]" />
        </div>
        <h1 className="font-display text-2xl text-center mb-2 text-ink-dark">Crear cuenta</h1>

        {inviteCode ? (
          <p className="text-sm text-center mb-6 rounded-xl bg-royal-light/10 border border-royal-light/20 text-royal-light px-4 py-2">
            Te estás uniendo con una invitación 💌
          </p>
        ) : (
          <p className="text-sm text-center mb-6 text-ink">
            Estás creando un libro de citas nuevo. Después podrás invitar a tu pareja.
          </p>
        )}

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <label className="block text-sm mb-1 text-ink">Nombre</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-paper/50 border border-line px-4 py-2 mb-4 outline-none focus:border-ink-dark focus:ring-2 focus:ring-ink-dark/30 transition"
        />

        <label className="block text-sm mb-1 text-ink">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-paper/50 border border-line px-4 py-2 mb-4 outline-none focus:border-ink-dark focus:ring-2 focus:ring-ink-dark/30 transition"
        />

        <label className="block text-sm mb-1 text-ink">Contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-paper/50 border border-line px-4 py-2 mb-6 outline-none focus:border-ink-dark focus:ring-2 focus:ring-ink-dark/30 transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold py-2.5 shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>

        <p className="text-sm text-center mt-5 text-ink">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-royal-light underline">
            Entra
          </Link>
        </p>
      </form>
    </div>
  );
}
