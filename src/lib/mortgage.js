export const MORTGAGE_DEFAULTS = { price: 250000, downPercent: 20, years: 30 };

export function simulate({ price, downPercent, years, tin }) {
  const total = Number(price) || 0;
  const down = (total * Math.min(Math.max(Number(downPercent) || 0, 0), 100)) / 100;
  const financed = Math.max(total - down, 0);
  const months = Math.max(Math.round((Number(years) || 1) * 12), 1);
  const monthlyRate = Math.max(Number(tin) || 0, 0) / 100 / 12;

  const quota =
    financed === 0
      ? 0
      : monthlyRate > 0
        ? (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
        : financed / months;

  const totalPaid = quota * months;

  return {
    down: Math.round(down),
    financed: Math.round(financed),
    quota: Math.round(quota),
    totalPaid: Math.round(totalPaid),
    interest: Math.round(totalPaid - financed),
  };
}

export const RATE_TYPE_LABELS = { fija: 'Fija', variable: 'Variable', mixta: 'Mixta' };