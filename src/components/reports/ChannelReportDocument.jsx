import React from 'react';
import { STAGES, formatCurrency } from '@/lib/crm';

const STATUS_LABEL = { open: 'Abierta', won: 'Ganada', lost: 'Perdida' };

const cell = { padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#1f2937' };
const head = {
  padding: '7px 10px',
  borderBottom: '1px solid #cbd5e1',
  fontSize: 9,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#64748b',
  fontWeight: 700,
};

function Kpi({ label, value, hint }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#1f3f63', marginTop: 4 }}>{value}</p>
      {hint && <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hint}</p>}
    </div>
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

  const top = [...opportunities]
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 10);

  const avg = stats.wonCount ? stats.ganado / stats.wonCount : 0;
  const today = new Date().toLocaleDateString('es-ES');

  return (
    <div style={{ background: '#ffffff', color: '#1f2937', fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
      <div style={{ background: '#1f3f63', color: '#ffffff', padding: '22px 28px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#a9c3dd' }}>
          DAN&amp;LOR HOMES
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Informe de canal de captación</h1>
        <p style={{ fontSize: 11, marginTop: 4, color: '#d6e3ef' }}>Generado el {today}</p>
      </div>

      <div style={{ padding: '24px 28px 28px' }}>
        <div style={{ borderBottom: '2px solid #1f3f63', paddingBottom: 10 }}>
          <p style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
            Canal
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{channel.label}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          <Kpi label="Oportunidades" value={stats.count} hint={`${stats.wonCount} ganadas`} />
          <Kpi label="Pipeline" value={formatCurrency(stats.pipeline)} />
          <Kpi label="Importe ganado" value={formatCurrency(stats.ganado)} hint={`Ticket medio ${formatCurrency(avg)}`} />
          <Kpi label="Tasa de cierre" value={`${stats.rate}%`} />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 22 }}>Distribución por etapa</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>Etapa</th>
              <th style={{ ...head, textAlign: 'right' }}>Oportunidades</th>
              <th style={{ ...head, textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {stageRows.length === 0 ? (
              <tr>
                <td style={{ ...cell, color: '#64748b' }} colSpan={3}>
                  Sin oportunidades abiertas en este canal.
                </td>
              </tr>
            ) : (
              stageRows.map((row) => (
                <tr key={row.id}>
                  <td style={cell}>{row.label}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{row.count}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatCurrency(row.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 22 }}>Oportunidades principales</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>Oportunidad</th>
              <th style={{ ...head, textAlign: 'left' }}>Etapa</th>
              <th style={{ ...head, textAlign: 'left' }}>Estado</th>
              <th style={{ ...head, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {top.length === 0 ? (
              <tr>
                <td style={{ ...cell, color: '#64748b' }} colSpan={4}>
                  Sin oportunidades registradas.
                </td>
              </tr>
            ) : (
              top.map((op) => (
                <tr key={op.id}>
                  <td style={cell}>{op.name}</td>
                  <td style={cell}>{STAGES.find((stage) => stage.id === op.stage)?.label || op.stage}</td>
                  <td style={cell}>{STATUS_LABEL[op.status] || op.status}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatCurrency(op.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 20 }}>
          Informe generado automáticamente por DAN&amp;LOR HOMES a partir del histórico de oportunidades del canal.
        </p>
      </div>
    </div>
  );
}