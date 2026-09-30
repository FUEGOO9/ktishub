import React from 'react';
import { 
  Shirt, 
  Plus, 
  UploadCloud, 
  ShoppingBag, 
  Flame, 
  CreditCard,
  Sparkles,
  Package,
  Video,
  Wind,
  Star,
  Search,
  X,
  Wallet,
  Tag,
  Lock,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { CatalogSection } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  productCount: number;
  cartCount: number;
  cartTotal: number;
  ordersCount?: number;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenAddModal: () => void;
  onOpenOrders?: () => void;
  onOpenCart: () => void;
  onOpenCheckout: () => void;
  onOpenPaymentSettings?: () => void;
  onOpenCoupons?: () => void;
  onSelectSection: (section: CatalogSection) => void;
  activeSection: CatalogSection;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
}

const CATEGORY_ITEMS: { label: CatalogSection; icon?: string; badge?: string }[] = [
  { label: 'Populares', badge: 'Top' },
  { label: 'Temporada 26/27', badge: 'Nuevo' },
  { label: 'Temporada 25/26' },
  { label: 'Retro', badge: 'Míticas' },
  { label: 'Mundial 2026', badge: '🏆' },
  { label: 'Mundial', badge: '🌍' },
  { label: 'LaLiga', badge: '🇪🇸' },
  { label: 'Premier League', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { label: 'Serie A', badge: '🇮🇹' },
  { label: 'Bundesliga', badge: '🇩🇪' },
  { label: 'Ligue 1', badge: '🇫🇷' },
  { label: 'Brasileirão', badge: '🇧🇷' },
  { label: 'Liga ARG & Sudamericana', badge: '🇦🇷' },
  { label: 'Liga Chilena', badge: '🇨🇱' },
  { label: 'Primeira Liga', badge: '🇵🇹' },
  { label: 'Eredivisie', badge: '🇳🇱' },
  { label: 'Liga MX', badge: '🇲🇽' },
  { label: 'MLS', badge: '🇺🇸' },
  { label: 'Liga Escocesa', badge: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { label: 'Japon League', badge: '🇯🇵' },
  { label: 'Conjuntos Especiales' },
  { label: 'Ropa Entrenamiento & Cortavientos' },
  { label: 'Ropa de Moda' },
  { label: 'Unboxing', badge: 'Videos' },
];

export const Navbar: React.FC<NavbarProps> = ({
  productCount,
  cartCount,
  cartTotal,
  ordersCount = 0,
  isAdminMode,
  onToggleAdminMode,
  onOpenAddModal,
  onOpenOrders,
  onOpenCart,
  onOpenCheckout,
  onOpenPaymentSettings,
  onOpenCoupons,
  onSelectSection,
  activeSection,
  searchQuery = '',
  onSearchChange,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 px-4 py-1 text-center text-[11px] text-neutral-300 border-b border-neutral-800/60 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
          <CreditCard className="h-3 w-3" />
          Pago seguro Tarjeta, Apple Pay, Google Pay y Klarna (3 plazos sin intereses)
        </span>
        <span className="hidden sm:inline text-neutral-500">•</span>
        <span className="text-neutral-300 font-medium">
          📦 Envíos con tracking: <strong className="text-emerald-400">GRATIS</strong> desde 3 artículos (7€ UE / 4€ Fuera UE)
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        
        {/* Brand - Click to reload / go to home (F5) */}
        <button
          type="button"
          onClick={() => {
            if (window.location.search || window.location.hash) {
              window.location.href = '/';
            } else {
              window.location.reload();
            }
          }}
          className="flex items-center gap-3 text-left group cursor-pointer transition transform active:scale-95 focus:outline-none"
          title="Volver al inicio (F5)"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-neutral-950 shadow-lg shadow-emerald-950/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/40 group-hover:brightness-110">
            <Shirt className="h-6 w-6 stroke-[2.4]" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition">
              Kits<span className="text-emerald-400">Hub</span> Store
            </h1>
          </div>
        </button>

        {/* Search Bar in Navbar */}
        {onSearchChange && (
          <div className="flex-1 max-w-sm mx-2 order-3 md:order-none w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
              <input
                type="text"
                placeholder="Buscar equipo (Real Madrid, Barça, Betis...)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/90 pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-neutral-400 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                  title="Borrar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">

          {/* Owner Admin Controls - ONLY VISIBLE WHEN ADMIN MODE IS ACTIVE */}
          {isAdminMode ? (
            <>
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                <Lock className="h-3 w-3" />
                <span>Panel Propietario</span>
              </div>

              {/* Add Shirt Button */}
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-neutral-950 transition hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <Plus className="h-4 w-4 stroke-[2.8]" />
                <span>+ Poner Camiseta</span>
              </button>

              {/* Admin Orders Button with counter badge */}
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500 hover:text-neutral-950 transition shadow-sm"
                  title="Gestionar todos los pedidos de los clientes"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Pedidos</span>
                  {ordersCount > 0 && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-black text-neutral-950">
                      {ordersCount}
                    </span>
                  )}
                </button>
              )}

              {/* Payment Settings Button */}
              {onOpenPaymentSettings && (
                <button
                  type="button"
                  onClick={onOpenPaymentSettings}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-neutral-200 hover:border-emerald-500/50 hover:bg-neutral-800 hover:text-white transition shadow-sm"
                  title="Configurar Stripe, Klarna, PayPal y plataformas de cobro"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Cobros & Plataformas</span>
                </button>
              )}

              {/* Coupons Management Button */}
              {onOpenCoupons && (
                <button
                  type="button"
                  onClick={onOpenCoupons}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition shadow-sm"
                  title="Crear y gestionar cupones de descuento"
                >
                  <Tag className="h-3.5 w-3.5 text-emerald-400" />
                  <span>🏷️ Cupones</span>
                </button>
              )}

              {/* Exit Admin Mode */}
              <button
                type="button"
                onClick={onToggleAdminMode}
                className="flex items-center gap-1 px-2.5 py-1.5 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-900 transition text-xs font-bold"
                title="Cerrar modo administrador (ocultar a clientes)"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Admin</span>
              </button>
            </>
          ) : (
            /* Candadito discreto para activar el modo administrador */
            <button
              type="button"
              onClick={onToggleAdminMode}
              className="p-2 text-neutral-600 hover:text-neutral-400 rounded-xl hover:bg-neutral-900 transition"
              title="Acceso Propietario"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Theme Selector: BLANCO FONDO O NEGRO */}
          {onToggleTheme && (
            <div className="flex items-center rounded-xl p-0.5 border border-neutral-700/80 bg-neutral-900/90 shadow-inner">
              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  theme === 'dark'
                    ? 'bg-neutral-800 text-white shadow-sm font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Fondo Negro"
              >
                <Moon className="h-3.5 w-3.5 text-neutral-300" />
                <span className="hidden sm:inline">Negro</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  theme === 'light'
                    ? 'bg-white text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Fondo Blanco"
              >
                <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">Blanco</span>
              </button>
            </div>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Cart & Checkout */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-neutral-950 shadow-md"
              title="Ver y editar tu cesta"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Cesta</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-black text-neutral-950">
                  {cartCount}
                </span>
              )}
            </button>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={onOpenCheckout}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-neutral-950 transition hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-950/40"
                title="Pagar pedido"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Pagar ({cartTotal.toFixed(2)} €)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-1.5 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="mx-auto flex max-w-7xl items-center gap-1 text-xs">
          {CATEGORY_ITEMS.map((item) => {
            const isSelected = activeSection === item.label;
            const isPopulares = item.label === 'Populares';
            const isRetro = item.label === 'Retro';
            const is2627 = item.label === 'Temporada 26/27';
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectSection(item.label)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? isPopulares
                      ? 'bg-orange-500 text-neutral-950 shadow-sm font-black'
                      : isRetro
                      ? 'bg-neutral-200 text-neutral-950 shadow-sm'
                      : is2627
                      ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                      : 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : isPopulares
                    ? 'text-orange-400 hover:bg-orange-500/10'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                {isPopulares && <Flame className="h-3 w-3 fill-current text-orange-400" />}
                <span>{item.label}</span>
                {item.badge && !isSelected && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isPopulares
                      ? 'bg-orange-500/20 text-orange-300'
                      : isRetro
                      ? 'bg-neutral-800 text-neutral-300'
                      : is2627
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
