import DragonIcon from './DragonIcon';
import SkyMotionToggle from './SkyMotionToggle';

/**
 * Estructura común de Login y Registro: presentación a un lado y formulario al
 * otro, dentro de un <main> (estas páginas no usan Layout).
 */
export default function AuthLayout({ title, intro, aside, formTitle, formIntro, children }) {
  return (
    <main className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <section className="fade-in-up min-w-0 text-center lg:text-left">
        <h1 className="font-display text-4xl font-bold leading-[1.05] text-ink-strong sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink lg:mx-0">{intro}</p>
        {aside}
      </section>

      <section aria-labelledby="auth-form-title" className="min-w-0">
        <div
          className="surface-glass surface-accent fade-in-up mx-auto w-full max-w-md p-7 sm:p-9"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="mb-5 flex justify-center">
            <DragonIcon className="h-16 w-16 drop-shadow-glow-lg" />
          </div>
          <h2 id="auth-form-title" className="text-center font-display text-2xl font-semibold text-ink-strong">
            {formTitle}
          </h2>
          {formIntro}
          {children}
        </div>
        {/* Login y Registro no tienen barra lateral: el control del fondo va aquí. */}
        <SkyMotionToggle className="mx-auto mt-4 w-fit" />
      </section>
    </main>
  );
}
