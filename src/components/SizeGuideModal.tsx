import React, { useState, useEffect } from 'react';
import { X, Ruler, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { JerseyEdition } from '../types';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEdition?: JerseyEdition;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  initialEdition = 'FAN VERSION',
}) => {
  const [activeTab, setActiveTab] = useState<'FAN' | 'PLAYER'>(
    initialEdition === 'PLAYER VERSION' ? 'PLAYER' : 'FAN'
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialEdition === 'PLAYER VERSION' ? 'PLAYER' : 'FAN');
    }
  }, [isOpen, initialEdition]);

  if (!isOpen) return null;

  // Medidas oficiales de la Player Version (de la tabla oficial del fabricante / foto)
  const playerSizeTable = [
    { size: 'S', chest: '96 cm', length: '70 cm', height: '160 - 170 cm', weight: '48 - 58 kg' },
    { size: 'M', chest: '100 cm', length: '72 cm', height: '170 - 175 cm', weight: '58 - 65 kg' },
    { size: 'L', chest: '104 cm', length: '74 cm', height: '175 - 180 cm', weight: '65 - 70 kg' },
    { size: 'XL', chest: '108 cm', length: '76 cm', height: '180 - 185 cm', weight: '70 - 78 kg' },
    { size: 'XXL', chest: '112 cm', length: '78 cm', height: '185 - 190 cm', weight: '78 - 85 kg' },
    { size: 'XXXL', chest: '116 cm', length: '80 cm', height: '190 - 195 cm', weight: '85 - 92 kg' },
    { size: 'XXXXL', chest: '120 cm', length: '82 cm', height: '195+ cm', weight: '92 - 100 kg' },
  ];

  // Medidas oficiales de la Fan Version (Talla Estándar Europea regular)
  const fanSizeTable = [
    { size: 'S', chest: '100 - 102 cm', length: '71 cm', height: '165 - 172 cm', weight: '55 - 68 kg' },
    { size: 'M', chest: '104 - 106 cm', length: '73 cm', height: '170 - 178 cm', weight: '68 - 78 kg' },
    { size: 'L', chest: '108 - 112 cm', length: '75 cm', height: '176 - 184 cm', weight: '78 - 86 kg' },
    { size: 'XL', chest: '114 - 118 cm', length: '77 cm', height: '182 - 190 cm', weight: '86 - 94 kg' },
    { size: 'XXL', chest: '120 - 124 cm', length: '80 cm', height: '188 - 195 cm', weight: '94 - 102 kg' },
    { size: 'XXXL', chest: '126 - 130 cm', length: '82 cm', height: '192 - 198 cm', weight: '102 - 112 kg' },
    { size: 'XXXXL', chest: '132 - 136 cm', length: '84 cm', height: '195+ cm', weight: '112+ kg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Guía Oficial de Tallas y Medidas</h2>
              <p className="text-xs text-neutral-400">Consulta las medidas exactas para Fan Version y Player Version</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-4 pb-2 bg-neutral-950/40 border-b border-neutral-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('FAN')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
              activeTab === 'FAN'
                ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
          >
            <span>👕 FAN VERSION (Talla EU Estándar)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PLAYER')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
              activeTab === 'PLAYER'
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
          >
            <span>⚡ PLAYER VERSION (Pro Fit Ceñida)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'FAN' ? (
            /* FAN VERSION CONTENT */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-white text-xs mb-0.5">Tallaje Estándar Europeo (Talla EU Habitual)</p>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Las camisetas <strong>FAN VERSION</strong> tienen un corte regular y holgado, idéntico al que estás acostumbrado en tiendas europeas. Escudos bordados en alta calidad. Te recomendamos elegir <strong>tu talla habitual</strong>.
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/60 shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-300 font-bold border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-center">Talla</th>
                      <th className="px-4 py-3 text-center">Pecho (Contorno)</th>
                      <th className="px-4 py-3 text-center">Largo Total</th>
                      <th className="px-4 py-3 text-center">Altura Recomendada</th>
                      <th className="px-4 py-3 text-center">Peso Recomendado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {fanSizeTable.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-900/50 transition">
                        <td className="px-4 py-3 text-center font-mono font-black text-emerald-400 bg-neutral-900/40">{row.size}</td>
                        <td className="px-4 py-3 text-center font-mono">{row.chest}</td>
                        <td className="px-4 py-3 text-center font-mono">{row.length}</td>
                        <td className="px-4 py-3 text-center text-neutral-300">{row.height}</td>
                        <td className="px-4 py-3 text-center text-neutral-300">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PLAYER VERSION CONTENT */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200">
                <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-white text-xs mb-0.5">Tallaje Ceñido Match Pro (球员版修身收腰版型)</p>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Las camisetas de <strong>PLAYER VERSION</strong> cuentan con el corte profesional que visten los jugadores en el campo: tejido ultra elástico, entallado a la cintura y ligeramente más largas. <strong>Si prefieres que te quede más holgada o no tan ajustada, recomendamos pedir 1 talla más.</strong>
                  </p>
                </div>
              </div>

              {/* Table exact from user's image */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/60 shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-300 font-bold border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-center">Talla (尺码)</th>
                      <th className="px-4 py-3 text-center">Pecho (胸围)</th>
                      <th className="px-4 py-3 text-center">Largo (衣长)</th>
                      <th className="px-4 py-3 text-center">Altura (建议身高)</th>
                      <th className="px-4 py-3 text-center">Peso (建议体重)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {playerSizeTable.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-900/50 transition">
                        <td className="px-4 py-3 text-center font-mono font-black text-amber-400 bg-neutral-900/40">{row.size}</td>
                        <td className="px-4 py-3 text-center font-mono">{row.chest}</td>
                        <td className="px-4 py-3 text-center font-mono">{row.length}</td>
                        <td className="px-4 py-3 text-center text-neutral-300">{row.height}</td>
                        <td className="px-4 py-3 text-center text-neutral-300">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-neutral-950 p-3 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                <span className="font-bold text-neutral-300">Nota del fabricante:</span>
                <span>球员版修身收腰版型、衣服偏长、喜欢宽松请选大一码 (Corte entallado pro; si te gusta holgado escoge una talla superior).</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/80">
          <div className="text-[11px] text-neutral-400">
            {activeTab === 'FAN' ? '👕 Fan: Talla habitual europea' : '⚡ Player: Se recomienda 1 talla más para ajuste cómodo'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-black text-neutral-950 transition shadow-md"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
