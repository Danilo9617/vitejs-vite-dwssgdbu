import { AlertTriangle, PhoneCall, X } from 'lucide-react';

export default function AlertModal({ alertData, config, onClose }) {
  if (!alertData) return null;

  const { record, evaluation } = alertData;

  const handleWhatsAppAlert = () => {
    const msg =
      `⚠️ *Aviso de Tensión Mamá*\n` +
      `Acabo de medir mi tensión y salió en *${record.sistolica}/${record.diastolica} mmHg* (${evaluation.label}).\n` +
      `Hora: ${record.hora} (${record.jornada})\n` +
      `Me siento: ${record.animo}`;

    const phone = config.whatsapp ? config.whatsapp.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-rose-500 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertTriangle className="w-9 h-9 shrink-0" />
            <h2 className="text-2xl font-extrabold leading-tight">{evaluation.label}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 text-center">
          <p className="text-4xl font-black text-rose-900">
            {record.sistolica} / {record.diastolica} <span className="text-lg">mmHg</span>
          </p>
        </div>

        <p className="text-base text-stone-700 leading-relaxed">
          Siéntate tranquila, respira despacio durante <strong>10 minutos</strong> y vuelve a
          tomarla. Ya quedó guardado en tu historial.
        </p>

        <button
          onClick={handleWhatsAppAlert}
          className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-lg font-bold flex items-center justify-center gap-2 shadow-md"
        >
          <PhoneCall className="w-6 h-6" />
          Avisar a mi hijo por WhatsApp
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-stone-100 text-stone-700 font-bold text-base"
        >
          Entendido, cerrar
        </button>
      </div>
    </div>
  );
}