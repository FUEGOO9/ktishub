import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Percent, Euro, CheckCircle2, AlertCircle } from 'lucide-react';
import { PromoCodeDefinition, getCustomCoupons, saveCustomCoupons } from '../utils/discounts';

interface AdminCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminCouponsModal: React.FC<AdminCouponsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [coupons, setCoupons] = useState<Record<string, PromoCodeDefinition>>({});
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState<string>('15');
  const [newDescription, setNewDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCoupons(getCustomCoupons());
      setNewCode('');
      setNewType('percentage');
      setNewValue('15');
      setNewDescription('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newCode.trim().toUpperCase();
    const val = parseFloat(newValue);

    if (!formattedCode) {
      setErrorMsg('Introduce un código de cupón válido (ej. VERANO20).');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setErrorMsg('El valor del descuento debe ser mayor que 0.');
      return;
    }
    if (newType === 'percentage' && val > 100) {
      setErrorMsg('El porcentaje no puede superar el 100%.');
      return;
    }

    const updated = {
      ...coupons,
      [formattedCode]: {
        code: formattedCode,
        type: newType,
        value: val,
        label: newType === 'percentage' ? `${val}% OFF Descuento` : `${val.toFixed(2)} € Descuento`,
        description: newDescription.trim() || `Cupón promocional ${formattedCode}`,
      },
    };

    saveCustomCoupons(updated);
    setCoupons(updated);
    setNewCode('');
    setNewValue('15');
    setNewDescription('');
    setErrorMsg(null);
    onShowToast(`¡Cupón ${formattedCode} creado con éxito!`);
  };

  const handleDeleteCoupon = (codeToDelete: string) => {
    const updated = { ...coupons };
    delete updated[codeToDelete];
    saveCustomCoupons(updated);
    setCoupons(updated);
    onShowToast(`Cupón ${codeToDelete} eliminado.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Gestión de Cupones de Descuento</h2>
              <p className="text-xs text-neutral-400">Crea códigos promocionales personalizados para tus clientes</p>
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

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Create new coupon form */}
          <form onSubmit={handleAddCoupon} className="rounded-2xl bg-neutral-950/80 border border-neutral-800 p-4 space-y-4 shadow-inner">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Crear Nuevo Cupón
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Código del Cupón</label>
                <input
                  type="text"
                  placeholder="ej. CAMPEON25"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs font-bold text-white uppercase placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Tipo de Descuento</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Importe Fijo (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  {newType === 'percentage' ? 'Valor (%)' : 'Valor (€)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={newType === 'percentage' ? '100' : '1000'}
                  step={newType === 'percentage' ? '1' : '0.5'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">Descripción Opcional</label>
              <input
                type="text"
                placeholder="ej. Descuento especial de verano para seguidores"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition shadow-md"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Guardar y Activar Cupón</span>
              </button>
            </div>
          </form>

          {/* Active coupons list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Cupones Activos en el Sistema ({Object.keys(coupons).length})
            </h3>

            {Object.keys(coupons).length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-neutral-950/40 border border-neutral-800/60 p-6">
                <Tag className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-400">No hay cupones activos actualmente.</p>
                <p className="text-[11px] text-neutral-500 mt-1">Crea tu primer código arriba para que los clientes puedan aplicarlo en el checkout.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {Object.values(coupons).map((coupon) => (
                  <div
                    key={coupon.code}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs">
                        {coupon.type === 'percentage' ? <Percent className="h-4 w-4" /> : <Euro className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-sm bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                            {coupon.code}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            {coupon.type === 'percentage' ? `-${coupon.value}%` : `-${coupon.value} €`}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{coupon.description || coupon.label}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 rounded-xl transition"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-800 bg-neutral-950/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-bold text-white transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
