import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  Tag, 
  Flame, 
  CreditCard,
  Zap,
  Sparkles,
  Package,
  Video,
  Star,
  Shirt,
  ChevronDown
} from 'lucide-react';
import { Product, JerseyEdition } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';

interface ProductCardProps {
  product: Product;
  isAdminMode?: boolean;
  onAddToCart: (product: Product, size: string, edition?: JerseyEdition) => void;
  onOpenDetail?: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdminMode = false,
  onAddToCart,
  onOpenDetail,
  onEdit,
  onDelete,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.availableSizes?.[0] || 'M'
  );
  const [selectedEdition, setSelectedEdition] = useState<JerseyEdition>('FAN VERSION');
  const [imgError, setImgError] = useState(false);

  const getSectionBadge = (sec: string) => {
    switch (sec) {
      case 'Populares':
        return {
          bg: 'bg-orange-500 text-neutral-950 border-orange-400 font-black',
          label: 'POPULAR 🔥',
          icon: <Flame className="h-3 w-3 fill-current" />
        };
      case 'LaLiga':
        return {
          bg: 'bg-red-600 text-white border-red-500 font-bold',
          label: '🇪🇸 LALIGA',
          icon: null
        };
      case 'Premier League':
        return {
          bg: 'bg-purple-600 text-white border-purple-400 font-bold',
          label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER',
          icon: null
        };
      case 'Ligue 1':
        return {
          bg: 'bg-blue-600 text-white border-blue-400 font-bold',
          label: '🇫🇷 LIGUE 1',
          icon: null
        };
      case 'Serie A':
        return {
          bg: 'bg-cyan-600 text-white border-cyan-400 font-bold',
          label: '🇮🇹 SERIE A',
          icon: null
        };
      case 'Bundesliga':
        return {
          bg: 'bg-amber-500 text-neutral-950 border-amber-400 font-bold',
          label: '🇩🇪 BUNDESLIGA',
          icon: null
        };
      case 'Brasileirão':
        return {
          bg: 'bg-emerald-500 text-neutral-950 border-yellow-400 font-bold',
          label: '🇧🇷 BRASILEIRÃO',
          icon: null
        };
      case 'Liga ARG & Sudamericana':
      case 'Liga Profesional ARG':
        return {
          bg: 'bg-sky-500 text-neutral-950 border-sky-300 font-bold',
          label: '🇦🇷 LIGA ARG & SUDAMERICANA',
          icon: null
        };
      case 'MLS':
        return {
          bg: 'bg-indigo-600 text-white border-indigo-400 font-bold',
          label: '🇺🇸 MLS',
          icon: null
        };
      case 'Primeira Liga':
        return {
          bg: 'bg-emerald-600 text-white border-emerald-400 font-bold',
          label: '🇵🇹 PRIMEIRA',
          icon: null
        };
      case 'Eredivisie':
        return {
          bg: 'bg-orange-600 text-white border-orange-400 font-bold',
          label: '🇳🇱 EREDIVISIE',
          icon: null
        };
      case 'Japon League':
        return {
          bg: 'bg-rose-600 text-white border-rose-400 font-bold',
          label: '🇯🇵 J1 LEAGUE',
          icon: null
        };
      case 'Liga MX':
        return {
          bg: 'bg-teal-600 text-white border-teal-400 font-bold',
          label: '🇲🇽 LIGA MX',
          icon: null
        };
      case 'Mundial 2026':
        return {
          bg: 'bg-amber-400 text-neutral-950 border-amber-300 font-black',
          label: '🏆 MUNDIAL 2026',
          icon: null
        };
      case 'Mundial':
        return {
          bg: 'bg-blue-600 text-white border-blue-400 font-bold',
          label: '🌍 COPA MUNDIAL',
          icon: null
        };
      case 'Liga Escocesa':
        return {
          bg: 'bg-blue-700 text-white border-blue-500 font-bold',
          label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 ESCOCESA',
          icon: null
        };
      case 'Retro':
        return {
          bg: 'bg-neutral-800 text-neutral-200 border-neutral-700 font-bold',
          label: 'RETRO CLÁSICA',
          icon: null
        };
      case 'Temporada 26/27':
        return {
          bg: 'bg-cyan-500 text-neutral-950 border-cyan-400 font-bold',
          label: 'NUEVA 26/27',
          icon: <Sparkles className="h-3 w-3" />
        };
      case 'Temporada 25/26':
        return {
          bg: 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold',
          label: 'TEMPORADA 25/26',
          icon: <Zap className="h-3 w-3 fill-current" />
        };
      case 'Conjuntos Especiales':
        return {
          bg: 'bg-purple-500 text-white border-purple-400 font-bold',
          label: 'PACK ESPECIAL',
          icon: <Package className="h-3 w-3" />
        };
      case 'Unboxing':
        return {
          bg: 'bg-rose-500 text-white border-rose-400 font-bold',
          label: 'UNBOXING & FOTOS',
          icon: <Video className="h-3 w-3" />
        };
      case 'Ropa Entrenamiento & Cortavientos':
        return {
          bg: 'bg-blue-600 text-white border-blue-400 font-bold',
          label: 'ENTRENAMIENTO',
          icon: null
        };
      case 'Ropa de Moda':
        return {
          bg: 'bg-indigo-600 text-white border-indigo-400 font-bold',
          label: 'ROPA DE MODA',
          icon: null
        };
      default:
        return {
          bg: 'bg-neutral-800 text-neutral-200 border-neutral-700 font-bold',
          label: sec,
          icon: null
        };
    }
  };

  const sectionsList = product.sections && product.sections.length > 0
    ? product.sections
    : [product.section];

  const primaryBadge = getSectionBadge(sectionsList[0]);

  const isRetro = Boolean(
    product.section === 'Retro' ||
    product.sections?.includes('Retro') ||
    /\b(retro|vintage|clasic[oa]|classic)\b/i.test(product.title) ||
    (/\b(19\d\d|200[0-9]|201[0-2])\b/.test(product.title) && !/\b(202[0-9]|\d\d\/\d\d)\b/.test(product.title))
  );

  const isCoat = /abrigo|coat|trench|jacket|windbreaker|parka|anorak|down jacket|hoodie|hooded/i.test(product.title);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product.id);
  };

  return (
    <div 
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800/90 bg-neutral-900/80 p-4 transition-all duration-200 hover:border-emerald-500/50 hover:bg-neutral-900 hover:shadow-2xl hover:shadow-black/60 cursor-pointer"
    >
      <div>
        {/* Visual Preview */}
        <div className="relative mb-3.5 aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-center p-2">
          {!imgError && product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-neutral-950 text-neutral-500">
              <Shirt className="h-12 w-12 stroke-[1.5] text-neutral-600 mb-1" />
              <span className="text-xs font-semibold text-neutral-400 line-clamp-1">{product.title}</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[85%] pointer-events-none z-10">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black shadow ${primaryBadge.bg}`}>
              {primaryBadge.icon}
              {primaryBadge.label}
            </span>

            {/* If product belongs to multiple categories, show secondary badge */}
            {sectionsList.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {sectionsList.slice(1, 3).map((sec) => {
                  const secBadge = getSectionBadge(sec);
                  return (
                    <span key={sec} className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold shadow opacity-95 ${secBadge.bg}`}>
                      {secBadge.label}
                    </span>
                  );
                })}
              </div>
            )}

            {product.player && (
              <span className="rounded-md border border-neutral-700/80 bg-neutral-950/85 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md truncate">
                {product.player}
              </span>
            )}

            {isRetro ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-neutral-950/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-md">
                <span>⏳ RETRO CLÁSICA</span>
              </span>
            ) : isCoat ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-neutral-950/90 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 backdrop-blur-md">
                <span>🧥 ABRIGO / CHAQUETA</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-neutral-950/90 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 backdrop-blur-md">
                <span>👕 FAN / ⚡ PLAYER</span>
              </span>
            )}
          </div>

          {/* Management Tools (Edit / Delete) - ONLY in Admin Mode */}
          {isAdminMode && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition z-10"
            >
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950/90 text-neutral-300 hover:bg-neutral-800 hover:text-white transition shadow border border-neutral-800"
                title="Editar datos de la camiseta"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950/90 text-rose-400 hover:bg-rose-950 hover:text-rose-200 transition shadow border border-neutral-800"
                title="Eliminar de la tienda"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}


        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
          {product.title}
        </h3>
      </div>

      {/* Bottom Footer: Price, Version, Sizes & Buy action */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80">
        
        {/* Price Row & Edition Toggle */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-base sm:text-lg font-black text-emerald-400">
              {((product.price || 24.99) + (!isRetro && selectedEdition === 'PLAYER VERSION' ? (product.playerVersionExtraPrice || 2.0) : 0)).toFixed(2)} €
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">IVA inc.</span>
          </div>

          {!isRetro && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]"
            >
              <button
                type="button"
                onClick={() => setSelectedEdition('FAN VERSION')}
                className={`px-1.5 py-0.5 rounded font-bold transition ${
                  selectedEdition === 'FAN VERSION'
                    ? 'bg-neutral-800 text-emerald-300 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Versión aficionado (corte regular)"
              >
                Fan
              </button>
              <button
                type="button"
                onClick={() => setSelectedEdition('PLAYER VERSION')}
                className={`px-1.5 py-0.5 rounded font-bold transition flex items-center gap-0.5 ${
                  selectedEdition === 'PLAYER VERSION'
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-emerald-300'
                }`}
                title="Versión jugador ajustada (+2.00 €)"
              >
                <Zap className="h-2.5 w-2.5" />
                Player
              </button>
            </div>
          )}
        </div>

        {/* Available Sizes selector */}
        {product.availableSizes && product.availableSizes.length > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="mb-2.5 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none"
          >
            <span className="text-[10px] text-neutral-500 shrink-0 font-medium mr-1">Talla:</span>
            {product.availableSizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`h-6 min-w-6 rounded px-1 text-[10px] font-bold transition shrink-0 ${
                  selectedSize === sz
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        )}

        {/* Action Button: Open Detail & Customizer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDetail) onOpenDetail(product);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-950/40"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Ver Prenda & Dorsal</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, selectedSize, selectedEdition);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition"
            title="Añadir a la cesta directamente"
          >
            <CreditCard className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
