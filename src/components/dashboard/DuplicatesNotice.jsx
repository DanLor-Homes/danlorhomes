import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy } from 'lucide-react';

export default function DuplicatesNotice({ groups = [] }) {
  const affected = groups.reduce((total, group) => total + group.records.length, 0);

  return (
    <section className="ed-sec ed-d4">
      <div className="ed-sh">
        <div>
          <h3 className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-[var(--ed-accent-ink)]" aria-hidden="true" />
            Fichas duplicadas
          </h3>
          <p className="ed-sub">Clientes que comparten email, teléfono o nombre.</p>
        </div>
        <Link to="/duplicados" className="ed-lk">
          Abrir duplicados
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="ed-ok flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sin fichas repetidas: la base de clientes está limpia.</span>
        </p>
      ) : (
        <>
          <p className="ed-note">
            {groups.length} {groups.length === 1 ? 'grupo detectado' : 'grupos detectados'} · {affected} fichas
            afectadas. Elige cuál conservar y fusiónalas.
          </p>
          {groups.slice(0, 3).map((group) => (
            <div key={group.id} className="ed-tk">
              <p className="ed-n">{group.records.map((record) => record.name || 'Sin nombre').join(' · ')}</p>
              <p className="ed-s">{group.reasons.join(' · ')}</p>
            </div>
          ))}
          <div className="ed-rp">
            <Link to="/duplicados" className="ed-btn2 no-underline">
              Revisar y fusionar
            </Link>
          </div>
        </>
      )}
    </section>
  );
}