const DAY_MS = 86400000;

const STAGE_WEIGHT = {
  presupuesto_enviado: 10,
  presupuesto: 8,
  visita: 6,
  reunion_agendada: 4,
  nuevo_lead: 2,
};

function toDay(value) {
  if (!value) return null;
  const time = new Date(`${String(value).slice(0, 10)}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function daysUntil(dueDate, today = localToday()) {
  const due = toDay(dueDate);
  if (due === null) return null;
  return Math.round((due - toDay(today)) / DAY_MS);
}

export function taskPriority(task, opportunity) {
  if (task.status !== 'pendiente') return { score: 0, level: 'hecha' };

  const days = daysUntil(task.due_date);
  let score = 0;
  if (days === null) score += 8;
  else if (days < 0) score += 60;
  else if (days === 0) score += 45;
  else if (days <= 2) score += 30;
  else if (days <= 5) score += 18;
  else if (days <= 10) score += 8;

  if (opportunity && opportunity.status === 'open') {
    score += STAGE_WEIGHT[opportunity.stage] || 0;
    const probability = Number(opportunity.probability) || 0;
    if (probability >= 60) score += 12;
    else if (probability >= 30) score += 6;
  }

  if (task.auto_generated) score += 3;

  const level = score >= 55 ? 'urgente' : score >= 30 ? 'alta' : score >= 15 ? 'media' : 'baja';
  return { score, level };
}

export function sortByPriority(list) {
  return [...list].sort((a, b) => {
    if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score;
    return (a.task.due_date || '9999-12-31').localeCompare(b.task.due_date || '9999-12-31');
  });
}