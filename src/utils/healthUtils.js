export function getLocalDateTimeInfo(date = new Date()) {
  const hour = date.getHours();
  let jornada = 'Noche';
  if (hour >= 5 && hour < 12) jornada = 'Mañana';
  else if (hour >= 12 && hour < 18) jornada = 'Tarde';

  const fecha = date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const hora = date.toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const fechaLarga = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return { fecha, hora, jornada, fechaLarga, timestamp: date.getTime() };
}

export function evaluateBP(
  sys,
  dia,
  thresholds = { targetSys: 139, targetDia: 89, highSys: 160, highDia: 100 }
) {
  const s = Number(sys);
  const d = Number(dia);

  if (s >= 180 || d >= 120) {
    return { level: 'crisis', label: 'Crisis Hipertensiva', color: 'red', alert: true };
  }
  if (s >= thresholds.highSys || d >= thresholds.highDia) {
    return { level: 'high', label: 'Tensión Alta', color: 'orange', alert: true };
  }
  if (s < 100 || d < 60) {
    return { level: 'low', label: 'Tensión Baja', color: 'blue', alert: true };
  }
  if (s > thresholds.targetSys || d > thresholds.targetDia) {
    return { level: 'elevated', label: 'Un poco elevada', color: 'amber', alert: false };
  }
  return { level: 'normal', label: 'Controlada', color: 'emerald', alert: false };
}

export function calculateMetrics(records) {
  if (!records.length) return null;

  const avg = (arr, key) =>
    arr.length ? Math.round(arr.reduce((acc, r) => acc + Number(r[key]), 0) / arr.length) : null;

  const general = {
    sys: avg(records, 'sistolica'),
    dia: avg(records, 'diastolica'),
    count: records.length
  };

  const byJornada = ['Mañana', 'Tarde', 'Noche'].reduce((acc, j) => {
    const sub = records.filter((r) => r.jornada === j);
    acc[j] = sub.length
      ? { sys: avg(sub, 'sistolica'), dia: avg(sub, 'diastolica'), count: sub.length }
      : null;
    return acc;
  }, {});

  let trend = 'Estable';
  if (records.length >= 6) {
    const recent = records.slice(-5);
    const prev = records.slice(-10, -5);
    const diff = avg(recent, 'sistolica') - avg(prev, 'sistolica');
    if (diff <= -5) trend = 'Bajando (mejorando)';
    else if (diff >= 5) trend = 'Subiendo';
  }

  return { general, byJornada, trend };
}