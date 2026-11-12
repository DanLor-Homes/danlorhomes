import React from 'react';

export default function ContractDocument({ doc }) {
  if (!doc) return null;

  return (
    <article className="doc-print mx-auto w-full max-w-[820px] bg-white px-8 py-10 text-slate-900 shadow-sm print:shadow-none">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="font-heading text-lg font-extrabold tracking-tight">DAN&amp;LOR HOMES</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Servicios inmobiliarios</p>
        </div>
        <p className="text-right text-[11px] text-slate-500">
          Documento generado el {new Date().toLocaleDateString('es-ES')}
        </p>
      </header>

      <h1 className="mt-6 font-heading text-xl font-bold leading-tight">{doc.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{doc.place}</p>

      <div className="mt-6 space-y-5">
        {doc.sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="text-sm font-bold">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-1.5 space-y-2">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {doc.annex && (
        <section className="mt-8">
          <h2 className="text-sm font-bold">{doc.annex.title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">{doc.annex.intro}</p>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {doc.annex.items.map((item, index) => (
              <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
                <span className="w-4 flex-none text-right tabular-nums text-slate-400">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {doc.signatures.map((label) => (
          <div key={label}>
            <div className="h-12 border-b border-slate-400" />
            <p className="mt-1.5 text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-500">
        Modelo orientativo generado por DAN&amp;LOR HOMES. Debe ser revisado por un asesor jurídico antes de su firma y
        completado con los datos identificativos de las partes.
      </p>
    </article>
  );
}