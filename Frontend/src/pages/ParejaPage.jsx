import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Field from '../components/ui/Field';
import StatusMessage from '../components/ui/StatusMessage';

const COPIED_MS = 2000;

export default function ParejaPage() {
  const { refreshToken } = useAuth();
  const [pareja, setPareja] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const linkRef = useRef(null);
  const copiedTimer = useRef(null);

  useEffect(() => {
    setError('');
    client
      .get('/pareja/me')
      .then(({ data }) => setPareja(data))
      .catch(() => setError('No se pudo cargar la información de tu pareja'));
  }, [reloadKey]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      const { data } = await client.post('/pareja/unirme', { inviteCode: joinCode.trim() });
      refreshToken(data.token);
      window.location.href = '/pareja';
    } catch (err) {
      setJoinError(err.response?.data?.error || 'No se pudo unir a esa pareja. Revisa el código y vuelve a intentarlo.');
    } finally {
      setJoining(false);
    }
  }

  async function handleCopy() {
    clearTimeout(copiedTimer.current);
    try {
      // navigator.clipboard solo existe en contextos seguros (HTTPS o localhost):
      // abierta por la IP de la red local, no está disponible.
      await navigator.clipboard.writeText(linkRef.current.value);
      setCopied(true);
      setCopyStatus('Link de invitación copiado al portapapeles');
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setCopied(false);
      setCopyStatus('No se pudo copiar automáticamente. El link está seleccionado: cópialo desde el menú o con Ctrl+C.');
    }
  }

  if (error) {
    return (
      <Layout>
        <p role="alert" className="alert alert-danger max-w-xl">
          {error}. Revisa tu conexión y{' '}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-semibold underline underline-offset-4"
          >
            vuelve a intentarlo
          </button>
          .
        </p>
      </Layout>
    );
  }

  if (!pareja) {
    return (
      <Layout>
        <div className="max-w-md space-y-4" aria-busy="true">
          <p role="status" className="sr-only">Cargando…</p>
          <div className="skeleton h-56 rounded-3xl" />
          <div className="skeleton h-40 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  const inviteLink = `${window.location.origin}/register?invite=${pareja.inviteCode}`;
  const complete = pareja.members.length >= 2;

  return (
    <Layout>
      <PageHeader title="Invitar a mi pareja" subtitle="Un solo libro, dos voces contándolo." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Miembros + invitación ---------- */}
        <section aria-labelledby="pareja-miembros" className="surface surface-accent p-6">
          <h2 id="pareja-miembros" className="font-display text-lg font-semibold text-ink-strong">
            Quiénes están en este libro
          </h2>

          <ul className="mb-6 mt-3 flex flex-wrap gap-2">
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

          <Field label="Link de invitación">
            {(field) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  {...field}
                  ref={linkRef}
                  readOnly
                  value={inviteLink}
                  className="field min-w-0 flex-1"
                  onFocus={(e) => e.target.select()}
                />
                <button type="button" onClick={handleCopy} className="btn btn-primary">
                  {copied ? (
                    <>
                      <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            )}
          </Field>
          {/* El éxito ya se ve en el botón: se anuncia sin repetirlo; el fallo sí se muestra. */}
          <StatusMessage className={copied ? 'sr-only' : 'mt-3 text-xs text-ink'}>{copyStatus}</StatusMessage>
        </section>

        {/* ---------- Unirse con código ---------- */}
        <section aria-labelledby="pareja-unirse" className="surface p-6">
          <h2 id="pareja-unirse" className="font-display text-lg font-semibold text-ink-strong">
            ¿Ya tienes cuenta?
          </h2>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-ink">
            Si te registraste antes de tener el código de tu pareja, pega su código de invitación
            para unirte a su mismo libro de citas.
          </p>

          <form onSubmit={handleJoin}>
            <Field label="Código de invitación">
              {(field) => (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    {...field}
                    name="inviteCode"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Pega aquí el código…"
                    className="field min-w-0 flex-1"
                  />
                  <button type="submit" disabled={joining || !joinCode.trim()} className="btn btn-secondary">
                    {joining ? 'Uniendo…' : 'Unirme'}
                  </button>
                </div>
              )}
            </Field>
          </form>

          <StatusMessage tone="error" className="alert alert-danger mt-4">
            {joinError}
          </StatusMessage>
        </section>
      </div>
    </Layout>
  );
}
