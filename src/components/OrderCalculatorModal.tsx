import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Send, Copy, Check, Calculator, Plus, Minus, Euro, CreditCard, ArrowRight, Shirt, Globe } from 'lucide-react';
import { CartItem, calculateShippingInfo } from '../types';

interface OrderCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onUpdateCustomization: (index: number, field: string, val: string) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onUpdateProductPrice?: (productId: string, price: number) => void;
  onOpenCheckout?: () => void;
}

export const OrderCalculatorModal: React.FC<OrderCalculatorModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onUpdateCustomization,
  onRemoveItem,
  onClearCart,
  onUpdateProductPrice,
  onOpenCheckout,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEUSelected, setIsEUSelected] = useState<boolean>(true);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  if (!isOpen) return null;

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalPrice = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 0) * item.quantity,
    0
  );
  const hasUnsetPrices = cartItems.some((i) => !i.product.price || i.product.price === 0);

  const destinationSample = isEUSelected ? 'España' : 'Estados Unidos';
  const shippingInfo = calculateShippingInfo(totalItems, destinationSample);
  const estimatedShipping = totalItems > 0 ? shippingInfo.shippingCost : 0;
  const grandTotal = subtotalPrice + estimatedShipping;

  const generateWhatsAppOrderText = () => {
    let text = `📦 PEDIDO DE CAMISETAS & ROPA (TOTAL: ${totalItems} artículos):\n\n`;
    cartItems.forEach((item, i) => {
      text += `${i + 1}. ${item.product.title}\n`;
      text += `   - Categoría: ${item.product.section}\n`;
      text += `   - Versión: ${item.selectedEdition || 'FAN VERSION'}\n`;
      text += `   - Talla: ${item.selectedSize}\n`;
      text += `   - Cantidad: ${item.quantity}\n`;
      if (item.customization?.name || item.customization?.number) {
        text += `   - Dorsal estampado: #${item.customization.number || '10'} ${item.customization.name || ''}\n`;
      }
      if (item.customization?.patch) {
        text += `   - Parche manga: ${item.customization.patch}\n`;
      }
      text += `   - Precio: ${item.product.price > 0 ? `${(item.product.price * item.quantity).toFixed(2)} €` : 'A consultar'}\n\n`;
    });

    text += `💰 Subtotal: ${subtotalPrice.toFixed(2)} €\n`;
    text += `✈️ Envío (${isEUSelected ? 'Unión Europea' : 'Fuera de UE'}): ${totalItems >= 3 ? 'GRATIS (Promoción 3+ unidades)' : `${estimatedShipping.toFixed(2)} € ${isEUSelected ? '(4€ base + 3€ aranceles UE)' : '(Tarifa fuera UE)'}`}\n`;
    text += `🏷️ TOTAL: ${grandTotal.toFixed(2)} €`;

    return text;
  };

  const handleCopyOrder = () => {
    const text = generateWhatsAppOrderText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">
              Cesta de Pedido ({totalItems} prendas)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <ShoppingBag className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
            <p className="font-bold text-white text-base">Tu cesta está vacía</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Selecciona cualquier camiseta del catálogo, elige talla y dorsal, y añádela para calcular totales y pagar.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Free shipping banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span>
                  ✨ <strong>Envío GRATIS</strong> a partir de <strong>3 camisetas</strong> en el pedido.
                </span>
                <p className="text-[11px] text-neutral-400">
                  Menos de 3: <strong>7,00 € en la UE</strong> (incluye nuevos aranceles) / <strong>4,00 € fuera de la UE</strong>.
                </p>
              </div>
              <span className={`font-black px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${
                totalItems >= 3 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {totalItems >= 3 ? '¡Envío GRATIS Aplicado!' : `Añade ${3 - totalItems} más para Envío Gratis`}
              </span>
            </div>

            {/* Region Selector for Estimation */}
            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                Destino del Envío:
              </span>
              <div className="flex items-center gap-1.5 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEUSelected(true)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    isEUSelected
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🇪🇺 Unión Europea
                </button>
                <button
                  type="button"
                  onClick={() => setIsEUSelected(false)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    !isEUSelected
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🌍 Fuera de UE
                </button>
              </div>
            </div>

            {/* List of items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white line-clamp-1">
                          {item.product.title}
                        </span>
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/30 text-[10px]">
                          Talla {item.selectedSize}
                        </span>
                        {item.selectedEdition && (
                          <span className={`rounded-md px-2 py-0.5 font-black text-[10px] ${
                            item.selectedEdition === 'PLAYER VERSION'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}>
                            {item.selectedEdition}
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-400 text-[11px] block mt-1">
                        {item.product.section} •{' '}
                        {item.product.price > 0 ? (
                          `${item.product.price.toFixed(2)} € / ud`
                        ) : (
                          <span className="text-amber-400">24.99 €</span>
                        )}
                        {item.discountCode && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold">
                            Cupón: {item.discountCode} (-{item.discountPercent || 20}%)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, -1)}
                          className="h-8 w-8 flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white active:scale-95 transition"
                          title="Restar 1 prenda"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2 font-mono font-bold text-white min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, 1)}
                          className="h-8 w-8 flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white active:scale-95 transition"
                          title="Sumar 1 prenda"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-mono font-black text-emerald-400 text-xs">
                        {item.product.price > 0 ? `${(item.product.price * item.quantity).toFixed(2)} €` : '-'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-400 hover:bg-rose-600 hover:text-white transition shadow-sm"
                        title="Quitar camiseta de la cesta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customization Details Display & Quick Edit */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-800/80 pt-2 text-[11px]">
                    <span className="text-neutral-400 font-medium">Dorsal / Serigrafía:</span>
                    <input
                      type="text"
                      placeholder="Nº"
                      value={item.customization?.number || ''}
                      onChange={(e) =>
                        onUpdateCustomization(index, 'number', e.target.value)
                      }
                      className="w-14 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-center font-mono font-bold text-white placeholder-neutral-500"
                    />
                    <input
                      type="text"
                      placeholder="Nombre Estampado"
                      value={item.customization?.name || ''}
                      onChange={(e) =>
                        onUpdateCustomization(index, 'name', e.target.value.toUpperCase())
                      }
                      className="w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-0.5 uppercase font-mono font-bold text-white placeholder-neutral-500"
                    />
                    {item.customization?.patch && (
                      <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                        Parche: {item.customization.patch}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Summary */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Subtotal ({totalItems} camisetas):</span>
                <span className="font-mono font-black text-white text-sm">
                  {subtotalPrice.toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span>Gastos de Envío ({isEUSelected ? 'UE' : 'Fuera UE'}):</span>
                  {!shippingInfo.isFree && isEUSelected && (
                    <span className="text-[10px] text-amber-400/90 font-medium">(4€ base + 3€ aranceles)</span>
                  )}
                </span>
                <span className="font-mono font-bold">
                  {shippingInfo.isFree ? (
                    <span className="text-emerald-400">GRATIS (3+ uds)</span>
                  ) : (
                    <span className={isEUSelected ? 'text-amber-300' : 'text-neutral-200'}>
                      {estimatedShipping.toFixed(2)} €
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800 pt-2 text-sm font-black text-emerald-400">
                <span>Total a Pagar:</span>
                <span className="font-mono text-lg">{grandTotal.toFixed(2)} €</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-neutral-500 hover:text-rose-400 transition"
              >
                Vaciar cesta
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOrder}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-300">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar Resumen</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generateWhatsAppOrderText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Pedir por WhatsApp</span>
                </a>

                {onOpenCheckout && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCheckout();
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-950/40"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pagar Directamente ({grandTotal.toFixed(2)} €)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
