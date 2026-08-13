export default function PageHeader({ eyebrow, title, description, subtitle, actions }) {
  const text = description || subtitle;

  return (
    <header className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="section-title">{title}</h1>
        {text && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </header>
  );
}
