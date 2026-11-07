// Traduce los fallos de las funciones de IA a un mensaje útil para el equipo comercial.
export function aiErrorMessage(error) {
  const raw = [
    error?.message,
    error?.response?.data?.error,
    error?.response?.data?.details,
    error?.response?.data?.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/credit|cr[eé]dito|cuota|quota|billing|facturaci|payment required|insufficient/.test(raw)) {
    return 'La IA está sin créditos de integración. Se restablecen al renovar el plan; mientras tanto el panel de avisos sigue funcionando con los datos del CRM.';
  }
  if (/401|unauthor|sesi[oó]n|token/.test(raw)) {
    return 'Tu sesión ha caducado. Vuelve a entrar en la app y repite la acción.';
  }
  if (/timeout|timed out|504|429|rate limit/.test(raw)) {
    return 'El análisis ha tardado demasiado o hay muchas peticiones seguidas. Prueba de nuevo en un minuto.';
  }
  return 'No se ha podido completar el análisis con IA ahora mismo. Inténtalo de nuevo en unos minutos.';
}