import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const BANKS = [
  {
    bank: 'BBVA',
    product: 'Hipoteca fija',
    url: 'https://www.bbva.es/personas/productos/hipotecas/hipoteca-fija.html',
    rate_type: 'fija',
  },
  {
    bank: 'Banco Santander',
    product: 'Hipoteca fija bonificada',
    url: 'https://www.bancosantander.es/particulares/hipotecas/hipoteca-fija/',
    rate_type: 'fija',
  },
  {
    bank: 'CaixaBank',
    product: 'Hipoteca CasaFácil',
    url: 'https://www.caixabank.es/particular/hipotecas/casafacil.html',
    rate_type: 'fija',
  },
  {
    bank: 'Openbank',
    product: 'Hipoteca Open Fija',
    url: 'https://www.openbank.es/hipoteca-fija',
    rate_type: 'fija',
  },
  {
    bank: 'ING',
    product: 'Hipoteca fija',
    url: 'https://www.ing.es/hipotecas/hipoteca-fija',
    rate_type: 'fija',
  },
  {
    bank: 'Bankinter',
    product: 'Hipoteca fija',
    url: 'https://www.bankinter.com/banca/hipotecas-prestamos/hipotecas/hipoteca-fija',
    rate_type: 'fija',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9',
  Accept: 'text/html,application/xhtml+xml,text/plain',
};

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
}

function findRate(text, label, min, max) {
  const patterns = [
    new RegExp(`${label}[^0-9%]{0,70}(\\d{1,2}[.,]\\d{1,3})\\s*%`, 'gi'),
    new RegExp(`(\\d{1,2}[.,]\\d{1,3})\\s*%\\s*(?:de\\s*)?${label}`, 'gi'),
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = Number(String(match[1]).replace(',', '.'));
      if (Number.isFinite(value) && value >= min && value <= max) return value;
    }
  }
  return null;
}

function detectRateType(text, fallback) {
  const index = text.search(/TIN/i);
  if (index < 0) return fallback;
  const context = text.slice(Math.max(index - 200, 0), index).toLowerCase();
  if (context.includes('variable')) return 'variable';
  if (context.includes('mixta') || context.includes('mixto')) return 'mixta';
  if (context.includes('fija') || context.includes('fijo')) return 'fija';
  return fallback;
}

async function download(url, attempt = 1) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
  if (response.status === 429 && attempt < 2) {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return download(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function readBank(config) {
  let text = '';
  let lastError = 'Lectura fallida';

  const sources = [config.url, `https://r.jina.ai/${config.url}`];

  for (const source of sources) {
    try {
      const parsed = htmlToText(await download(source));
      if (findRate(parsed, 'TIN', 0.3, 9)) {
        text = parsed;
        break;
      }
      lastError = 'La página no publica el tipo en texto legible';
    } catch (error) {
      lastError = error.message;
    }
  }

  if (!text) throw new Error(lastError);

  const tin = findRate(text, 'TIN', 0.3, 9);
  if (!tin) throw new Error('No se encontró un TIN plausible');
  const taeCandidate = findRate(text, 'TAE', 0.3, 11);
  const tae = taeCandidate && taeCandidate >= tin ? taeCandidate : null;

  return {
    bank: config.bank,
    product: config.product,
    rate_type: detectRateType(text, config.rate_type),
    tin,
    tae: tae || null,
    link: config.url,
    source: 'web',
    checked_at: new Date().toISOString(),
    notes: 'Tipo leído automáticamente de la web del banco. Revisa las condiciones antes de ofrecerlo.',
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const updated = [];
    const failed = [];

    for (let index = 0; index < BANKS.length; index += 6) {
      const chunk = BANKS.slice(index, index + 6);
      const settled = await Promise.allSettled(
        chunk.map(async (config, slot) => {
          await new Promise((resolve) => setTimeout(resolve, slot * 600));
          return readBank(config);
        })
      );

      for (let position = 0; position < settled.length; position += 1) {
        const result = settled[position];
        const config = chunk[position];

        if (result.status !== 'fulfilled') {
          failed.push({ bank: config.bank, reason: result.reason?.message || 'Lectura fallida' });
          continue;
        }

        const data = result.value;
        const existing = await base44.entities.BankRate.filter(
          { bank: data.bank, product: data.product },
          { limit: 1 }
        );
        const current = (existing.items || [])[0];

        if (current) {
          await base44.entities.BankRate.update(current.id, data);
        } else {
          await base44.entities.BankRate.create({ ...data, active: true });
        }
        updated.push({ bank: data.bank, tin: data.tin, tae: data.tae });
      }
    }

    return Response.json({ updated, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}