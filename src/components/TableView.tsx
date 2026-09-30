import React, { useState } from 'react';
import { Edit3, Trash2, ShoppingBag, Euro, Shirt, Eye } from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';

interface TableViewProps {
  products: Product[];
  isAdminMode?: boolean;
  onAddToCart: (product: Product, size: string) => void;
  onOpenDetail?: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onUpdatePrice?: (productId: string, newPrice: number) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  products,
  isAdminMode = false,
  onAddToCart,
  onOpenDetail,
  onEdit,
  onDelete,
  onUpdatePrice,
}) => {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');

  const handleSavePrice = (id: string) => {
    const val = parseFloat(quickPriceVal);
    if (!isNaN(val) && val >= 0 && onUpdatePrice) {
      onUpdatePrice(id, val);
    }
    setEditingPriceId(null);
  };

  const handleDelete = (p: Product) => {
    onDelete(p.id);
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-neutral-400">
        No se encontraron prendas con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-2xl">
      <table className="w-full text-left text-xs text-neutral-300">
        <thead className="border-b border-neutral-800 bg-neutral-950/90 text-[11px] uppercase tracking-wider text-neutral-400">
          <tr>
            <th className="px-4 py-3.5 font-bold">Camiseta / Prenda</th>
            <th className="px-3 py-3.5 font-bold">Categoría</th>
            <th className="px-3 py-3.5 font-bold">Tallas</th>
            <th className="px-3 py-3.5 font-bold">Dorsal / Jugador</th>
            <th className="px-3 py-3.5 font-bold">Precio</th>
            <th className="px-4 py-3.5 text-right font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {products.map((p) => (
            <tr
              key={p.id}
              className="transition-colors hover:bg-neutral-800/40 group"
            >
              {/* Product Info & Thumbnail */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center p-1">
                    {p.imageUrl ? (
                      <img
                        src={getProductImageUrl(p.imageUrl)}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Shirt className="h-5 w-5 text-neutral-600" />
                    )}
                  </div>
                  <div className="max-w-md">
                    <span 
                      onClick={() => onOpenDetail && onOpenDetail(p)}
                      className="font-bold text-white line-clamp-1 text-xs sm:text-sm hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      {p.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.team && (
                        <span className="text-[11px] text-neutral-400">
                          {p.team}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Section / Categories */}
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {(p.sections && p.sections.length > 0 ? p.sections : [p.section]).map((sec) => (
                    <span key={sec} className="rounded-lg bg-neutral-950 px-2 py-0.5 font-bold text-neutral-300 border border-neutral-800 text-[10px]">
                      {sec}
                    </span>
                  ))}
                </div>
              </td>

              {/* Sizes */}
              <td className="px-3 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {(p.availableSizes || ['S', 'M', 'L', 'XL', '2XL']).slice(0, 4).map((sz) => (
                    <span key={sz} className="rounded bg-neutral-950 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 border border-neutral-800">
                      {sz}
                    </span>
                  ))}
                </div>
              </td>

              {/* Dorsal info */}
              <td className="px-3 py-3 whitespace-nowrap">
                {p.player ? (
                  <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                    {p.player}
                  </span>
                ) : (
                  <span className="text-emerald-400 text-[11px] font-medium">Personalizable</span>
                )}
              </td>

              {/* Price */}
              <td className="px-3 py-3 whitespace-nowrap">
                {editingPriceId === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      autoFocus
                      placeholder="0.00"
                      value={quickPriceVal}
                      onChange={(e) => setQuickPriceVal(e.target.value)}
                      className="w-16 rounded bg-neutral-950 border border-emerald-500 px-1.5 py-0.5 text-xs text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePrice(p.id);
                        if (e.key === 'Escape') setEditingPriceId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSavePrice(p.id)}
                      className="rounded bg-emerald-500 px-1.5 py-0.5 text-[11px] font-bold text-neutral-950"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {(p.price || 24.99).toFixed(2)} €
                    </span>
                    {onUpdatePrice && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPriceVal((p.price || 24.99).toString());
                          setEditingPriceId(p.id);
                        }}
                        className="text-neutral-600 hover:text-emerald-400 p-0.5"
                        title="Cambiar precio"
                      >
                        <Euro className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {/* View Detail */}
                  {onOpenDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenDetail(p)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/50 transition"
                      title="Ver prenda y configurar dorsal"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Add to order cart */}
                  <button
                    type="button"
                    onClick={() => onAddToCart(p, p.availableSizes?.[0] || 'M')}
                    className="rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/50 transition"
                    title="Añadir a la cesta"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </button>

                  {/* Edit (Admin only) */}
                  {isAdminMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-neutral-400 hover:border-neutral-700 hover:text-white transition"
                        title="Editar datos"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 text-rose-400 hover:border-rose-900 hover:bg-rose-950 transition"
                        title="Eliminar de la tienda"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
