import React, { useState } from 'react';
import { createNowpaymentsInvoice } from '../utils/cryptoPayment';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  ShoppingBag,
  Lock,
  Coins,
  Wallet,
  ExternalLink,
  Smartphone,
  Settings,
  Globe,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  CartItem, 
  CustomerDetails, 
  Order, 
  PaymentMethod, 
  PaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS,
  calculateShippingInfo,
  isEUCountry
} from '../types';

export interface CountryCodeItem {
  code: string;
  name: string;
  prefix: string;
  flag: string;
  isEU: boolean;
}

export const INTERNATIONAL_COUNTRY_CODES: CountryCodeItem[] = [
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸', isEU: true },
  { code: 'FR', name: 'Francia', prefix: '+33', flag: '🇫🇷', isEU: true },
  { code: 'DE', name: 'Alemania', prefix: '+49', flag: '🇩🇪', isEU: true },
  { code: 'IT', name: 'Italia', prefix: '+39', flag: '🇮🇹', isEU: true },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹', isEU: true },
  { code: 'GB', name: 'Reino Unido', prefix: '+44', flag: '🇬🇧', isEU: false },
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸', isEU: false },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽', isEU: false },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷', isEU: false },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴', isEU: false },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱', isEU: false },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪', isEU: false },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨', isEU: false },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾', isEU: false },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷', isEU: false },
  { code: 'NL', name: 'Países Bajos', prefix: '+31', flag: '🇳🇱', isEU: true },
  { code: 'BE', name: 'Bélgica', prefix: '+32', flag: '🇧🇪', isEU: true },
  { code: 'CH', name: 'Suiza', prefix: '+41', flag: '🇨🇭', isEU: false },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹', isEU: true },
  { code: 'IE', name: 'Irlanda', prefix: '+353', flag: '🇮🇪', isEU: true },
  { code: 'SE', name: 'Suecia', prefix: '+46', flag: '🇸🇪', isEU: true },
  { code: 'NO', name: 'Noruega', prefix: '+47', flag: '🇳🇴', isEU: false },
  { code: 'DK', name: 'Dinamarca', prefix: '+45', flag: '🇩🇰', isEU: true },
  { code: 'PL', name: 'Polonia', prefix: '+48', flag: '🇵🇱', isEU: true },
  { code: 'MA', name: 'Marruecos', prefix: '+212', flag: '🇲🇦', isEU: false },
  { code: 'CA', name: 'Canadá', prefix: '+1', flag: '🇨🇦', isEU: false },
  { code: 'AU', name: 'Australia', prefix: '+61', flag: '🇦🇺', isEU: false },
  { code: 'JP', name: 'Japón', prefix: '+81', flag: '🇯🇵', isEU: false },
  { code: 'OTHER', name: 'Otro país (Personalizado)', prefix: '+', flag: '🌍', isEU: false },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onClearCart: () => void;
  onUpdateQuantity?: (index: number, delta: number) => void;
  onRemoveItem?: (index: number) => void;
  onOrderCompleted?: (order: Order) => void;
  paymentSettings?: PaymentSettings;
  onOpenSettings?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'shipping' | 'returns' | 'legal') => void;
}

type CryptoToken = 'USDT' | 'BTC' | 'ETH';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onClearCart,
  onUpdateQuantity,
  onRemoveItem,
  onOrderCompleted,
  paymentSettings = DEFAULT_PAYMENT_SETTINGS,
  onOpenSettings,
  onOpenLegal,
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    if (paymentSettings.acceptCard) return 'card';
    if (paymentSettings.klarnaEnabled) return 'klarna';
    if (paymentSettings.acceptPaypal) return 'paypal';
    if (paymentSettings.acceptCrypto) return 'crypto';
    return 'card';
  });

  // Gateway connection state (Stripe / Klarna)
  const [isConnectingGateway, setIsConnectingGateway] = useState(false);

  // Customer details
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    country: 'España',
    countryPrefix: '+34',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    notes: '',
  });

  // International phone & country destination state
  const [selectedPrefix, setSelectedPrefix] = useState<string>('+34');
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [destinationCountry, setDestinationCountry] = useState<string>('España');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Effective payment settings
  const paypalEmail = paymentSettings.paypalEmail || 'elfuegodelawwe@gmail.com';
  const paypalMeUsername = paymentSettings.paypalMeUsername || '';
  const cryptoWallets: Record<CryptoToken, { network: string; address: string; symbol: string }> = {
    USDT: {
      network: 'TRON (TRC20) - Comisión mínima',
      address: paymentSettings.usdtTrc20Address || 'TXb7g9LqK8w7f5mP92kV1uN3xR6sY4zQ1w',
      symbol: 'USDT',
    },
    BTC: {
      network: 'Bitcoin SegWit',
      address: paymentSettings.btcAddress || 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      symbol: 'BTC',
    },
    ETH: {
      network: 'Ethereum (ERC20)',
      address: paymentSettings.ethAddress || '0x71C8366420Aaa4171559868C6A53F3fD04646738',
      symbol: 'ETH',
    },
  };

  // PayPal state
  const [customerPaypalEmail, setCustomerPaypalEmail] = useState<string>('');
  const [copiedPaypal, setCopiedPaypal] = useState(false);
  const [copiedOrderCode, setCopiedOrderCode] = useState(false);

  // Crypto state
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoToken>('USDT');
  const [cryptoTxId, setCryptoTxId] = useState('');
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  // Completed order
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  // Totals & Shipping calculation
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 24.99) * item.quantity,
    0
  );
  
  // Dynamic shipping calculation according to store policy:
  // - 3 or more items (>= 3): FREE shipping worldwide (0 €)
  // - Less than 3 items (< 3):
  //     * EU countries: 7.00 € (4.00 € base + 3.00 € new EU tariffs)
  //     * Outside EU: 4.00 €
  const shippingInfo = calculateShippingInfo(totalItemsCount, destinationCountry);
  const shippingCost = shippingInfo.shippingCost;
  const totalAmount = subtotal + shippingCost;

  const currentOrderId = completedOrder ? completedOrder.id : `PED-${Math.floor(100000 + Math.random() * 900000)}`;
const handleCryptoPayment = async () => {
  try {
    const res = await fetch('/api/create-nowpayments-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: totalAmount,
        price_currency: 'EUR',
        order_id: currentOrderId,
        order_description: `Pedido ${currentOrderId} - Kitshub`,
      }),
    });

    const data = await res.json();
    if (data.invoice_url) {
      window.location.href = data.invoice_url;
    } else {
      alert('Error al generar la factura en NOWPayments: ' + (data.error || 'Inténtalo de nuevo'));
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión con la pasarela de pago');
  }
};
  const handleCopyPaypal = () => {
    navigator.clipboard.writeText(paypalEmail);
    setCopiedPaypal(true);
    setTimeout(() => setCopiedPaypal(false), 2000);
  };

  const handleCopyCryptoAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedCryptoAddress(true);
    setTimeout(() => setCopiedCryptoAddress(false), 2000);
  };

  const handleCopyOrderRef = () => {
    navigator.clipboard.writeText(currentOrderId);
    setCopiedOrderCode(true);
    setTimeout(() => setCopiedOrderCode(false), 2000);
  };

  const effectivePrefix = selectedPrefix === '+' 
    ? (customPrefix.trim() ? (customPrefix.trim().startsWith('+') ? customPrefix.trim() : `+${customPrefix.trim()}`) : '+') 
    : selectedPrefix;

  const getFullInternationalPhone = (): string => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    return `${effectivePrefix} ${trimmed}`.trim();
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = getFullInternationalPhone();

    if (!customer.name.trim()) {
      setDetailsError('Por favor, indica el nombre completo del destinatario.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().replace(/\D/g, '').length < 6) {
      setDetailsError('Por favor, introduce tu número de teléfono móvil con el prefijo internacional para asegurar la entrega.');
      return;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      setDetailsError('Por favor, introduce un correo electrónico válido para enviarte la confirmación.');
      return;
    }
    if (!customer.address.trim()) {
      setDetailsError('Por favor, especifica la dirección de entrega (calle, número, etc.).');
      return;
    }
    if (!customer.city.trim() || !customer.postalCode.trim()) {
      setDetailsError('Por favor, completa la ciudad y el código postal.');
      return;
    }

    setCustomer((prev) => ({
      ...prev,
      phone: fullPhone,
      country: destinationCountry,
      countryPrefix: effectivePrefix,
    }));
    setDetailsError(null);
    setStep('payment');
  };

  const handleStripeOrKlarnaCheckout = async (method: 'card' | 'klarna') => {
    setIsConnectingGateway(true);

    if (paymentSettings.stripePaymentLink) {
      finalizeOrder(method, 'pending');
      window.location.href = paymentSettings.stripePaymentLink;
      return;
    }
if (method === 'crypto') {
      try {
        finalizeOrder(method, 'pending');
        const invoiceUrl = await createNowpaymentsInvoice({
          orderId: currentOrderId,
          amountEur: totalAmount,
          orderDescription: `Pedido KitsHub #${currentOrderId}`,
        });
        window.location.href = invoiceUrl;
        return;
      } catch (cryptoErr) {
        console.error('Error con NOWPayments:', cryptoErr);
        alert('Hubo un error al conectar con la pasarela de criptomonedas. Por favor, inténtalo de nuevo.');
        setIsConnectingGateway(false);
        return;
      }
    }
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderId,
          amount: totalAmount,
          customer,
          paymentMethod: method,
          items: cartItems.map((item) => ({
            title: item.product.title,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        finalizeOrder(method, 'pending');
        window.location.href = data.url;
        return;
      }

      // Fallback
      handleConfirmOrder(method);
    } catch (e) {
      console.warn('Fallback local order', e);
      handleConfirmOrder(method);
    } finally {
      setIsConnectingGateway(false);
    }
  }; const handleCryptoPayment = async () => {
    setIsConnectingGateway(true);
    try {
      const res = await fetch('/api/create-nowpayments-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_amount: totalAmount,
          price_currency: 'eur',
          order_id: currentOrderId,
          order_description: `Pedido ${currentOrderId} - KitsHub`,
        }),
      });

      const data = await res.json();
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        alert('Error al generar la factura en NOWPayments: ' + (data.error || 'Inténtalo de nuevo'));
        setIsConnectingGateway(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con la pasarela de pago');
      setIsConnectingGateway(false);
    }
  };
const handleConfirmOrder = async (finalPaymentMethod: PaymentMethod) => {
    if (finalPaymentMethod === 'crypto') {
      setIsConnectingGateway(true);
      try {
        const res = await fetch('/api/create-nowpayments-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_amount: totalAmount,
            price_currency: 'eur',
            order_id: currentOrderId,
            order_description: `Pedido ${currentOrderId} - KitsHub`,
          }),
        });

        const data = await res.json();

        if (data.invoice_url) {
          finalizeOrder('crypto', 'pending');
          window.location.href = data.invoice_url;
          return;
        } else {
          alert('Error al conectar con NOWPayments. Inténtalo de nuevo.');
        }
      } catch (err) {
        console.error('Error generando factura NOWPayments:', err);
        alert('Error de conexión con la pasarela cripto.');
      } finally {
        setIsConnectingGateway(false);
      }
      return;
    }

    if (finalPaymentMethod === 'card' || finalPaymentMethod === 'klarna') {
      setIsProcessingCard(true);
      setTimeout(() => {
        setIsProcessingCard(false);
        finalizeOrder(finalPaymentMethod, 'paid');
      }, 1500);
    } else {
      finalizeOrder(finalPaymentMethod, 'pending');
    }
  };

  const finalizeOrder = (method: PaymentMethod, status: 'pending' | 'paid') => {
    const order: Order = {
      id: currentOrderId,
      customer,
      items: [...cartItems],
      subtotal,
      shippingCost,
      total: totalAmount,
      paymentMethod: method,
      paymentStatus: status,
      orderStatus: status === 'paid' ? 'processing' : 'pending',
      carrier: 'CTT Express',
      cryptoCurrency: method === 'crypto' ? selectedCrypto : undefined,
      cryptoTxId: method === 'crypto' ? cryptoTxId : undefined,
      paypalAccountEmail: method === 'paypal' ? customerPaypalEmail || customer.email : undefined,
      date: new Date().toISOString(),
      estimatedDelivery: 'Envío asegurado con CTT Express y número de seguimiento',
    };

    setCompletedOrder(order);
    if (onOrderCompleted) onOrderCompleted(order);
    onClearCart();
    setStep('confirmation');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        
        {/* Header with Step Indicator */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-5 sm:p-6 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {step === 'details' && '1. Datos de Envío y Entrega'}
                {step === 'payment' && '2. Método de Pago Seguro'}
                {step === 'confirmation' && '¡Pedido Completado!'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {step === 'details' && 'Indica la dirección donde deseas recibir las prendas'}
              {step === 'payment' && 'Elige entre Tarjeta, Klarna (3 plazos sin intereses), PayPal o Cripto'}
              {step === 'confirmation' && 'Hemos recibido tu pedido correctamente'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PASO 1: DATOS DE ENVÍO                                                    */}
        {/* ========================================================================= */}
        {step === 'details' && (
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-5 text-xs">
            {/* Cart Preview Summary in Checkout */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
              <div className="flex items-center justify-between font-bold text-neutral-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  Resumen de tu compra ({totalItemsCount} prendas)
                </span>
                <span className="font-mono text-emerald-400 font-black text-sm">
                  {subtotal.toFixed(2)} €
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-800/80">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pt-2 text-neutral-300 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate text-xs">
                        {item.product.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5 flex-wrap">
                        <span>{item.selectedEdition || 'FAN VERSION'} • Talla: <span className="text-emerald-400 font-bold">{item.selectedSize}</span></span>
                        {item.customization?.number && <span>• #{item.customization.number} {item.customization.name || ''}</span>}
                        {item.discountCode && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold">
                            Cupón: {item.discountCode} (-{item.discountPercent || 20}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onUpdateQuantity && (
                        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, -1)}
                            className="px-2 py-1 text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                            title="Quitar 1 prenda"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-1.5 font-mono text-xs font-bold text-white min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, 1)}
                            className="px-2 py-1 text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                            title="Añadir 1 prenda más"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <span className="font-mono text-white text-xs font-bold w-14 text-right">
                        {((item.product.price || 24.99) * item.quantity).toFixed(2)} €
                      </span>

                      {onRemoveItem && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          className="p-1 rounded-md text-neutral-500 hover:bg-rose-950 hover:text-rose-400 transition"
                          title="Eliminar de la cesta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between border-t border-neutral-800 pt-2 text-xs gap-1">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Gastos de envío ({destinationCountry}):</span>
                </span>
                <span className="font-bold">
                  {shippingInfo.isFree ? (
                    <span className="text-emerald-400 font-extrabold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                      GRATIS (Promoción 3+ prendas)
                    </span>
                  ) : shippingInfo.isEU ? (
                    <span className="text-amber-300 font-extrabold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                      7,00 € <span className="text-neutral-300 font-normal text-[10px]">(4€ base + 3€ aranceles UE)</span>
                    </span>
                  ) : (
                    <span className="text-neutral-200 font-extrabold bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded-lg text-[11px]">
                      4,00 € <span className="text-neutral-400 font-normal text-[10px]">(Tarifa fuera de UE)</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Shipping Policy Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 to-neutral-900 p-3.5 text-xs text-neutral-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="text-base">✈️</span>
                  <span>Tarifas Oficiales de Envío:</span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  • <strong>3 o más prendas:</strong> <span className="text-emerald-400 font-bold">¡Envío GRATIS mundial!</span>
                  <br />
                  • <strong>1 o 2 prendas:</strong> <span className="text-amber-300 font-semibold">7,00 € UE</span> (incluye 3€ nuevos aranceles) / <span className="text-neutral-200 font-semibold">4,00 € Fuera de UE</span>.
                </p>
              </div>
              <div className="shrink-0 self-end sm:self-center">
                {totalItemsCount >= 3 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1 text-[11px] font-black text-emerald-300">
                    ✓ ¡Envío GRATIS aplicado!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                    Añade {3 - totalItemsCount} más para Envío Gratis
                  </span>
                )}
              </div>
            </div>

            {/* Error Notification if required fields are missing */}
            {detailsError && (
              <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <p className="font-bold text-red-100">Por favor, revisa los datos de envío:</p>
                  <p className="text-[11px] text-red-300/90 mt-0.5">{detailsError}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dirección de Entrega Internacional
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Globe className="h-3 w-3" />
                  <span>{shippingInfo.isEU ? 'Destino: Unión Europea' : 'Destino: Fuera de UE'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Destinatario */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Nombre Completo del Destinatario *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Rodríguez Pérez"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* País de Destino */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium flex items-center justify-between">
                    <span>País de Destino *</span>
                    <span className={`text-[10px] font-bold ${shippingInfo.isEU ? 'text-amber-400' : 'text-neutral-400'}`}>
                      {shippingInfo.isEU ? '🇪🇺 UE (7€ si <3 uds)' : '🌍 Fuera UE (4€ si <3 uds)'}
                    </span>
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      setDestinationCountry(newCountry);
                      const found = INTERNATIONAL_COUNTRY_CODES.find((c) => c.name === newCountry);
                      if (found && found.code !== 'OTHER') {
                        setSelectedPrefix(found.prefix);
                      }
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {INTERNATIONAL_COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.name}>
                        {item.flag} {item.name} {item.isEU ? '(UE 🇪🇺)' : '(Fuera UE 🌍)'} • {item.prefix}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teléfono Móvil con Selector de Prefijo Internacional */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Teléfono Móvil (con prefijo internacional) *</span>
                    </label>
                    <span className="text-[10px] text-emerald-400/90 font-medium">
                      Para SMS/WhatsApp del transportista
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Selector de Prefijo */}
                    <div className="w-36 sm:w-48 shrink-0">
                      <select
                        value={selectedPrefix}
                        onChange={(e) => {
                          const newPrefix = e.target.value;
                          setSelectedPrefix(newPrefix);
                          const found = INTERNATIONAL_COUNTRY_CODES.find((c) => c.prefix === newPrefix && c.code !== 'OTHER');
                          if (found) {
                            setDestinationCountry(found.name);
                          }
                          if (detailsError) setDetailsError(null);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none truncate"
                        title="Selecciona el prefijo telefónico de tu país"
                      >
                        {INTERNATIONAL_COUNTRY_CODES.map((item) => (
                          <option key={item.code} value={item.prefix}>
                            {item.flag} {item.prefix} ({item.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Si seleccionó Otro país / personalizado */}
                    {selectedPrefix === '+' && (
                      <div className="w-20 shrink-0">
                        <input
                          type="text"
                          placeholder="+00"
                          value={customPrefix}
                          onChange={(e) => {
                            setCustomPrefix(e.target.value);
                            if (detailsError) setDetailsError(null);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-2 py-2 text-center text-xs font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                          title="Escribe tu prefijo internacional"
                        />
                      </div>
                    )}

                    {/* Número de Teléfono */}
                    <div className="flex-1">
                      <input
                        type="tel"
                        required
                        placeholder="Ej: 612 345 678 o tu número nacional"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (detailsError) setDetailsError(null);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white font-mono placeholder-neutral-500 focus:border-emerald-500 focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Indicador de Formato y Ayuda Internacional */}
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-neutral-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-emerald-400" />
                      <span>Formato internacional registrado:</span>
                      <span className="font-mono text-emerald-400 font-bold bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        {phoneNumber.trim() ? getFullInternationalPhone() : `${effectivePrefix} [tu número]`}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      DHL / FedEx / Correos Internacional
                    </span>
                  </div>
                </div>

                {/* Email de Confirmación */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Email de confirmación y factura *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej: carlos@gmail.com"
                    value={customer.email}
                    onChange={(e) => {
                      setCustomer({ ...customer, email: e.target.value });
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Dirección Completa */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Dirección (Calle, Número, Piso, Puerta o Apartamento) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Calle Gran Vía 28, 3º B"
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Código Postal (ZIP / Postcode) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 28013 o código postal"
                    value={customer.postalCode}
                    onChange={(e) => {
                      setCustomer({ ...customer, postalCode: e.target.value });
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Ciudad / Población */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Ciudad / Población *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Madrid, París, Ciudad de México..."
                    value={customer.city}
                    onChange={(e) => {
                      setCustomer({ ...customer, city: e.target.value });
                      if (detailsError) setDetailsError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-neutral-400 hover:text-white transition"
              >
                Seguir comprando
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-98 shadow-md shadow-emerald-950/40"
              >
                <span>Continuar al Pago • {totalAmount.toFixed(2)} €</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Legal Notice */}
            {onOpenLegal && (
              <div className="pt-2 text-center text-[11px] text-neutral-500">
                <span>Al realizar el pedido aceptas los </span>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Términos y Condiciones
                </button>
                <span>, la </span>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Política de Privacidad
                </button>
                <span> y las </span>
                <button
                  type="button"
                  onClick={() => onOpenLegal('returns')}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Política de Devoluciones (Solo por Calidad)
                </button>
                <span>.</span>
              </div>
            )}
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: MÉTODOS DE PAGO (PAYPAL, CRYPTO, TARJETA)                          */}
        {/* ========================================================================= */}
        {step === 'payment' && (
          <div className="p-6 space-y-6">
            {/* Amount to pay banner with detailed breakdown */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 to-neutral-900 p-4 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-300">Total a pagar:</span>
                  <div className="font-mono text-2xl font-black text-emerald-400">
                    {totalAmount.toFixed(2)} €
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-400">
                  <span className="font-semibold text-neutral-200">Destinatario: {customer.name}</span>
                  <span className="block text-[11px] text-neutral-400">{customer.city}, {customer.country}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between border-t border-neutral-800/80 pt-2 text-[11px] text-neutral-400 gap-2">
                <span>Subtotal ({totalItemsCount} prendas): <strong className="text-neutral-200">{subtotal.toFixed(2)} €</strong></span>
                <span>
                  Gastos de Envío:{' '}
                  <strong className={shippingInfo.isFree ? 'text-emerald-400' : 'text-amber-300'}>
                    {shippingInfo.badge}
                  </strong>
                </span>
              </div>
            </div>

            {/* Payment method selector tabs */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                Selecciona método de pago seguro:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Card Tab (Stripe) */}
                {paymentSettings.acceptCard && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300 font-bold ring-2 ring-emerald-400/20 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mb-1 text-emerald-400" />
                    <span className="font-black text-xs sm:text-sm">Tarjeta</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">Visa • MC • Apple Pay</span>
                  </button>
                )}

                {/* Klarna Tab */}
                {paymentSettings.klarnaEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('klarna')}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition ${
                      paymentMethod === 'klarna'
                        ? 'bg-[#FFB3C7]/15 border-[#FFB3C7] text-[#FFB3C7] font-bold ring-2 ring-[#FFB3C7]/20 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-xs text-[#FFB3C7] mb-1">Klarna.</span>
                    <span className="font-black text-xs sm:text-sm">3 Plazos</span>
                    <span className="text-[10px] text-[#FFB3C7]/80 font-normal">Sin intereses (0% TAE)</span>
                  </button>
                )}



                {/* PayPal Tab */}
                {paymentSettings.acceptPaypal && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition ${
                      paymentMethod === 'paypal'
                        ? 'bg-blue-950/40 border-blue-400 text-blue-300 font-bold ring-2 ring-blue-400/20 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <Wallet className="h-5 w-5 mb-1 text-blue-400" />
                    <span className="font-black text-xs sm:text-sm">PayPal</span>
                    <span className="text-[10px] text-blue-400/80 font-normal">Protección oficial</span>
                  </button>
                )}

                {/* Crypto Tab */}
                {true && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition ${
                      paymentMethod === 'crypto'
                        ? 'bg-amber-950/40 border-amber-400 text-amber-300 font-bold ring-2 ring-amber-400/20 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <Coins className="h-5 w-5 mb-1 text-amber-400" />
                    <span className="font-black text-xs sm:text-sm">Crypto</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">USDT / BTC</span>
                  </button>
                )}
              </div>
            </div>
{/* SELECTOR DE MÉTODO DE PAGO */}
<div className="grid grid-cols-2 gap-2 mb-4">
  <button
    type="button"
    onClick={() => setPaymentMethod('paypal')}
    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
      paymentMethod === 'paypal'
        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
    }`}
  >
    <span>PayPal</span>
  </button>
  <button
    type="button"
    onClick={() => setPaymentMethod('crypto')}
    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
      paymentMethod === 'crypto'
        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
    }`}
  >
    <Coins className="h-3.5 w-3.5" />
    <span>Criptomonedas</span>
  </button>
</div>
            {/* PAYMENT CONTENT 1: PAYPAL */}
            {paymentMethod === 'paypal' && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-blue-400 animate-pulse"></span>
                    <span className="font-bold text-white text-sm">
                      Pago Oficial con PayPal
                    </span>
                  </div>
                  <span className="rounded bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30">
                    Instantáneo & Seguro
                  </span>
                </div>

                <div className="space-y-3 rounded-xl bg-neutral-950/90 p-4 border border-neutral-800">
                  {/* Store PayPal Account */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">
                        Cuenta PayPal del vendedor:
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm sm:text-base font-black tracking-wide text-blue-300 select-all">
                          {paypalEmail}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPaypal}
                      className="flex items-center gap-1 rounded-xl bg-blue-500/20 px-3 py-1.5 font-bold text-blue-300 border border-blue-500/30 hover:bg-blue-500 hover:text-neutral-950 transition"
                    >
                      {copiedPaypal ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPaypal ? '¡Copiado!' : 'Copiar Correo'}</span>
                    </button>
                  </div>

                  {/* Concept Reference */}
                  <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">
                        Referencia obligatoria para la nota de PayPal:
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {currentOrderId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOrderRef}
                      className="flex items-center gap-1 rounded-xl bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                    >
                      {copiedOrderCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedOrderCode ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-[11px] text-neutral-300 space-y-1 pl-1">
                  <p>1. Entra a <strong>PayPal</strong> o abre tu aplicación.</p>
                  <p>2. Envía <strong>{totalAmount.toFixed(2)} €</strong> a <strong>{paypalEmail}</strong>.</p>
                  <p>3. En el concepto pon tu código <strong>{currentOrderId}</strong>.</p>
                </div>

                {/* Direct PayPal Link Button */}
                {paypalMeUsername ? (
                  <a
                    href={`https://paypal.me/${paypalMeUsername}/${totalAmount.toFixed(2)}EUR`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white font-black hover:bg-blue-500 transition text-center shadow-md shadow-blue-950/40"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Pagar Directamente en PayPal.Me ({totalAmount.toFixed(2)} €)</span>
                  </a>
                ) : (
                  <a
                    href="https://www.paypal.com/myaccount/transfer/homepage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/30 border border-blue-500/40 p-2.5 text-blue-200 font-bold hover:bg-blue-600/50 transition text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Abrir PayPal para Enviar {totalAmount.toFixed(2)} €</span>
                  </a>
                )}

                {/* Customer PayPal email verification */}
                <div>
                  <label className="block text-[11px] text-neutral-300 mb-1 font-medium">
                    Tu correo de PayPal o nombre con el que pagaste:
                  </label>
                  <input
                    type="text"
                    placeholder={customer.email || 'tu-paypal@email.com'}
                    value={customerPaypalEmail}
                    onChange={(e) => setCustomerPaypalEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmOrder('paypal')}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3 text-xs sm:text-sm font-black text-neutral-950 hover:bg-blue-400 transition active:scale-98 shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>He Realizado el Pago con PayPal • Confirmar Pedido</span>
                </button>
              </div>
            )}

            {/* PAYMENT CONTENT 2: CRYPTO */}
            {paymentMethod === 'crypto' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">
                      Pago con Criptomonedas (Web3)
                    </span>
                  </div>
                  <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                    Sin comisiones bancarias
                  </span>
                </div>

                {/* Crypto selector buttons */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs text-neutral-300">
                  Serás redirigido a la pasarela segura de <strong className="text-amber-400">NOWPayments</strong> para completar tu pago con <strong>Solana, Litecoin, USDT, Bitcoin, Ethereum</strong> o cualquier otra criptomoneda disponible.
                </p>
                <div className="flex justify-between items-center border-t border-neutral-800 pt-2 text-xs">
                  <span className="text-neutral-400">Total a pagar:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{totalAmount.toFixed(2)} €</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCryptoPayment}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3 text-xs sm:text-sm font-bold text-black transition-colors shadow-lg shadow-amber-500/10"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Pagar {totalAmount.toFixed(2)} € con Criptomonedas (NOWPayments)</span>
              </button>
            </div>
          )}

          {/* PAYMENT CONTENT: KLARNA */}
            {paymentMethod === 'klarna' && (
              <div className="rounded-2xl border border-[#FFB3C7]/40 bg-[#FFB3C7]/10 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#FFB3C7] text-neutral-950 px-2 py-0.5 font-black text-xs">
                      Klarna.
                    </span>
                    <span className="font-bold text-white text-sm">
                      Paga en 3 plazos sin intereses
                    </span>
                  </div>
                  <span className="rounded bg-[#FFB3C7]/20 px-2 py-0.5 text-[10px] font-bold text-[#FFB3C7] border border-[#FFB3C7]/30">
                    0% TAE • Sin Intereses
                  </span>
                </div>

                <div className="rounded-xl bg-neutral-950/90 p-4 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>1º pago (hoy al tramitar):</span>
                    <strong className="font-mono text-white text-sm">{(totalAmount / 3).toFixed(2)} €</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2">
                    <span>2º pago (a los 30 días):</span>
                    <span className="font-mono text-neutral-300">{(totalAmount / 3).toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2">
                    <span>3º pago (a los 60 días):</span>
                    <span className="font-mono text-neutral-300">{(totalAmount / 3).toFixed(2)} €</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-300 space-y-1 pl-1">
                  <p>• Sin comisiones ni intereses ocultos.</p>
                  <p>• Aprobación en segundos directamente a través de Klarna.</p>
                  <p>• Cobertura completa con la Protección al Comprador oficial de Klarna.</p>
                </div>

                <button
                  type="button"
                  disabled={isConnectingGateway}
                  onClick={() => handleStripeOrKlarnaCheckout('klarna')}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FFB3C7] py-3.5 text-xs sm:text-sm font-black text-neutral-950 hover:bg-[#ffa0b8] transition active:scale-98 shadow-md"
                >
                  {isConnectingGateway ? (
                    <>
                      <div className="h-4 w-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Conectando con Klarna Seguro...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Continuar con Klarna • {(totalAmount / 3).toFixed(2)} €/mes</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* PAYMENT CONTENT 4: TARJETA BANCARIA */}
            {paymentMethod === 'card' && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">
                      Pago Seguro con Tarjeta & Pasarela Oficial
                    </span>
                  </div>
                  <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                    Visa / Mastercard / Apple Pay
                  </span>
                </div>

                {/* Primary Button: Stripe Checkout */}
                <button
                  type="button"
                  disabled={isConnectingGateway}
                  onClick={() => handleStripeOrKlarnaCheckout('card')}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs sm:text-sm font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-98 shadow-lg shadow-emerald-950/40"
                >
                  {isConnectingGateway ? (
                    <>
                      <div className="h-4 w-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Conectando con Pasarela Segura...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Pagar {totalAmount.toFixed(2)} € con Tarjeta (Stripe Checkout)</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">o pago directo en esta pantalla</span>
                  <div className="flex-grow border-t border-neutral-800"></div>
                </div>

                <div className="space-y-3 rounded-xl bg-neutral-950/80 p-4 border border-neutral-800">
                  <div>
                    <label className="block text-[11px] text-neutral-300 mb-1">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4500 •••• •••• 1234"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-300 mb-1">
                        Caducidad (MM/AA)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-300 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-300 mb-1">
                      Nombre del Titular en la Tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder={customer.name || 'JUAN PÉREZ'}
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs uppercase text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingCard}
                    onClick={() => handleConfirmOrder('card')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-800 py-2.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition mt-2"
                  >
                    {isProcessingCard ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verificando tarjeta...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Confirmar Pago con Esta Tarjeta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a cambiar datos de envío</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: CONFIRMACIÓN Y RECIBO DE COMPRA                                    */}
        {/* ========================================================================= */}
        {step === 'confirmation' && completedOrder && (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                ¡Muchas Gracias por tu Compra, {completedOrder.customer.name.split(' ')[0]}!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Tu pedido ha sido registrado con éxito y preparado para expedición inmediata.
              </p>
            </div>

            {/* Order Receipt Box */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-5 text-left text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Número de Pedido:</span>
                  <span className="font-mono text-base font-black text-emerald-400">
                    {completedOrder.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400 block">Fecha:</span>
                  <span className="text-neutral-300">{completedOrder.date}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Artículos:
                </span>
                {completedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-neutral-300">
                    <span>
                      {item.quantity}x {item.product.title} ({item.selectedEdition || 'FAN VERSION'} • Talla {item.selectedSize})
                      {item.customization?.number && ` • Dorsal: #${item.customization.number} ${item.customization.name || ''}`}
                      {item.customization?.patch && ` • Parche: ${item.customization.patch}`}
                    </span>
                    <span className="font-mono text-white">
                      {((item.product.price || 24.99) * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals & Payment Method */}
              <div className="border-t border-neutral-800 pt-3 space-y-1 text-neutral-300">
                <div className="flex justify-between">
                  <span>Envío ({completedOrder.customer.country || 'Destino'}):</span>
                  <span className={completedOrder.shippingCost === 0 ? 'text-emerald-400 font-bold' : 'font-bold'}>
                    {completedOrder.shippingCost === 0 ? 'GRATIS (Promoción 3+ prendas)' : `${completedOrder.shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white">
                  <span>Total Pagado:</span>
                  <span className="font-mono text-emerald-400">{completedOrder.total.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 pt-1">
                  <span>Método de pago: {completedOrder.paymentMethod.toUpperCase()} {completedOrder.cryptoCurrency && `(${completedOrder.cryptoCurrency})`}</span>
                  <span className="text-emerald-400 font-semibold">{completedOrder.estimatedDelivery}</span>
                </div>
              </div>

              {/* Address */}
              <div className="border-t border-neutral-800 pt-3 text-[11px] text-neutral-400">
                <span className="font-bold text-neutral-300 block mb-0.5">Dirección de entrega internacional:</span>
                <p>{completedOrder.customer.address}, {completedOrder.customer.postalCode} {completedOrder.customer.city} ({completedOrder.customer.country || 'Internacional'})</p>
                <p className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-neutral-300">Teléfono con prefijo para el transportista:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {completedOrder.customer.phone}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition"
              >
                Seguir Explorando la Tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
