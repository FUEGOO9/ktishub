import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Truck, 
  Flame,
  CreditCard,
  Shirt,
  Zap,
  Hash,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Tag,
  Percent,
  Ruler
} from 'lucide-react';
import { Product, JerseyEdition } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';
import { evaluateDiscount, DiscountResult } from '../utils/discounts';
import { SizeGuideModal } from './SizeGuideModal';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  isAdminMode?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onAddToCart: (
    product: Product, 
    size: string, 
    edition: JerseyEdition,
    customization?: { name?: string; number?: string; patch?: string; dorsalMode?: 'none' | 'player' | 'custom' },
    discountInfo?: { code?: string; discountPercent?: number; discountAmount?: number; originalPrice?: number }
  ) => void;
  onBuyNow: (
    product: Product, 
    size: string, 
    edition: JerseyEdition,
    customization?: { name?: string; number?: string; patch?: string; dorsalMode?: 'none' | 'player' | 'custom' },
    discountInfo?: { code?: string; discountPercent?: number; discountAmount?: number; originalPrice?: number }
  ) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  isAdminMode = false,
  onEdit,
  onDelete,
  onAddToCart,
  onBuyNow,
}) => {
  // Always call all hooks unconditionally
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedEdition, setSelectedEdition] = useState<JerseyEdition>('FAN VERSION');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  
  // Dorsal Mode: 'none' | 'custom'
  const [dorsalMode, setDorsalMode] = useState<'none' | 'custom'>('none');
  const [customName, setCustomName] = useState<string>('');
  const [customNumber, setCustomNumber] = useState<string>('10');
  const [selectedPatch, setSelectedPatch] = useState<string>('');
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountResult | null>(null);
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);

  // Collect all photos for gallery (includes HD and detail angle views for Yupoo images)
  const productImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.imageUrl) list.push(product.imageUrl);
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }

    // Generate resolution & angle variants for Yupoo photos so every product has multiple selectable gallery views
    const currentList = [...list];
    currentList.forEach((img) => {
      if (img.includes('yupoo.com')) {
        let v1 = '';
        let v2 = '';
        if (img.includes('/small.')) {
          v1 = img.replace('/small.', '/medium.');
          v2 = img.replace('/small.', '/big.');
        } else if (img.includes('/medium.')) {
          v1 = img.replace('/medium.', '/small.');
          v2 = img.replace('/medium.', '/big.');
        } else if (img.includes('/big.')) {
          v1 = img.replace('/big.', '/medium.');
          v2 = img.replace('/big.', '/small.');
        }
        if (v1 && !list.includes(v1)) list.push(v1);
        if (v2 && !list.includes(v2)) list.push(v2);
      }
    });

    return list;
  }, [product]);

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      const sizes = product.availableSizes && product.availableSizes.length > 0 
        ? product.availableSizes 
        : ['S', 'M', 'L', 'XL', '2XL'];
      setSelectedSize(sizes[0] || 'M');
      setSelectedEdition('FAN VERSION');
      if (product.player) {
        setDorsalMode('custom');
        const parts = product.player.split('#');
        setCustomName(parts[0]?.trim().toUpperCase() || '');
        setCustomNumber(parts[1]?.trim() || '10');
      } else {
        setDorsalMode('none');
        setCustomName('');
        setCustomNumber('10');
      }
      setSelectedPatch('');
      setSelectedImageIdx(0);
      setIsConfirmingDelete(false);
      setDiscountCodeInput('');
      setAppliedDiscount(null);
      setDiscountFeedback(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const defaultSizes = product.availableSizes && product.availableSizes.length > 0 
    ? product.availableSizes 
    : ['S', 'M', 'L', 'XL', '2XL'];

  // Price calculations - Parches a 0€ (GRATIS)
  const isRetroProduct = Boolean(
    product.section === 'Retro' ||
    product.sections?.includes('Retro') ||
    /\b(retro|vintage|clasic[oa]|classic)\b/i.test(product.title) ||
    (/\b(19\d\d|200[0-9]|201[0-2])\b/.test(product.title) && !/\b(202[0-9]|\d\d\/\d\d)\b/.test(product.title))
  );
  const basePrice = product.price > 0 ? product.price : (isRetroProduct ? 19.99 : 12.99);
  const playerExtraPrice = product.playerVersionExtraPrice !== undefined ? product.playerVersionExtraPrice : 2.0;
  const dorsalExtraPrice = product.dorsalExtraPrice !== undefined ? product.dorsalExtraPrice : 2.0;
  const playerEditionExtra = (!isRetroProduct && selectedEdition === 'PLAYER VERSION') ? playerExtraPrice : 0;
  const dorsalPrice = dorsalMode !== 'none' ? dorsalExtraPrice : 0;
  const patchPrice = 0; // Parches a 0€
  const rawTotalPrice = basePrice + playerEditionExtra + dorsalPrice + patchPrice;

  // Calculate discount if applied
  const currentDiscount = appliedDiscount && appliedDiscount.isValid
    ? evaluateDiscount(rawTotalPrice, appliedDiscount.code)
    : null;

  const finalTotalPrice = currentDiscount ? currentDiscount.finalPrice : rawTotalPrice;
  const savingsAmount = currentDiscount ? currentDiscount.discountAmount : 0;

  const handleApplyDiscount = (codeToApply?: string) => {
    const code = (codeToApply || discountCodeInput).trim().toUpperCase();
    if (!code) {
      setAppliedDiscount(null);
      setDiscountFeedback(null);
      return;
    }

    const res = evaluateDiscount(rawTotalPrice, code);
    if (res.isValid) {
      setAppliedDiscount(res);
      setDiscountCodeInput(res.code);
      setDiscountFeedback(`✅ ${res.message}`);
    } else {
      setAppliedDiscount(null);
      setDiscountFeedback('❌ Código no válido o caducado.');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    setDiscountFeedback(null);
  };

  // Active Dorsal text for order
  const activeDorsalName = dorsalMode === 'none' ? undefined : customName.trim().toUpperCase();
  const activeDorsalNumber = dorsalMode === 'none' ? undefined : customNumber.trim();

  const getDiscountPayload = () => {
    if (currentDiscount && currentDiscount.isValid) {
      return {
        code: currentDiscount.code,
        discountPercent: currentDiscount.percentage,
        discountAmount: currentDiscount.discountAmount,
        originalPrice: rawTotalPrice,
      };
    }
    return undefined;
  };

  const handleAdd = () => {
    const customization = dorsalMode !== 'none' || selectedPatch
      ? {
          name: activeDorsalName,
          number: activeDorsalNumber,
          patch: selectedPatch || undefined,
          dorsalMode,
        }
      : undefined;

    onAddToCart(product, selectedSize, selectedEdition, customization, getDiscountPayload());
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 900);
  };

  const handleDirectBuy = () => {
    const customization = dorsalMode !== 'none' || selectedPatch
      ? {
          name: activeDorsalName,
          number: activeDorsalNumber,
          patch: selectedPatch || undefined,
          dorsalMode,
        }
      : undefined;

    onBuyNow(product, selectedSize, selectedEdition, customization, getDiscountPayload());
  };

  const currentDisplayImage = productImages[selectedImageIdx] || product.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-neutral-950/80 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
          {/* Left Column (5 cols): Visual Real Product Photo Showcase */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center group shadow-inner">
              {currentDisplayImage ? (
                <img
                  src={getProductImageUrl(currentDisplayImage)}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
                  <Shirt className="h-20 w-20 stroke-[1.2] text-neutral-600 mb-2" />
                  <span className="text-sm font-semibold">{product.title}</span>
                </div>
              )}

              {/* Gallery navigation if multiple images */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIdx((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-neutral-950/80 p-1.5 text-white hover:bg-neutral-800 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIdx((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-neutral-950/80 p-1.5 text-white hover:bg-neutral-800 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Badges on photo */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                {(product.section === 'Populares' || product.isPopular) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black text-neutral-950 shadow-md">
                    <Flame className="h-3 w-3 fill-current" />
                    MÁS POPULAR
                  </span>
                )}
                {product.isRetro && product.section !== 'Populares' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-1 text-[10px] font-bold text-neutral-200 border border-neutral-700 shadow-md">
                    EDICIÓN RETRO
                  </span>
                )}
              </div>

              {/* Selected Edition badge on photo */}
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <span className="rounded-lg bg-neutral-950/90 px-2.5 py-1 text-[10px] font-black uppercase text-amber-400 border border-amber-500/40 backdrop-blur-md shadow-md">
                  {selectedEdition}
                </span>
              </div>
            </div>

            {/* Thumbnail Gallery (if multiple photos) */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-neutral-950 p-1 transition ${
                      selectedImageIdx === idx
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getProductImageUrl(img)}
                      alt={`Vista ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
              <div className="flex items-center gap-2 rounded-xl bg-neutral-950/60 p-2.5 border border-neutral-800/80">
                <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Envío asegurado con tracking</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-950/60 p-2.5 border border-neutral-800/80">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Pago PayPal, Cripto y Tarjeta</span>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Configuration & Selectors */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
            <div>
              {/* Category, Team & Season */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
                {(product.sections && product.sections.length > 0 ? product.sections : [product.section]).map((sec) => (
                  <span key={sec} className="rounded-md bg-neutral-800 px-2 py-0.5 font-bold text-emerald-300 border border-neutral-700">
                    {sec}
                  </span>
                ))}
                {product.team && (
                  <span className="font-semibold text-white">
                    • {product.team}
                  </span>
                )}
                {product.season && (
                  <span className="text-neutral-400">
                    • Temporada {product.season}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="mt-1 text-base sm:text-lg font-black text-white leading-snug">
                {product.title}
              </h2>

              {/* Dynamic Price Banner */}
              <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                {currentDiscount ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                      {finalTotalPrice.toFixed(2)} €
                    </span>
                    <span className="font-mono text-sm sm:text-base text-neutral-500 line-through">
                      {rawTotalPrice.toFixed(2)} €
                    </span>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-black text-emerald-300">
                      -{currentDiscount.percentage}% con {currentDiscount.code}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {rawTotalPrice.toFixed(2)} €
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>IVA incluido</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Envío GRATIS desde 3 unidades (7€ UE / 4€ Fuera UE)</span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 1. SELECCIÓN DE VERSIÓN: FAN VERSION o PLAYER VERSION (EXCLUYENDO RETRO)  */}
              {/* ========================================================================= */}
              {!isRetroProduct ? (
                <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Shirt className="h-4 w-4 text-emerald-400" />
                      Versión de la Camiseta:
                    </span>
                    <span className="text-[11px] text-neutral-400">Elige acabado y corte</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* FAN VERSION */}
                    <button
                      type="button"
                      onClick={() => setSelectedEdition('FAN VERSION')}
                      className={`relative flex flex-col text-left p-2.5 rounded-2xl border transition ${
                        selectedEdition === 'FAN VERSION'
                          ? 'bg-neutral-800/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-white">FAN VERSION</span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                            TALLA EU
                          </span>
                        </div>
                        {selectedEdition === 'FAN VERSION' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-300 leading-tight">
                        {product.fanVersionDescription || 'Corte regular aficionado, escudos bordados de alta definición y tejido transpirable.'}
                      </p>
                      <span className="mt-1 text-[10px] font-bold text-emerald-400">
                        Talla Estándar Europea (Sin coste extra)
                      </span>
                    </button>

                    {/* PLAYER VERSION */}
                    <button
                      type="button"
                      onClick={() => setSelectedEdition('PLAYER VERSION')}
                      className={`relative flex flex-col text-left p-2.5 rounded-2xl border transition ${
                        selectedEdition === 'PLAYER VERSION'
                          ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-amber-300 flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 fill-current" />
                            PLAYER VERSION
                          </span>
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                            Match Fit Pro
                          </span>
                        </div>
                        {selectedEdition === 'PLAYER VERSION' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-neutral-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-300 leading-tight">
                        {product.playerVersionDescription || 'Corte entallado pro match, detalles termosellados en 3D y máxima ligereza como la de los jugadores.'}
                      </p>
                      <span className="mt-1 text-[10px] font-bold text-amber-400">
                        {playerExtraPrice === 0 ? 'GRATIS (0.00 €)' : `+${playerExtraPrice.toFixed(2)} € (dorsal) PLAYER VERSION`}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm">
                        ⏳
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-300">Edición Retro Clásica</p>
                        <p className="text-[11px] text-neutral-300">Confección clásica con escudos bordados de época y corte regular fit.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap">
                      19.99 €
                    </span>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. TALLAS DISPONIBLES                                                     */}
              {/* ========================================================================= */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase tracking-wider">
                      Selecciona Talla
                    </span>
                    {/* Botón discreto donde las tallas para las PLAYER version */}
                    {selectedEdition === 'PLAYER VERSION' ? (
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-lg border border-amber-500/40 transition shadow-sm"
                        title="Ver medidas y tabla oficial Player Version"
                      >
                        <Ruler className="h-3 w-3 text-amber-400" />
                        <span>Guía de tallas (Player)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-300 bg-neutral-900 hover:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-800 transition"
                        title="Ver tabla y guía de tallas"
                      >
                        <Ruler className="h-3 w-3" />
                        <span>Guía de tallas</span>
                      </button>
                    )}
                  </div>
                  <span className="text-neutral-400 text-[11px]">
                    {selectedEdition === 'PLAYER VERSION' ? 'Player: Aconsejamos 1 talla más' : 'Fan: Talla europea habitual'}
                  </span>
                </div>

                {selectedEdition === 'PLAYER VERSION' && (
                  <div className="mb-2 flex items-center justify-between px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <span>⚠️ <strong>Corte ceñido pro match:</strong> pide 1 talla más para llevarla cómoda.</span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="underline font-bold text-amber-400 hover:text-amber-200 ml-2 shrink-0"
                    >
                      Medidas en cm
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {defaultSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-9 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                        selectedSize === size
                          ? 'bg-emerald-500 text-neutral-950 ring-2 ring-emerald-400 shadow-md'
                          : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. DORSAL: SIN DORSAL O PERSONALIZADO CON NOMBRE Y NÚMERO                 */}
              {/* ========================================================================= */}
              <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3.5 text-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">
                        Dorsal & Serigrafía Oficial
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Elige camiseta lisa o pon tu nombre y número preferido
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400 text-[11px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                    {dorsalMode === 'none' ? '+0.00 €' : dorsalExtraPrice === 0 ? 'GRATIS (0.00 €)' : `+${dorsalExtraPrice.toFixed(2)} €`}
                  </span>
                </div>

                {/* Segmented Control: Sin Dorsal | Con Dorsal Personalizado */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-900 p-1 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setDorsalMode('none')}
                    className={`rounded-lg py-2 text-xs font-bold transition text-center ${
                      dorsalMode === 'none'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Sin Dorsal (Lisa)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDorsalMode('custom')}
                    className={`rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      dorsalMode === 'custom'
                        ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    <span>Con Dorsal (Nombre & Número)</span>
                  </button>
                </div>

                {/* Sub-Panel: Personalizar Nombre & Número */}
                {dorsalMode === 'custom' && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] text-neutral-400 font-medium mb-1">
                          NOMBRE O APELLIDO A ESTAMPAR
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="Ej: MBAPPÉ / TU NOMBRE"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs uppercase font-mono font-bold text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-medium mb-1">
                          NÚMERO
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          placeholder="10"
                          value={customNumber}
                          onChange={(e) => setCustomNumber(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-mono font-bold text-center text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Parches Oficiales (a 0€ / GRATIS) */}
                {product.badgeOptions && product.badgeOptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] text-neutral-400 font-medium">
                        PARCHES OFICIALES EN LA MANGA
                      </label>
                      <span className="text-[10px] font-bold text-emerald-400">
                        GRATIS (0.00 €)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPatch('')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedPatch === ''
                            ? 'bg-neutral-200 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        Sin parche
                      </button>
                      {product.badgeOptions.map((patch) => (
                        <button
                          key={patch}
                          type="button"
                          onClick={() => setSelectedPatch(patch)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                            selectedPatch === patch
                              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          ✓ {patch} (0€)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 4. CÓDIGO DE DESCUENTO / CUPÓN EN CADA PRODUCTO                           */}
              {/* ========================================================================= */}
              <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-3.5 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    <span className="font-bold text-white">¿Tienes un Código de Descuento?</span>
                  </div>
                  {currentDiscount && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/40">
                      Ahorras {savingsAmount.toFixed(2)} €
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Código promocional..."
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyDiscount();
                        }
                      }}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyDiscount()}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-neutral-950 hover:bg-amber-400 transition active:scale-95 shadow"
                  >
                    Aplicar
                  </button>
                  {currentDiscount && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="rounded-xl border border-neutral-700 bg-neutral-800 px-2.5 py-2 text-xs text-neutral-400 hover:text-white transition"
                      title="Quitar descuento"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Feedback message */}
                {discountFeedback && (
                  <p className="mt-2 text-[11px] font-medium text-emerald-400">
                    {discountFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={addedAnimation}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition active:scale-98 shadow-sm"
                >
                  {addedAnimation ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>¡Añadido a la Cesta!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      <span>Añadir a la Cesta</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectBuy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-98 shadow-lg shadow-emerald-950/50"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Comprar • {finalTotalPrice.toFixed(2)} €</span>
                </button>
              </div>

              {/* Summary note */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 pt-0.5">
                <span>Versión: <strong className="text-neutral-300">{selectedEdition}</strong> • Talla: <strong className="text-neutral-300">{selectedSize}</strong></span>
                <span>Dorsal: <strong className="text-neutral-300">{dorsalMode === 'none' ? 'Sin dorsal' : `#${activeDorsalNumber || '10'} ${activeDorsalName || ''}`}</strong></span>
              </div>

              {/* Admin Mode Bar: Quick Edit & Delete Prenda */}
              {isAdminMode && (
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <span>👑 Panel Vendedor:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEdit(product);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar datos</span>
                      </button>
                    )}

                    {onDelete && (
                      isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(product.id);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-700 transition shadow animate-pulse"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>¿Confirmar eliminar?</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingDelete(false)}
                            className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar del catálogo</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        initialEdition={selectedEdition}
      />
    </div>
  );
};
