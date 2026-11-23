const STORAGE_KEY = 'salud_mama_records_v1';
const CONFIG_KEY = 'salud_mama_config_v1';

export function getConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  return saved
    ? JSON.parse(saved)
    : {
        scriptUrl: '',
        whatsapp: '',
        targetSys: 139,
        targetDia: 89,
        highSys: 160,
        highDia: 100
      };
}

export function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function getLocalRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function syncFromSheets(scriptUrl) {
  if (!scriptUrl) return getLocalRecords();
  try {
    const res = await fetch(scriptUrl);
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.records)) {
      const normalized = data.records.map((r) => ({
        id: r.ID,
        fecha: r.Fecha,
        hora: r.Hora,
        jornada: r.Jornada,
        animo: r.Animo,
        sistolica: Number(r.Sistolica),
        diastolica: Number(r.Diastolica),
        pulso: r.Pulso ? Number(r.Pulso) : null,
        glucosa: r.Glucosa ? Number(r.Glucosa) : null,
        condicionGlucosa: r.Condicion_Glucosa || '',
        estadoAlerta: r.Estado_Alerta || 'Controlada'
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (e) {
    console.warn('Sin conexión a Sheets, usando caché local:', e);
  }
  return getLocalRecords();
}

export async function saveRecord(record, scriptUrl) {
  const current = getLocalRecords();
  const updated = [...current, record];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.error('Error enviando a Google Sheets:', err);
    }
  }
  return updated;
}

export async function deleteRecord(id, scriptUrl) {
  const current = getLocalRecords();
  const updated = current.filter((r) => String(r.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (err) {
      console.error('Error borrando en Google Sheets:', err);
    }
  }
  return updated;
}