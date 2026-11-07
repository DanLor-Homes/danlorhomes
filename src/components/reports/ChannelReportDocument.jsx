import React from 'react';
import { STAGES, formatCurrency } from '@/lib/crm';

const NAVY = '#1f3f63';
const INK = '#12263a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

const STATUS = {
  won: { label: 'Ganada', bg: '#dcfce7', color: '#166534' },
  open: { label: 'Abierta', bg: '#e0ecf8', color: '#1e4f7a' },
  lost: { label: 'Perdida', bg: '#fee2e2', color: '#991b1b' },
};

const eyebrow = {
  fontSize: 9,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: MUTED,
};

const sectionTitle = { fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-.01em' };
const th = {
  fontSize: 8.5,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: MUTED,
  fontWeight: 700,
  textAlign: 'left',
  padding: '0 8px 7px',
  borderBottom: `1px solid ${LINE}`,
};
const td = {
  fontSize: 10.5,
  color: '#334155',
  padding: '7px 8px',
  borderBottom: `1px solid ${LINE}`,
  verticalAlign: 'middle',
};

function Pill({ status }) {
  const s = STATUS[status] || { label: status || '—', bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      style={{
        display: 'inline-block',
        background: s.bg,
        color: s.color,
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '.03em',
        borderRadius: 999,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function Kpi({ label, value, hint, accent }) {
  return (
    <td width="25%" style={{ paddingRight: 10, verticalAlign: 'top' }}>
      <div style={{ border: `1px solid ${LINE}`, borderTop: `3px solid ${accent}`, borderRadius: 10, padding: '12px 14px' }}>
        <p style={{ ...eyebrow, fontSize: 8.5, color: MUTED }}>{label}</p>
        <p style={{ fontSize: 19, fontWeight: 700, color: INK, marginTop: 5, letterSpacing: '-.02em' }}>{value}</p>
        {hint && <p style={{ fontSize: 9.5, color: MUTED, marginTop: 3 }}>{hint}</p>}
      </div>
    </td>
  );
}

export default function ChannelReportDocument({ channel, stats, opportunities }) {
  const stageRows = STAGES.map((stage) => {
    const list = opportunities.filter((op) => op.stage === stage.id && !op.archived);
    return {
      id: stage.id,
      label: stage.label,
      count: list.length,
      value: list.reduce((sum, op) => sum + (Number(op.amount) || 0), 0),
    };
  }).filter((row) => row.count > 0);

  const maxStage = Math.max(...stageRows.map((row) => row.value), 1);

  const top = [...opportunities]
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 8);

  const avg = stats.wonCount ? stats.ganado / stats.wonCount : 0;
  const shareOfPipeline = stats.pipeline ? Math.round((stats.ganado / stats.pipeline) * 100) : 0;
  const bestStage = [...stageRows].sort((a, b) => b.value - a.value)[0];
  const openCount = opportunities.filter((op) => op.status === 'open').length;
  const today = new Date().toLocaleDateString('es-ES');

  const summary = `Este canal ha aportado ${stats.count} ${
    stats.count === 1 ? 'oportunidad' : 'oportunidades'
  } por un valor total de ${formatCurrency(stats.pipeline)}, de las que ${stats.wonCount} ${
    stats.wonCount === 1 ? 'ha sido ganada' : 'han sido ganadas'
  } (${stats.rate}% de cierre) por ${formatCurrency(stats.ganado)}.`;

  return (
    <div
      style={{
        width: 794,
        background: '#ffffff',
        color: INK,
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Cabecera de marca */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: NAVY }}>
        <tbody>
          <tr>
            <td style={{ padding: '22px 32px' }}>
              <table cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ paddingRight: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,.35)',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: 'center',
                          lineHeight: '32px',
                          letterSpacing: '.02em',
                        }}
                      >
                        DL
                      </div>
                    </td>
                    <td>
                      <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, letterSpacing: '.16em' }}>
                        DAN&amp;LOR HOMES
                      </p>
                      <p style={{ color: '#a9c3dd', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 2 }}>
                        CRM inmobiliario
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td align="right" style={{ padding: '22px 32px' }}>
              <p style={{ color: '#d6e3ef', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Informe de canal
              </p>
              <p style={{ color: '#ffffff', fontSize: 11, fontWeight: 600, marginTop: 3 }}>{today}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Título y resumen */}
      <div style={{ padding: '28px 32px 0' }}>
        <p style={eyebrow}>Rendimiento de captación</p>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 30,
            fontWeight: 500,
            color: INK,
            marginTop: 6,
            letterSpacing: '-.01em',
          }}
        >
          {channel.label}
        </h1>
        <p style={{ fontSize: 11.5, lineHeight: 1.65, color: '#475569', marginTop: 8, maxWidth: 640 }}>{summary}</p>
      </div>

      {/* Indicadores */}
      <div style={{ padding: '20px 32px 0' }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <Kpi label="Oportunidades" value={stats.count} hint={`${openCount} abiertas`} accent={NAVY} />
              <Kpi label="Pipeline" value={formatCurrency(stats.pipeline)} hint="Valor total generado" accent="#7b9fc4" />
              <Kpi label="Importe ganado" value={formatCurrency(stats.ganado)} hint={`${stats.wonCount} ganadas`} accent="#2f7d5a" />
              <Kpi label="Tasa de cierre" value={`${stats.rate}%`} hint="Ganadas sobre total" accent="#b8912b" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Embudo por etapa */}
      <div style={{ padding: '26px 32px 0' }}>
        <p style={sectionTitle}>Embudo por etapa</p>
        <p style={{ fontSize: 9.5, color: MUTED, marginTop: 3 }}>Valor de las oportunidades abiertas en cada fase del proceso</p>
        <div style={{ marginTop: 12 }}>
          {stageRows.length === 0 ? (
            <p style={{ fontSize: 10.5, color: MUTED }}>Sin oportunidades abiertas en este canal.</p>
          ) : (
            stageRows.map((row) => (
              <table key={row.id} width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 9 }}>
                <tbody>
                  <tr>
                    <td width="150" style={{ fontSize: 10.5, color: '#334155', paddingRight: 10 }}>{row.label}</td>
                    <td>
                      <div style={{ height: 8, background: '#eef2f7', borderRadius: 999 }}>
                        <div
                          style={{
                            height: 8,
                            width: `${Math.max(3, Math.round((row.value / maxStage) * 100))}%`,
                            background: NAVY,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </td>
                    <td width="52" align="right" style={{ fontSize: 9.5, color: MUTED, paddingLeft: 10 }}>
                      {row.count} op.
                    </td>
                    <td width="104" align="right" style={{ fontSize: 10.5, fontWeight: 700, color: INK, paddingLeft: 8 }}>
                      {formatCurrency(row.value)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))
          )}
        </div>
      </div>

      {/* Oportunidades + indicadores */}
      <div style={{ padding: '24px 32px 0' }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td width="63%" valign="top" style={{ paddingRight: 22 }}>
                <p style={sectionTitle}>Oportunidades principales</p>
                <p style={{ fontSize: 9.5, color: MUTED, marginTop: 3, marginBottom: 10 }}>
                  Ordenadas por importe estimado
                </p>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, paddingLeft: 0 }}>Oportunidad</th>
                      <th style={th}>Etapa</th>
                      <th style={th}>Estado</th>
                      <th style={{ ...th, textAlign: 'right', paddingRight: 0 }}>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.length === 0 ? (
                      <tr>
                        <td style={{ ...td, paddingLeft: 0, color: MUTED }} colSpan={4}>
                          Sin oportunidades registradas.
                        </td>
                      </tr>
                    ) : (
                      top.map((op) => (
                        <tr key={op.id}>
                          <td style={{ ...td, paddingLeft: 0, fontWeight: 600, color: INK }}>{op.name}</td>
                          <td style={{ ...td, color: MUTED }}>
                            {STAGES.find((stage) => stage.id === op.stage)?.label || op.stage}
                          </td>
                          <td style={td}>
                            <Pill status={op.status} />
                          </td>
                          <td style={{ ...td, textAlign: 'right', paddingRight: 0, fontWeight: 600, color: INK }}>
                            {formatCurrency(op.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </td>

              <td width="37%" valign="top">
                <div style={{ background: '#f7f9fc', border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 16px' }}>
                  <p style={sectionTitle}>Claves del canal</p>
                  <div style={{ marginTop: 12 }}>
                    {[
                      ['Ticket medio ganado', formatCurrency(avg)],
                      ['Ganado sobre pipeline', `${shareOfPipeline}%`],
                      ['Etapa con más valor', bestStage ? bestStage.label : '—'],
                      ['Oportunidades totales', String(stats.count)],
                      ['Cerradas ganadas', String(stats.wonCount)],
                    ].map(([label, value], index, arr) => (
                      <div
                        key={label}
                        style={{
                          padding: '7px 0',
                          borderBottom: index === arr.length - 1 ? 'none' : `1px solid ${LINE}`,
                        }}
                      >
                        <span style={{ fontSize: 9.5, color: MUTED }}>{label}</span>
                        <p style={{ fontSize: 12, fontWeight: 700, color: INK, marginTop: 2 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie */}
      <div style={{ marginTop: 26, padding: '14px 32px', borderTop: `2px solid ${NAVY}`, background: '#f7f9fc' }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ fontSize: 8.5, color: MUTED }}>
                Documento generado automáticamente por DAN&amp;LOR HOMES a partir del histórico de oportunidades del canal.
              </td>
              <td align="right" style={{ fontSize: 8.5, color: MUTED, whiteSpace: 'nowrap' }}>{today}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}