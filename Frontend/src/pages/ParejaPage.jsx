import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout';

export default function ParejaPage() {
  const [pareja, setPareja] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    client
      .get('/pareja/me')
      .then(({ data }) => setPareja(data))
      .catch(() => setError('No se pudo cargar la información de tu pareja'));
  }, []);

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
    </Layout>
  );
}
