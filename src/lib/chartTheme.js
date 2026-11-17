// Lenguaje visual de los gráficos: azul profundo, oro y grises cálidos.
export const SERIES_ACCENTS = [
  '#1b3a57',
  '#3f6b8f',
  '#9a7c2e',
  '#6f93b0',
  '#c0a86a',
  '#5f7d6f',
  '#8c93a0',
];

export const SERIES_COLORS = {
  particular: '#1b3a57',
  empresa: '#9a7c2e',
  sin_ficha: '#9aa3a0',
};

export const AXIS_TICK = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground))',
};

export const GRID_STROKE = 'hsl(var(--border) / 0.65)';

export const TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 14,
  padding: '10px 12px',
  fontSize: 12,
  boxShadow: '0 1px 2px rgba(26, 34, 44, .06), 0 22px 44px -28px rgba(26, 34, 44, .55)',
};

export const TOOLTIP_LABEL_STYLE = {
  color: 'hsl(var(--foreground))',
  fontWeight: 700,
  marginBottom: 4,
};

export const TOOLTIP_ITEM_STYLE = {
  padding: '1px 0',
};

export const CURSOR_FILL = {
  fill: 'hsl(var(--primary) / 0.05)',
};