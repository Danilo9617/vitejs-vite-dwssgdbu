import { useState, useEffect, useRef } from 'react';
import { PlusCircle, BarChart3, Settings, Check, RotateCcw } from 'lucide-react';
import RegisterForm from './components/RegisterForm';
import SummaryView from './components/SummaryView';
import AlertModal from './components/AlertModal';
import {
  getConfig,
  saveConfig,
  getLocalRecords,
  syncFromSheets,
  saveRecord,
  deleteRecord
} from './services/sheetsApi';

export default function App() {
  const [tab, setTab] = useState('register');
  const [config, setConfig] = useState(() => getConfig());
  const [records, setRecords] = useState(() => getLocalRecords());
  const [toast, setToast] = useState('');
  const [lastSavedId, setLastSavedId] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (config.scriptUrl) {
      syncFromSheets(config.scriptUrl).then(setRecords);
    }
  }, [config.scriptUrl]);

  const showToast = (msg, undoId = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    setLastSavedId(undoId);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setLastSavedId(null);
    }, undoId ? 12000 : 3000);
  };

  const handleSaveRecord = async (payload, evaluation) => {
    const updated = await saveRecord(payload, config.scriptUrl);
    setRecords(updated);
    showToast(`¡Guardado! (${payload.sistolica}/${payload.diastolica})`, payload.id);
    if (evaluation.alert) {
      setAlertModal({ record: payload, evaluation });
    }
  };

  const handleUndoLast = async () => {
    if (!lastSavedId) return;
    const updated = await deleteRecord(lastSavedId, config.scriptUrl);
    setRecords(updated);
    setAlertModal(null);
    showToast('Toma borrada. Puedes volver a anotarla.');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveConfig(config);
    if (config.scriptUrl) {
      syncFromSheets(config.scriptUrl).then(setRecords);
    }
    showToast('Configuración guardada');
    setTab('register');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-5">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-teal-900 tracking-tight">
            Mi Salud
          </h1>
          <button
            onClick={() => setTab(tab === 'settings' ? 'register' : 'settings')}
            className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600"
            aria-label="Ajustes"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {toast && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-between gap-2 shadow-md">
            <span className="flex items-center gap-2 text-base">
              <Check className="w-5 h-5 shrink-0" />
              {toast}
            </span>
            {lastSavedId && (
              <button
                type="button"
                onClick={handleUndoLast}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Corregir
              </button>
            )}
          </div>
        )}

        {tab === 'register' && (
          <RegisterForm config={config} records={records} onSave={handleSaveRecord} />
        )}
        {tab === 'summary' && <SummaryView records={records} config={config} />}

        {tab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl p-5 border border-stone-200 space-y-4 pb-24"
          >
            <h2 className="text-xl font-bold text-stone-800">Configuración (Para ti)</h2>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">
                URL de Google Apps Script (/exec)
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={config.scriptUrl}
                onChange={(e) => setConfig({ ...config, scriptUrl: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">
                Tu WhatsApp para alertas (con código de país)
              </label>
              <input
                type="tel"
                placeholder="573001234567"
                value={config.whatsapp}
                onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-300 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Meta Sistólica máx.
                </label>
                <input
                  type="number"
                  value={config.targetSys}
                  onChange={(e) => setConfig({ ...config, targetSys: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Meta Diastólica máx.
                </label>
                <input
                  type="number"
                  value={config.targetDia}
                  onChange={(e) => setConfig({ ...config, targetDia: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Alerta Alta Sistólica
                </label>
                <input
                  type="number"
                  value={config.highSys}
                  onChange={(e) => setConfig({ ...config, highSys: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Alerta Alta Diastólica
                </label>
                <input
                  type="number"
                  value={config.highDia}
                  onChange={(e) => setConfig({ ...config, highDia: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-teal-700 text-white font-bold text-lg"
            >
              Guardar configuración
            </button>
          </form>
        )}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-4 py-2.5">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => setTab('register')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-base ${
              tab === 'register'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Registrar
          </button>
          <button
            onClick={() => setTab('summary')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-base ${
              tab === 'summary'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Mi Resumen
          </button>
        </div>
      </nav>

      <AlertModal
        alertData={alertModal}
        config={config}
        onClose={() => setAlertModal(null)}
      />
    </div>
  );
}