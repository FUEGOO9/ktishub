import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  Coins, 
  CheckCircle2, 
  HelpCircle, 
  Save, 
  Smartphone, 
  CreditCard,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { PaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../types';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PaymentSettings;
  onSaveSettings: (newSettings: PaymentSettings) => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<PaymentSettings>(settings);
  const [activeTab, setActiveTab] = useState<'platforms' | 'paypal' | 'crypto' | 'bank' | 'security'>('platforms');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Gestión Privada de Cobros
                </h2>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Solo Tú (Oculto a Clientes)
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Configura Stripe, Klarna, PayPal, Cripto o tus métodos de cobro con total seguridad.
              </p>
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

        {/* Protection Alert */}
        <div className="bg-emerald-950/30 border-b border-neutral-800/80 px-6 py-2.5 flex items-center gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Protección Activa:</strong> Esta ventana y los accesos de administración quedan 100% ocultos a tus clientes para que solo tú puedas gestionar cómo cobras.
          </span>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-3 gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('platforms')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 shrink-0 ${
              activeTab === 'platforms'
                ? 'bg-neutral-900 text-emerald-400 border-emerald-400'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Stripe & Klarna</span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] text-emerald-300">Recomendado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paypal')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 shrink-0 ${
              activeTab === 'paypal'
                ? 'bg-neutral-900 text-blue-400 border-blue-400'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>PayPal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 shrink-0 ${
              activeTab === 'crypto'
                ? 'bg-neutral-900 text-amber-400 border-amber-400'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Criptomonedas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 shrink-0 ${
              activeTab === 'security'
                ? 'bg-neutral-900 text-purple-400 border-purple-400'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Clave de Acceso</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* TAB 1: STRIPE & KLARNA */}
          {activeTab === 'platforms' && (
            <div className="space-y-4">
              
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-black text-sm text-white">
                      Pasarela Oficial de Tarjetas & Klarna
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#FFB3C7] text-neutral-950 px-2 py-0.5 font-black text-[10px]">
                      Klarna.
                    </span>
                    <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-bold text-[10px]">
                      Stripe
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Con Stripe y Klarna tus clientes pueden pagar con tarjeta de crédito/débito, Apple Pay, Google Pay y <strong>Klarna en 3 plazos sin intereses</strong>. El dinero va a tu cuenta bancaria y no tienes riesgo de errores de red o disputas manuales.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accept Card Toggle */}
                <div className="flex items-center justify-between rounded-2xl bg-neutral-950 p-4 border border-neutral-800">
                  <div>
                    <label htmlFor="acceptCard" className="text-xs font-bold text-white block cursor-pointer">
                      Aceptar Tarjeta Bancaria
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Visa, Mastercard, Apple/Google Pay
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="acceptCard"
                    checked={formData.acceptCard}
                    onChange={(e) => setFormData({ ...formData, acceptCard: e.target.checked })}
                    className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-400"
                  />
                </div>

                {/* Klarna Toggle */}
                <div className="flex items-center justify-between rounded-2xl bg-neutral-950 p-4 border border-neutral-800">
                  <div>
                    <label htmlFor="klarnaEnabled" className="text-xs font-bold text-white block cursor-pointer">
                      Habilitar Klarna (3 Plazos)
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Paga en 3 plazos o a los 30 días
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="klarnaEnabled"
                    checked={formData.klarnaEnabled}
                    onChange={(e) => setFormData({ ...formData, klarnaEnabled: e.target.checked })}
                    className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Optional Stripe Payment Link */}
              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5 flex items-center justify-between">
                  <span>Enlace de Pago Directo de Stripe (Opcional)</span>
                  <span className="text-[10px] text-neutral-400">buy.stripe.com</span>
                </label>
                <input
                  type="url"
                  placeholder="ej: https://buy.stripe.com/tu_enlace_de_pago"
                  value={formData.stripePaymentLink || ''}
                  onChange={(e) => setFormData({ ...formData, stripePaymentLink: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Si creas un enlace de pago fijo en tu cuenta de Stripe (Stripe Dashboard → Payment Links), pégalo aquí para que los clientes vayan directos a tu pasarela.
                </p>
              </div>

              {/* Server API Key Explanation */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Cobros Automáticos en el Servidor (STRIPE_SECRET_KEY)</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Para activar los cobros reales automáticos con Stripe Checkout y Klarna, solo tienes que añadir la variable <code className="text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded font-mono">STRIPE_SECRET_KEY</code> en la configuración de la app.
                </p>
                <div className="text-[11px] text-neutral-400 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80 space-y-1">
                  <p className="text-white font-bold">🔒 ¿Por qué está protegido para ti?</p>
                  <p>
                    Nuestro servidor envía descripciones discretas y genéricas (<em>"Moda y prendas deportivas oficiales"</em>) en cada pedido, garantizando que Stripe y Klarna procesen tus cobros sin bloqueos ni problemas.
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: PAYPAL */}
          {activeTab === 'paypal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-blue-950/30 p-3.5 border border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="acceptPaypal"
                    checked={formData.acceptPaypal}
                    onChange={(e) => setFormData({ ...formData, acceptPaypal: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-400"
                  />
                  <label htmlFor="acceptPaypal" className="text-xs font-bold text-white cursor-pointer">
                    Habilitar cobro por PayPal
                  </label>
                </div>
                <span className="text-[11px] text-blue-300 font-semibold">
                  {formData.acceptPaypal ? 'Activo' : 'Desactivado (Recomendado)'}
                </span>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Atención:</strong> En PayPal los compradores pueden abrir disputas injustas o retener fondos. Si prefieres evitar líos, puedes dejarlo desactivado y usar Tarjeta/Klarna.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                  Tu correo de PayPal
                </label>
                <input
                  type="email"
                  placeholder="ej: elfuegodelawwe@gmail.com"
                  value={formData.paypalEmail}
                  onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                  Usuario PayPal.Me (Opcional)
                </label>
                <div className="flex rounded-2xl border border-neutral-700 bg-neutral-950 overflow-hidden">
                  <span className="flex items-center px-3.5 bg-neutral-900 text-neutral-400 text-xs font-mono border-r border-neutral-800">
                    paypal.me/
                  </span>
                  <input
                    type="text"
                    placeholder="tu-usuario"
                    value={formData.paypalMeUsername || ''}
                    onChange={(e) => setFormData({ ...formData, paypalMeUsername: e.target.value })}
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CRYPTO */}
          {activeTab === 'crypto' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-amber-950/30 p-3.5 border border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="acceptCrypto"
                    checked={formData.acceptCrypto}
                    onChange={(e) => setFormData({ ...formData, acceptCrypto: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="acceptCrypto" className="text-xs font-bold text-white cursor-pointer">
                    Habilitar cobro en Criptomonedas (USDT / BTC / ETH)
                  </label>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold">
                  {formData.acceptCrypto ? 'Activo' : 'Desactivado (Recomendado)'}
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs text-neutral-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Muchos clientes se equivocan al elegir la red (ej: enviar por Ethereum en vez de TRON). Si prefieres evitar confusiones, mantén Stripe y Klarna como métodos principales.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1">
                  Dirección USDT (Red TRC-20)
                </label>
                <input
                  type="text"
                  placeholder="ej: TXb7g9LqK8w7f5mP92kV1uN3xR6sY4zQ1w"
                  value={formData.usdtTrc20Address}
                  onChange={(e) => setFormData({ ...formData, usdtTrc20Address: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1">
                  Dirección Bitcoin (BTC)
                </label>
                <input
                  type="text"
                  placeholder="ej: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                  value={formData.btcAddress}
                  onChange={(e) => setFormData({ ...formData, btcAddress: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY / ADMIN PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Key className="h-4 w-4" />
                  <span>Clave Secreta del Panel de Administrador</span>
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  Configura tu propia contraseña personalizada con letras, números y símbolos para abrir y bloquear las opciones de administración de la tienda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                  Nueva Contraseña / Clave de Administrador
                </label>
                <div className="relative max-w-sm">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="Escribe tu nueva clave secreta (letras y números)..."
                    value={formData.adminPin || ''}
                    onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 pl-4 pr-11 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition"
                    title={showAdminPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                  💡 Puedes utilizar cualquier combinación de texto y números (ejemplo: <span className="font-mono text-neutral-300 font-bold">AdminTienda2026</span> o el código que prefieras). Solo quien conozca esta clave podrá desbloquear la gestión.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <button
              type="button"
              onClick={() => setFormData(DEFAULT_PAYMENT_SETTINGS)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition underline"
            >
              Restablecer valores por defecto
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2.5 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-950/40"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-neutral-950" />
                    <span>¡Guardado Correctamente!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
