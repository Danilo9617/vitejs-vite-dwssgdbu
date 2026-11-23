import { useState, useEffect, useMemo } from 'react';
import { Heart, Droplet, CheckCircle2 } from 'lucide-react';
import { getLocalDateTimeInfo, evaluateBP } from '../utils/healthUtils';

const MOODS = [
  { id: 'Bien', label: 'Me siento bien', emoji: '😊' },
  { id: 'Cansada', label: 'Cansada / floja', emoji: '😔' },
  { id: 'Dolor', label: 'Con dolor / cabeza', emoji: '🤕' },
  { id: 'Mareada', label: 'Mareada', emoji: '😵‍💫' }
];

export default function RegisterForm({ config, records, onSave }) {
  const [nowInfo, setNowInfo] = useState(() => getLocalDateTimeInfo());
  const [animo, setAnimo] = useState('Bien');
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [pulso, setPulso] = useState('');
  const [midioGlucosa, setMidioGlucosa] = useState(false);
  const [glucosa, setGlucosa] = useState('');
  const [condicionGlucosa, setCondicionGlucosa] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowInfo(getLocalDateTimeInfo()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Calcula hace cuántos días fue la última toma de glucosa
  const glucoseReminder = useMemo(() => {
    const withGlucose = [...records].filter((r) => r.glucosa);
    if (!withGlucose.length) {
      return { text: 'Sin tomas de azúcar registradas aún', due: true };
    }
    const last = withGlucose[withGlucose.length - 1];
    const lastTs = Number(last.id);
    if (isNaN(lastTs)) return { text: `Última toma: ${last.fecha}`, due: false };

    const diffDays = Math.floor((Date.now() - lastTs) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'Ya mediste azúcar hoy', due: false };
    if (diffDays === 1) return { text: 'Última toma de azúcar: ayer', due: false };
    if (diffDays >= 3) {
      return { text: `Hoy toca medir azúcar (pasaron ${diffDays} días)`, due: true };
    }
    return { text: `Última toma hace ${diffDays} días`, due: false };
  }, [records]);

  const bpEval =
    sistolica && diastolica ? evaluateBP(sistolica, diastolica, config) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sistolica || !diastolica) return;
    if (midioGlucosa && (!glucosa || !condicionGlucosa)) {
      alert('Por favor selecciona si la glucosa fue En ayunas o Después de comer.');
      return;
    }

    setSaving(true);
    const freshTime = getLocalDateTimeInfo();
    const evaluation = evaluateBP(sistolica, diastolica, config);

    const payload = {
      id: Date.now(),
      fecha: freshTime.fecha,
      hora: freshTime.hora,
      jornada: freshTime.jornada,
      animo,
      sistolica: Number(sistolica),
      diastolica: Number(diastolica),
      pulso: pulso ? Number(pulso) : null,
      glucosa: midioGlucosa ? Number(glucosa) : null,
      condicionGlucosa: midioGlucosa ? condicionGlucosa : '',
      estadoAlerta: evaluation.label,
      dispararAlerta: evaluation.alert
    };

    await onSave(payload, evaluation);

    setSistolica('');
    setDiastolica('');
    setPulso('');
    setMidioGlucosa(false);
    setGlucosa('');
    setCondicionGlucosa('');
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500 capitalize">{nowInfo.fechaLarga}</p>
          <p className="text-2xl font-bold text-stone-800">{nowInfo.hora}</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-teal-50 text-teal-800 font-semibold text-base border border-teal-200">
          Jornada: {nowInfo.jornada}
        </span>
      </div>

      <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
        <label className="block text-lg font-bold text-stone-800 mb-3">
          1. ¿Cómo te sientes hoy?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setAnimo(m.id)}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-2.5 transition ${
                animo === m.id
                  ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-base leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-600" />
          <h2 className="text-lg font-bold text-stone-800">2. Tensión Arterial</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-1">
              Alta (Sistólica)
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="125"
              required
              min="60"
              max="260"
              value={sistolica}
              onChange={(e) => setSistolica(e.target.value)}
              className="w-full text-center text-3xl font-bold py-3.5 rounded-xl border-2 border-stone-300 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-1">
              Baja (Diastólica)
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="80"
              required
              min="40"
              max="160"
              value={diastolica}
              onChange={(e) => setDiastolica(e.target.value)}
              className="w-full text-center text-3xl font-bold py-3.5 rounded-xl border-2 border-stone-300 focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {bpEval && (
          <div
            className={`p-3 rounded-xl text-center font-bold text-base ${
              bpEval.color === 'emerald'
                ? 'bg-emerald-100 text-emerald-900'
                : bpEval.color === 'amber'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-rose-100 text-rose-900'
            }`}
          >
            Estado: {bpEval.label}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Pulso / latidos (opcional)
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Ej: 72"
            value={pulso}
            onChange={(e) => setPulso(e.target.value)}
            className="w-full text-lg px-4 py-2.5 rounded-xl border border-stone-300"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Droplet className="w-6 h-6 text-sky-600 shrink-0" />
              <h2 className="text-lg font-bold text-stone-800">3. ¿Mediste azúcar hoy?</h2>
            </div>
            <p
              className={`text-xs font-semibold mt-1 ml-8 ${
                glucoseReminder.due ? 'text-sky-700' : 'text-stone-500'
              }`}
            >
              {glucoseReminder.text}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMidioGlucosa(false)}
              className={`px-4 py-2 rounded-xl font-bold ${
                !midioGlucosa ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setMidioGlucosa(true)}
              className={`px-4 py-2 rounded-xl font-bold ${
                midioGlucosa ? 'bg-sky-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Sí
            </button>
          </div>
        </div>

        {midioGlucosa && (
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Valor de glucosa (mg/dL)
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Ej: 98"
                required={midioGlucosa}
                value={glucosa}
                onChange={(e) => setGlucosa(e.target.value)}
                className="w-full text-center text-3xl font-bold py-3 rounded-xl border-2 border-sky-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                ¿Cómo te la tomaste? (Obligatorio)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['En ayunas', 'Después de comer'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondicionGlucosa(cond)}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-base ${
                      condicionGlucosa === cond
                        ? 'border-sky-600 bg-sky-50 text-sky-950'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <CheckCircle2 className="w-6 h-6" />
        {saving ? 'Guardando...' : 'Guardar Registro'}
      </button>
    </form>
  );
}