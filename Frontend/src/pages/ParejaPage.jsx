import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function ParejaPage() {
  const { refreshToken } = useAuth();
  const [pareja, setPareja] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    client
      .get('/pareja/me')
      .then(({ data }) => setPareja(data))
      .catch(() => setError('No se pudo cargar la información de tu pareja'));
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      const { data } = await client.post('/pareja/unirme', { inviteCode: joinCode.trim() });
      refreshToken(data.token);
      window.location.href = '/pareja';
    } catch (err) {
      setJoinError(err.response?.data?.error || 'No se pudo unir a esa pareja');
    } finally {
      setJoining(false);
    }
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-400">{error}</p>
      </Layout>
    );
  }

  if (!pareja) {
    return (
      <Layout>
        <p className="text-ink">Cargando...</p>
      </Layout>
    );
  }

  const inviteLink = `${window.location.origin}/register?invite=${pareja.inviteCode}`;
  const complete = pareja.members.length >= 2;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout>
      <h2 className="font-display text-xl sm:text-2xl mb-6 text-ink-dark">Invitar a mi pareja 💌</h2>

      <div className="rounded-3xl bg-card border border-line p-6 max-w-md">
        <p className="uppercase text-xs tracking-widest text-ink mb-3">Quiénes están en este libro</p>
        <ul className="flex flex-col gap-2 mb-6">
          {pareja.members.map((m) => (
            <li
              key={m.id}
              className="rounded-full bg-ink-dark/10 text-ink-dark px-4 py-1.5 text-sm inline-block w-fit"
            >
              {m.name}
            </li>
          ))}
        </ul>

        {complete ? (
          <p className="text-sm text-ink">
            Ya son dos en este libro de citas. Este link de invitación ya no es necesario, pero
            sigue siendo válido por si necesitan compartirlo de nuevo.
          </p>
        ) : (
          <p className="text-sm text-ink mb-4">
            Comparte este link con tu pareja para que se una a este mismo libro de citas.
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 rounded-xl border border-line bg-paper/50 px-4 py-2 text-sm text-ink outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className="rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold px-4 py-2 text-sm shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-card border border-line p-6 max-w-md mt-6">
        <p className="uppercase text-xs tracking-widest text-ink mb-3">¿Ya tienes cuenta?</p>
        <p className="text-sm text-ink mb-4">
          Si te registraste antes de tener el código de tu pareja, pega su código de invitación
          acá para unirte a su mismo libro de citas.
        </p>

        <form onSubmit={handleJoin} className="flex items-center gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Código de invitación"
            className="flex-1 rounded-xl border border-line bg-paper/50 px-4 py-2 text-sm text-ink outline-none"
          />
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="rounded-full border border-royal-light/40 text-royal-light px-4 py-2 text-sm hover:bg-royal-light/10 transition-colors disabled:opacity-50"
          >
            {joining ? 'Uniendo...' : 'Unirme'}
          </button>
        </form>

        {joinError && <p className="text-red-400 text-sm mt-3">{joinError}</p>}
      </div>
    </Layout>
  );
}
