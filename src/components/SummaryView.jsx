import { useState, useMemo } from 'react';
import { TrendingUp, Share2, Smile, Droplet, Activity } from 'lucide-react';
import { calculateMetrics } from '../utils/healthUtils';

export default function SummaryView({ records, config }) {
  const [daysFilter, setDaysFilter] = useState(7);

  const filtered = useMemo(() => {
    if (daysFilter === 0) return records;
    const cutoff = Date.now() - daysFilter * 24 * 60 * 60 * 1000;
    return records.filter((r) => Number(r.id) >= cutoff);
  }, [records, daysFilter]);

  const metrics = useMemo(() => calculateMetrics(filtered), [filtered]);

  const moodStats = useMemo(() => {
    const counts = { Bien: 0, Cansada: 0, Dolor: 0, Mareada: 0 };
    filtered.forEach((r) => {
      if (counts[r.animo] !== undefined) counts[r.animo]++;
    });
    return counts;
  }, [filtered]);

  const glucoseStats = useMemo(() => {
    const fasting = filtered.filter(
      (r) => r.glucosa && r.condicionGlucosa === 'En ayunas'
    );
    const post = filtered.filter(
      (r) => r.glucosa && r.condicionGlucosa === 'Después de comer'
    );
    const avg = (arr) =>
      arr.length
        ? Math.round(
            arr.reduce((a, b) => a + Number(b.glucosa), 0) / arr.length
          )
        : null;
    return {
      fastingAvg: avg(fasting),
      postAvg: avg(post),
    };
  }, [filtered]);

  const handleShareWhatsApp = () => {
    if (!metrics) return;
    const text =
      `*Reporte de Salud Mamá (${
        daysFilter === 0 ? 'Histórico' : `Últimos ${daysFilter} días`
      })*\n\n` +
      `• Tensión promedio: *${metrics.general.sys}/${metrics.general.dia} mmHg* (${metrics.general.count} tomas)\n` +
      `• Tendencia: ${metrics.trend}\n` +
      `• Mañana: ${
        metrics.byJornada.Mañana
          ? `${metrics.byJornada.Mañana.sys}/${metrics.byJornada.Mañana.dia}`
          : 'Sin datos'
      }\n` +
      `• Tarde: ${
        metrics.byJornada.Tarde
          ? `${metrics.byJornada.Tarde.sys}/${metrics.byJornada.Tarde.dia}`
          : 'Sin datos'
      }\n` +
      `• Noche: ${
        metrics.byJornada.Noche
          ? `${metrics.byJornada.Noche.sys}/${metrics.byJornada.Noche.dia}`
          : 'Sin datos'
      }\n` +
      (glucoseStats.fastingAvg
        ? `• Glucosa en ayunas: *${glucoseStats.fastingAvg} mg/dL*\n`
        : '') +
      (glucoseStats.postAvg
        ? `• Glucosa después de comer: *${glucoseStats.postAvg} mg/dL*\n`
        : '');

    const phone = config.whatsapp ? config.whatsapp.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!records.length) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 mt-4">
        <p className="text-xl font-bold text-stone-700 mb-2">
          Aún no hay registros
        </p>
        <p className="text-stone-500">
          Cuando guardes la primera toma en la pestaña Registrar, aquí verás los
          promedios y tendencias.
        </p>
      </div>
    );
  }

  const chartData = filtered.slice(-12);
  const svgW = 320;
  const svgH = 130;
  const pad = 20;
  const mapY = (val) => {
    const min = 50;
    const max = 200;
    const clamped = Math.max(min, Math.min(max, val));
    return svgH - pad - ((clamped - min) / (max - min)) * (svgH - pad * 2);
  };
  const stepX =
    chartData.length > 1 ? (svgW - pad * 2) / (chartData.length - 1) : 0;

  const sysPoints = chartData
    .map((r, i) => `${pad + i * stepX},${mapY(r.sistolica)}`)
    .join(' ');
  const diaPoints = chartData
    .map((r, i) => `${pad + i * stepX},${mapY(r.diastolica)}`)
    .join(' ');

  return (
    <div className="space-y-5 pb-24">
      <div className="flex gap-2 bg-stone-200/70 p-1.5 rounded-2xl">
        {[
          { label: '7 días', val: 7 },
          { label: '30 días', val: 30 },
          { label: 'Todo', val: 0 },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setDaysFilter(f.val)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-base transition ${
              daysFilter === f.val
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-stone-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {metrics && (
        <>
          <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-stone-600 flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-teal-700" />
                Tensión Promedio
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">
                {metrics.general.count} tomas
              </span>
            </div>
            <p className="text-4xl font-extrabold text-stone-900">
              {metrics.general.sys}{' '}
              <span className="text-stone-400 font-normal">/</span>{' '}
              {metrics.general.dia}{' '}
              <span className="text-base font-medium text-stone-500">mmHg</span>
            </p>
            <p className="mt-2 text-base font-medium text-teal-800 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              Tendencia: {metrics.trend}
            </p>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-3">
              Promedio según la hora
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {['Mañana', 'Tarde', 'Noche'].map((j) => {
                const item = metrics.byJornada[j];
                return (
                  <div
                    key={j}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center"
                  >
                    <p className="text-sm font-semibold text-stone-500">{j}</p>
                    {item ? (
                      <>
                        <p className="text-xl font-extrabold text-stone-800 mt-1">
                          {item.sys}/{item.dia}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {item.count} tomas
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-stone-400 mt-2">Sin datos</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {chartData.length >= 2 && (
            <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-2">
                Comportamiento reciente
              </h3>
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-36 overflow-visible"
              >
                <line
                  x1={pad}
                  y1={mapY(config.targetSys)}
                  x2={svgW - pad}
                  y2={mapY(config.targetSys)}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <polyline
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sysPoints}
                />
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={diaPoints}
                />
                {chartData.map((r, i) => (
                  <g key={r.id || i}>
                    <circle
                      cx={pad + i * stepX}
                      cy={mapY(r.sistolica)}
                      r="4"
                      fill="#0f766e"
                    />
                    <circle
                      cx={pad + i * stepX}
                      cy={mapY(r.diastolica)}
                      r="4"
                      fill="#0284c7"
                    />
                  </g>
                ))}
              </svg>
              <div className="flex justify-center gap-5 text-xs font-semibold text-stone-600 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-700 inline-block" />{' '}
                  Alta (Sistólica)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />{' '}
                  Baja (Diastólica)
                </span>
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Smile className="w-5 h-5 text-amber-600" />
              ¿Cómo te has sentido?
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-base">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 font-semibold flex justify-between">
                <span>😊 Bien</span>
                <span>{moodStats.Bien} días</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-100 text-stone-800 font-semibold flex justify-between">
                <span>😔 Cansada</span>
                <span>{moodStats.Cansada}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-950 font-semibold flex justify-between">
                <span>🤕 Dolor</span>
                <span>{moodStats.Dolor}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-950 font-semibold flex justify-between">
                <span>😵‍💫 Mareada</span>
                <span>{moodStats.Mareada}</span>
              </div>
            </div>
          </section>

          {(glucoseStats.fastingAvg || glucoseStats.postAvg) && (
            <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-600" />
                Promedio de Glucosa
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <p className="text-sm text-sky-900 font-semibold">
                    En ayunas
                  </p>
                  <p className="text-2xl font-extrabold text-sky-950 mt-1">
                    {glucoseStats.fastingAvg
                      ? `${glucoseStats.fastingAvg} mg/dL`
                      : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-sm text-indigo-900 font-semibold">
                    Después de comer
                  </p>
                  <p className="text-2xl font-extrabold text-indigo-950 mt-1">
                    {glucoseStats.postAvg
                      ? `${glucoseStats.postAvg} mg/dL`
                      : '—'}
                  </p>
                </div>
              </div>
            </section>
          )}

          <button
            onClick={handleShareWhatsApp}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Enviar resumen por WhatsApp
          </button>

          {/* Últimas tomas agrupadas por día */}
          <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-3">
              Últimas tomas
            </h3>
            <div className="space-y-4">
              {Object.entries(
                [...filtered]
                  .reverse()
                  .slice(0, 15)
                  .reduce((groups, r) => {
                    const key = r.fecha || 'Sin fecha';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(r);
                    return groups;
                  }, {})
              ).map(([fecha, items]) => (
                <div key={fecha} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    {fecha}
                  </p>
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                    {items.map((r, idx) => {
                      const isHigh =
                        r.sistolica >= config.highSys ||
                        r.diastolica >= config.highDia;
                      const isElevated =
                        r.sistolica > config.targetSys ||
                        r.diastolica > config.targetDia;
                      const dotColor = isHigh
                        ? 'bg-rose-500'
                        : isElevated
                        ? 'bg-amber-400'
                        : 'bg-emerald-500';

                      return (
                        <div
                          key={r.id || idx}
                          className="p-3 bg-stone-50/50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`}
                            />
                            <div>
                              <p className="text-base font-bold text-stone-800">
                                {r.sistolica}/{r.diastolica}{' '}
                                <span className="text-xs font-normal text-stone-500">
                                  mmHg
                                </span>
                              </p>
                              <p className="text-xs text-stone-500">
                                {r.jornada} · {r.hora} · {r.animo}
                              </p>
                            </div>
                          </div>
                          {r.glucosa && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                              {r.glucosa} mg/dL
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
