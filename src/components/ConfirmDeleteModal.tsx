import React from 'react';
import { AlertTriangle, Trash2, X, Shirt } from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product?: Product | null;
  isClearAll?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isClearAll = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/30 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-neutral-950 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4">
          <Trash2 className="h-7 w-7 stroke-[2.2]" />
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-white">
            {isClearAll ? '¿Vaciar Todo el Catálogo?' : '¿Eliminar esta prenda?'}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {isClearAll
              ? 'Esta acción borrará todas las camisetas y prendas de tu tienda para que puedas empezar desde cero.'
              : 'La prenda seleccionada se eliminará definitivamente del catálogo y de la vista de tus clientes.'}
          </p>
        </div>

        {/* Product Card Preview (if single item delete) */}
        {!isClearAll && product && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-left">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={getProductImageUrl(product.imageUrl)}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Shirt className="h-6 w-6 text-neutral-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {product.title}
              </h4>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {product.section} • <span className="font-mono text-emerald-400 font-bold">{(product.price || 24.99).toFixed(2)} €</span>
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-neutral-700 bg-neutral-800 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-2xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-500 transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isClearAll ? 'Sí, vaciar todo' : 'Sí, eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
