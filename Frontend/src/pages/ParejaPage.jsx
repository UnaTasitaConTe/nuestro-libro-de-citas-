import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

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
        <p className="alert alert-danger">{error}</p>
      </Layout>
    );
  }

  if (!pareja) {
    return (
      <Layout>
        <div className="max-w-md space-y-4">
          <div className="skeleton h-56 rounded-3xl" />
          <div className="skeleton h-40 rounded-3xl" />
        </div>
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
      <PageHeader
        eyebrow="Nuestro libro"
        title="Invitar a mi pareja 💌"
        subtitle="Un solo libro, dos voces contándolo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Miembros + invitación ---------- */}
        <section className="surface surface-accent p-6">
          <p className="eyebrow mb-3">Quiénes están en este libro</p>

          <ul className="mb-6 flex flex-wrap gap-2">
            {pareja.members.map((m) => (
              <li key={m.id} className="chip chip-gold">
                {m.name}
              </li>
            ))}
          </ul>

          <p className="mb-4 text-sm leading-relaxed text-ink">
            {complete
              ? 'Ya son dos en este libro de citas. Este link de invitación ya no es necesario, pero sigue siendo válido por si necesitan compartirlo de nuevo.'
              : 'Comparte este link con tu pareja para que se una a este mismo libro de citas.'}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={inviteLink}
              aria-label="Link de invitación"
              className="field flex-1 text-xs sm:text-sm"
              onFocus={(e) => e.target.select()}
            />
            <button onClick={handleCopy} className="btn btn-primary">
              {copied ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" strokeWidth={1.75} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </section>

        {/* ---------- Unirse con código ---------- */}
        <section className="surface p-6">
          <p className="eyebrow mb-3">¿Ya tienes cuenta?</p>
          <p className="mb-4 text-sm leading-relaxed text-ink">
            Si te registraste antes de tener el código de tu pareja, pega su código de invitación
            acá para unirte a su mismo libro de citas.
          </p>

          <form onSubmit={handleJoin} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Código de invitación"
              aria-label="Código de invitación"
              className="field flex-1"
            />
            <button type="submit" disabled={joining || !joinCode.trim()} className="btn btn-secondary">
              {joining ? 'Uniendo...' : 'Unirme'}
            </button>
          </form>

          {joinError && <p className="alert alert-danger mt-4">{joinError}</p>}
        </section>
      </div>
    </Layout>
  );
}
