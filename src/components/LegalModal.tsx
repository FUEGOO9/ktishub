import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Truck, 
  RotateCcw, 
  Lock, 
  Mail, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Scale
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'shipping' | 'returns' | 'legal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Información Legal, Privacidad & Políticas
              </h3>
              <p className="text-xs text-neutral-400">
                KitsHub Store • Transparencia, Seguridad y Garantía al Cliente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-900 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'terms'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Términos y Condiciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Política de Privacidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'shipping'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Envíos & Tarifas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'returns'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Devoluciones & Compensaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'legal'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Aviso Legal & Contacto</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 text-neutral-300 text-xs sm:text-sm space-y-6 leading-relaxed">
          
          {/* ========================================================================= */}
          {/* TAB 1: TÉRMINOS Y CONDICIONES                                             */}
          {/* ========================================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h4 className="font-black text-emerald-400 text-sm flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  1. Ámbito de Aplicación y Objeto
                </h4>
                <p className="text-xs text-neutral-300">
                  Las presentes condiciones regulan la compraventa de camisetas de fútbol, ropa deportiva, kits y accesorios ofrecidos en la tienda KitsHub Store por los usuarios y clientes.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  2. Proceso de Pedido y Pagos Seguros
                </h5>
                <p className="text-xs text-neutral-400">
                  El cliente selecciona los artículos en el catálogo, especifica tallas, versiones (Fan Version o Player Version) y personalización de dorsales (nombre y número). Al pulsar en "Tramitar Pedido", se accede a la pasarela de pago segura. Aceptamos:
                </p>
                <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1">
                  <li><strong>Tarjetas de Crédito y Débito:</strong> Visa, Mastercard, Maestro, American Express (cifrado SSL de 256 bits).</li>
                  <li><strong>Billeteras Digitales:</strong> Apple Pay y Google Pay con autenticación biométrica en 1 clic.</li>
                  <li><strong>Pago a Plazos con Klarna:</strong> Paga en 3 plazos mensuales sin intereses ni comisiones ocultas.</li>
                  <li><strong>PayPal & Criptomonedas:</strong> Métodos alternativos seguros (USDT, BTC, ETH) y pagos directos con confirmación instantánea.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  3. Calidades y Versiones de Camisetas
                </h5>
                <p className="text-xs text-neutral-400">
                  Nuestras prendas se confeccionan con materiales técnicos transpirables de alto rendimiento:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                    <span className="font-bold text-emerald-400 block mb-1">FAN VERSION (Aficionado)</span>
                    <p className="text-neutral-400 text-[11px]">
                      Corte estándar y holgado, escudos y logos bordados en alta definición. Ideal para uso diario o ir al estadio.
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                    <span className="font-bold text-amber-400 block mb-1">PLAYER VERSION (Jugador)</span>
                    <p className="text-neutral-400 text-[11px]">
                      Corte entallado (Slim Fit) idéntico al usado en el terreno de juego, escudos termosellados ultraligeros y microventilación avanzada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  4. Serigrafías y Dorsales
                </h5>
                <p className="text-xs text-neutral-400">
                  Las estampaciones de nombre y número se aplican con tipografías y parches oficiales de la competición elegida mediante prensado térmico industrial de máxima durabilidad al lavado.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: POLÍTICA DE PRIVACIDAD                                             */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h4 className="font-black text-emerald-400 text-sm flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4" />
                  Compromiso con tu Privacidad (RGPD y LOPD)
                </h4>
                <p className="text-xs text-neutral-300">
                  En KitsHub nos tomamos muy en serio la protección de tus datos personales. No vendemos ni compartimos tu información con empresas de publicidad de terceros.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  1. ¿Qué datos recopilamos y para qué?
                </h5>
                <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5">
                  <li><strong>Datos de contacto y entrega:</strong> Nombre, dirección postal, código postal, ciudad, país y número de teléfono. Necesarios exclusivamente para tramitar el envío con la empresa logística y avisarte del tracking por SMS/email.</li>
                  <li><strong>Datos de pago:</strong> Los datos de tarjeta bancaria son procesados directamente por la pasarela de pago segura con certificación PCI-DSS Nivel 1. Nuestra tienda nunca almacena los números completos de tu tarjeta.</li>
                  <li><strong>Historial de pedidos:</strong> Registro de los artículos adquiridos para gestionar garantías, reposiciones o dudas con atención al cliente.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  2. Tus Derechos
                </h5>
                <p className="text-xs text-neutral-400">
                  Puedes ejercer en cualquier momento tus derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO), así como solicitar la eliminación total de tus registros enviándonos un mensaje directo a través de nuestros canales de atención al cliente.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: POLÍTICA DE ENVÍOS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'shipping' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h4 className="font-black text-emerald-400 text-sm flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4" />
                  Tarifas de Envío y Tiempos de Entrega
                </h4>
                <p className="text-xs text-neutral-300">
                  Enviamos a España, toda la Unión Europea y el resto del mundo mediante transporte aéreo exprés con número de seguimiento online.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-sm">3 o MÁS PRENDAS</span>
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-neutral-950">
                      GRATIS
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300 font-bold">
                    Coste de envío: 0,00 €
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Válido para cualquier país de destino al pedir 3 o más artículos.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-sm">1 ó 2 PRENDAS</span>
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                      Tarifa Estándar
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 space-y-1">
                    <span className="block font-bold text-white">🇪🇺 Unión Europea: <strong>7,00 €</strong> <span className="text-[10px] text-neutral-400 font-normal">(Base 4€ + 3€ aranceles UE)</span></span>
                    <span className="block font-bold text-white">🌍 Fuera de la UE: <strong>4,00 €</strong></span>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  Plazos de Preparación y Tránsito
                </h5>
                <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5">
                  <li><strong>Preparación y Personalización:</strong> 2 a 4 días hábiles (estampación de parches y dorsales oficiales).</li>
                  <li><strong>Tránsito y Entrega Internacional:</strong> 7 a 14 días hábiles según destino.</li>
                  <li><strong>Seguimiento en Vivo:</strong> Una vez despachado el paquete, recibirás el código de seguimiento para rastrear el pedido paso a paso con CTT Express.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DEVOLUCIONES Y COMPENSACIONES POR CALIDAD                          */}
          {/* ========================================================================= */}
          {activeTab === 'returns' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4">
                <h4 className="font-black text-amber-400 text-sm flex items-center gap-2 mb-1">
                  <RotateCcw className="h-4 w-4" />
                  Política de Devoluciones & Garantía de Calidad
                </h4>
                <p className="text-xs text-neutral-200">
                  No se admite ningún tipo de devolución o reembolso por cambio de opinión, preferencia o error de talla. ÚNICAMENTE habrá compensación si existe un problema o defecto demostrable de calidad.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  Términos de Devolución y Compensación
                </h5>
                <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-2">
                  <li>
                    <strong className="text-rose-400">Sin Devoluciones:</strong> No se acepta ningún tipo de devolución, cambio de opinión ni reembolso una vez procesado el pedido.
                  </li>
                  <li>
                    <strong className="text-emerald-400">Compensación Exclusiva por Defectos de Calidad:</strong> SOLO se ofrecerá compensación (reemplazo o solución adecuada) en el caso de que la prenda presente un problema probado de calidad, tara o defecto grave de fabricación.
                  </li>
                  <li>
                    <strong className="text-amber-300">Procedimiento para Reportar Problemas de Calidad:</strong> El cliente debe contactar con soporte adjuntando fotografías o vídeo claro del problema de calidad y el número de pedido en las primeras 48 horas tras recibir la entrega.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 flex items-start gap-3 text-xs text-neutral-300">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">¿Tienes un problema de calidad con tu pedido?</strong>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Si tu producto presenta un defecto de calidad de fábrica, escríbenos aportando tu número de pedido (ej. KITS-XXXXX) y fotografías detalladas de la tara. Revisaremos tu caso inmediatamente para tramitar tu compensación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: AVISO LEGAL Y CONTACTO                                             */}
          {/* ========================================================================= */}
          {activeTab === 'legal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h4 className="font-black text-emerald-400 text-sm flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  Aviso Legal y Canales de Atención
                </h4>
                <p className="text-xs text-neutral-300">
                  KitsHub Store opera como comercio online de prendas deportivas y colecciones de fútbol.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  Canales de Contacto y Soporte al Cliente
                </h5>
                <p className="text-xs text-neutral-400">
                  Estamos a tu disposición para ayudarte con cualquier consulta previa a tu compra, cambios de dirección o incidencias en la entrega:
                </p>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span>Email de Soporte: <strong>soporte@kitshub-store.com</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    <span>Horario de Atención: Lunes a Viernes de 09:00 a 19:00 (CET)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                <p>
                  Todas las marcas, logos y nombres de equipos mencionados en este catálogo pertenecen a sus respectivos propietarios y se utilizan únicamente con fines descriptivos para la identificación de los diseños y equipaciones deportivas correspondientes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-800 bg-neutral-950 px-6 py-3.5 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-neutral-500">
            Última actualización: Temporada 2025/2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-950/40"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
