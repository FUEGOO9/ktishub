import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Shirt, 
  Save, 
  UploadCloud, 
  Check, 
  Trash2, 
  Camera, 
  RefreshCw,
  Hash,
  Zap,
  Lock,
  Plus
} from 'lucide-react';
import { Product, CatalogSection, ProductType, JerseyEdition } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
  editingProduct?: Product | null;
  defaultSection?: CatalogSection;
}

const SECTIONS: CatalogSection[] = [
  'Populares',
  'Temporada 26/27',
  'Temporada 25/26',
  'Retro',
  'Mundial 2026',
  'Mundial',
  'LaLiga',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Brasileirão',
  'Liga ARG & Sudamericana',
  'Liga Chilena',
  'Primeira Liga',
  'Eredivisie',
  'Liga MX',
  'MLS',
  'Liga Escocesa',
  'Japon League',
  'Conjuntos Especiales',
  'Ropa Entrenamiento & Cortavientos',
  'Ropa de Moda',
  'Unboxing',
];

const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '39', '40', '41', '42', '43', '44', '45'];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProduct,
  defaultSection = 'Temporada 26/27',
}) => {
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('');
  const [season, setSeason] = useState('');
  const [player, setPlayer] = useState('');
  const [selectedSections, setSelectedSections] = useState<CatalogSection[]>([defaultSection]);
  const [price, setPrice] = useState<string>('14.99');
  const [costPrice, setCostPrice] = useState<string>('8.00');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [imageFileName, setImageFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [notes, setNotes] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL', '2XL']);
  const [qualityGrade, setQualityGrade] = useState('');
  const [badgeOptionsText, setBadgeOptionsText] = useState('Champions League, Parche de Liga');

  // Versiones (Fan / Player)
  const [availableEditions, setAvailableEditions] = useState<JerseyEdition[]>(['FAN VERSION', 'PLAYER VERSION']);
  const [fanVersionDescription, setFanVersionDescription] = useState<string>(
    'Corte regular aficionado, escudos bordados de alta definición y tejido transpirable.'
  );
  const [playerVersionDescription, setPlayerVersionDescription] = useState<string>(
    'Corte entallado pro match, detalles termosellados en 3D y máxima ligereza como la de los jugadores.'
  );
  const [playerVersionExtraPrice, setPlayerVersionExtraPrice] = useState<string>('2.00');

  // Dorsales
  const [allowCustomDorsal, setAllowCustomDorsal] = useState<boolean>(true);
  const [dorsalExtraPrice, setDorsalExtraPrice] = useState<string>('2.00');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const extraFileInputRef = useRef<HTMLInputElement | null>(null);

  // Process and compress image file
  const processImageFile = (file: File, isExtra = false) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          if (isExtra) {
            setAdditionalImages((prev) => [...prev, dataUrl]);
          } else {
            setImageUrl(dataUrl);
            setImageFileName(file.name);
          }
        } else {
          const raw = e.target?.result as string;
          if (isExtra) {
            setAdditionalImages((prev) => [...prev, raw]);
          } else {
            setImageUrl(raw);
            setImageFileName(file.name);
          }
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        alert('No se pudo procesar la imagen.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          processImageFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setTeam(editingProduct.team || '');
      setSeason(editingProduct.season || '');
      setPlayer(editingProduct.player || '');
      setSelectedSections(
        editingProduct.sections && editingProduct.sections.length > 0 
          ? editingProduct.sections 
          : [editingProduct.section || 'Populares']
      );
      setPrice(editingProduct.price ? editingProduct.price.toString() : '24.99');
      setCostPrice(editingProduct.costPrice !== undefined ? editingProduct.costPrice.toString() : '11.50');
      setImageUrl(editingProduct.imageUrl || '');
      setAdditionalImages(editingProduct.images || []);
      setImageFileName('');
      setShowUrlFallback(false);
      setNotes(editingProduct.notes || '');
      setItemCode(editingProduct.itemCode || '');
      setSelectedSizes(editingProduct.availableSizes || ['S', 'M', 'L', 'XL']);
      setQualityGrade(editingProduct.qualityGrade || 'Calidad Oficial Premium');
      setBadgeOptionsText(editingProduct.badgeOptions ? editingProduct.badgeOptions.join(', ') : 'Champions League, Parche de Liga');
      setAvailableEditions(editingProduct.availableEditions || ['FAN VERSION', 'PLAYER VERSION']);
      setFanVersionDescription(
        editingProduct.fanVersionDescription || 
        'Corte regular aficionado, escudos bordados de alta definición y tejido transpirable.'
      );
      setPlayerVersionDescription(
        editingProduct.playerVersionDescription || 
        'Corte entallado pro match, detalles termosellados en 3D y máxima ligereza como la de los jugadores.'
      );
      setPlayerVersionExtraPrice(
        editingProduct.playerVersionExtraPrice !== undefined ? editingProduct.playerVersionExtraPrice.toString() : '0.00'
      );
      setAllowCustomDorsal(editingProduct.allowCustomDorsal !== false);
      setDorsalExtraPrice(
        editingProduct.dorsalExtraPrice !== undefined ? editingProduct.dorsalExtraPrice.toString() : '0.00'
      );
    } else {
      // Reset
      const isDefaultRetro = defaultSection === 'Retro';
      setTitle('');
      setTeam('');
      setSeason(defaultSection === 'Temporada 26/27' ? '2026/2027' : '2025/2026');
      setPlayer('');
      setSelectedSections([defaultSection]);
      setPrice(isDefaultRetro ? '19.99' : '24.99');
      setCostPrice(isDefaultRetro ? '8.50' : '11.50');
      setImageUrl('');
      setAdditionalImages([]);
      setImageFileName('');
      setShowUrlFallback(false);
      setNotes('');
      setItemCode('');
      setSelectedSizes(['S', 'M', 'L', 'XL', '2XL']);
      setQualityGrade('Calidad Oficial Premium');
      setBadgeOptionsText('Champions League, Parche de Liga');
      setAvailableEditions(isDefaultRetro ? ['FAN VERSION'] : ['FAN VERSION', 'PLAYER VERSION']);
      setFanVersionDescription('Corte regular aficionado, escudos bordados de alta definición y tejido transpirable.');
      setPlayerVersionDescription('Corte entallado pro match, detalles termosellados en 3D y máxima ligereza como la de los jugadores.');
      setPlayerVersionExtraPrice('0.00'); // GRATIS por defecto
      setAllowCustomDorsal(true);
      setDorsalExtraPrice('0.00'); // GRATIS por defecto
    }
  }, [editingProduct, isOpen, defaultSection]);

  const toggleSection = (sec: CatalogSection) => {
    setSelectedSections((prev) => {
      let updated: CatalogSection[];
      if (prev.includes(sec)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        updated = prev.filter((s) => s !== sec);
      } else {
        updated = [...prev, sec];
      }
      if (updated.includes('Retro')) {
        setAvailableEditions(['FAN VERSION']);
        if (price === '24.99') setPrice('19.99');
        if (costPrice === '11.50') setCostPrice('8.50');
      }
      return updated;
    });
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleDeleteCurrent = () => {
    if (editingProduct && onDelete) {
      onDelete(editingProduct.id);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedPrice = parseFloat(price) || 24.99;
    const parsedCost = parseFloat(costPrice) || 0;
    const isRetro = selectedSections.includes('Retro');
    const isPopular = selectedSections.includes('Populares');
    const primarySection = selectedSections[0] || 'Populares';

    let category: ProductType = 'Camiseta 25/26';
    if (selectedSections.includes('Temporada 26/27')) category = 'Camiseta 26/27';
    else if (selectedSections.includes('Retro')) category = 'Camiseta Retro';
    else if (selectedSections.includes('Conjuntos Especiales')) category = 'Conjunto Especial / Pack';
    else if (selectedSections.includes('Unboxing')) category = 'Unboxing / Review Calidad';
    else if (selectedSections.includes('Ropa Entrenamiento & Cortavientos')) category = 'Cortavientos / Chándal';
    else if (selectedSections.includes('Ropa de Moda')) category = 'Ropa de Moda / Streetwear';

    const badges = badgeOptionsText
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const allImages = [imageUrl, ...additionalImages].filter(Boolean);

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: title.trim(),
      team: team.trim() || undefined,
      season: season.trim() || undefined,
      player: player.trim() || undefined,
      isRetro,
      isPopular,
      isStoreItem: true,
      availableEditions: availableEditions.length > 0 ? availableEditions : ['FAN VERSION', 'PLAYER VERSION'],
      fanVersionDescription: fanVersionDescription.trim(),
      playerVersionDescription: playerVersionDescription.trim(),
      playerVersionExtraPrice: parseFloat(playerVersionExtraPrice) || 0,
      allowCustomDorsal,
      dorsalExtraPrice: parseFloat(dorsalExtraPrice) || 0,
      section: primarySection,
      sections: selectedSections,
      category,
      price: parsedPrice,
      costPrice: parsedCost,
      imageUrl: imageUrl.trim() || undefined,
      images: allImages.length > 1 ? allImages : undefined,
      badgeOptions: badges.length > 0 ? badges : undefined,
      notes: notes.trim(),
      availableSizes: selectedSizes,
      qualityGrade,
      itemCode: itemCode.trim() || `KIT-${Math.floor(100 + Math.random() * 900)}`,
      dateAdded: editingProduct?.dateAdded || new Date().toISOString().split('T')[0],
    };

    onSave(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {editingProduct ? 'Editar Camiseta de la Tienda' : 'Poner Nueva Camiseta'}
              </h2>
              <p className="text-xs text-neutral-400">
                Sube la foto del producto, define precio, versiones y parches a 0€
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          
          {/* ========================================================================= */}
          {/* FOTO PRINCIPAL Y FOTOS ADICIONALES (SUBIR ARCHIVO DIRECTO)               */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Foto de la Camiseta *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-[11px] text-neutral-400 hover:text-emerald-400 transition underline underline-offset-2"
              >
                {showUrlFallback ? '← Subir archivo de imagen' : 'O pegar enlace web (URL)'}
              </button>
            </div>

            {/* Hidden native input for main image */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0], false);
                }
              }}
            />

            {/* Hidden native input for extra images */}
            <input
              ref={extraFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0], true);
                }
              }}
            />

            {!showUrlFallback ? (
              <div className="space-y-3">
                {imageUrl ? (
                  /* Main Image Preview Card */
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-neutral-950 p-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 flex items-center justify-center p-2 shadow-inner">
                        <img
                          src={getProductImageUrl(imageUrl)}
                          alt="Previsualización de la camiseta"
                          className="h-full w-full object-contain object-center"
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-400">
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Foto principal lista</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-medium truncate max-w-xs sm:max-w-sm">
                          {imageFileName || 'Imagen de la prenda'}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Se verá nítida y completa en la tienda exactamente como en la web oficial.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 hover:border-emerald-500 transition"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Cambiar Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => extraFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-neutral-800 transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Añadir Otra Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setImageFileName('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:border-rose-800 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Images list */}
                    {additionalImages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-800/80">
                        <span className="block text-[10px] font-bold text-neutral-400 mb-2 uppercase">
                          Fotos Secundarias / Galería ({additionalImages.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {additionalImages.map((img, idx) => (
                            <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 p-1 group">
                              <img src={getProductImageUrl(img)} alt={`Extra ${idx + 1}`} className="h-full w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 rounded-full bg-rose-600/90 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Dropzone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processImageFile(e.dataTransfer.files[0], false);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all ${
                      isDragging
                        ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
                        : 'border-neutral-700 bg-neutral-950/80 hover:border-emerald-500/80 hover:bg-neutral-950'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                        <span className="text-xs text-neutral-300">Optimizando foto en alta definición...</span>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition duration-200">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          Arrastra tu archivo aquí o <span className="text-emerald-400 underline underline-offset-2">haz clic para elegir foto</span>
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-400">
                          Sube tu foto desde el móvil o PC (JPG, PNG, WEBP). Se verá con alta definición.
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          (También puedes pegar una imagen directamente con Ctrl+V)
                        </p>
                        <button
                          type="button"
                          className="mt-3 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-black text-neutral-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/40"
                        >
                          Seleccionar Archivo
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5">
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFileName('');
                  }}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Multi-Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                1. Categorías de la Camiseta * <span className="text-neutral-400 font-normal capitalize">(Selecciona una o varias)</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {selectedSections.length} {selectedSections.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 rounded-2xl border border-neutral-800 bg-neutral-950/80 scrollbar-thin">
              {SECTIONS.map((sec) => {
                const isSelected = selectedSections.includes(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSection(sec)}
                    className={`rounded-xl px-3 py-2 text-left border text-xs font-bold transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500/90 bg-emerald-950/70 text-white shadow-md ring-1 ring-emerald-500/40'
                        : 'border-neutral-800/90 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <span className="truncate">{sec}</span>
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition ${
                      isSelected ? 'bg-emerald-500 border-emerald-400 text-neutral-950' : 'border-neutral-700 bg-neutral-950'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1">
              2. Nombre / Título de la Camiseta *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Real Madrid 25/26 Primera Equipación"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none text-xs font-semibold"
            />
          </div>

          {/* Team & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Equipo / Club
              </label>
              <input
                type="text"
                placeholder="Ej: Real Madrid, FC Barcelona, España"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Temporada / Año
              </label>
              <input
                type="text"
                placeholder="Ej: 25/26, 26/27, 2002"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Private Cost */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  Precio de Venta al Cliente (€) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/50 bg-neutral-900 px-3 py-2 font-mono text-sm font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* Private Cost Section (Only visible to admin) */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-300 mb-1">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>Coste Interno (Privado / Oculto a Clientes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 font-mono text-xs text-neutral-300 focus:border-neutral-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-neutral-400">
                    Margen: <strong className="text-emerald-400 font-mono">+{(parseFloat(price || '0') - parseFloat(costPrice || '0')).toFixed(2)} €</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EDICIONES (FAN/PLAYER) CON DESCRIPCIONES PERSONALIZABLES                  */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shirt className="h-4 w-4 text-emerald-400" />
                <span>Configuración de FAN VERSION & PLAYER VERSION</span>
              </label>
            </div>

            {/* Fan Version Box */}
            <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableEditions.includes('FAN VERSION')}
                    onChange={(e) => {
                      if (e.target.checked) setAvailableEditions([...availableEditions, 'FAN VERSION']);
                      else if (availableEditions.length > 1) setAvailableEditions(availableEditions.filter(ed => ed !== 'FAN VERSION'));
                    }}
                    className="rounded border-neutral-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="font-bold text-xs text-white">FAN VERSION (Versión Aficionado)</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Precio Base
                </span>
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">
                  Descripción que verán los clientes para Fan Version:
                </label>
                <input
                  type="text"
                  value={fanVersionDescription}
                  onChange={(e) => setFanVersionDescription(e.target.value)}
                  placeholder="Corte regular aficionado, escudos bordados de alta definición..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Player Version Box */}
            {selectedSections.includes('Retro') ? (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 flex items-center gap-2">
                <span>⏳</span>
                <span>Las camisetas Retro no disponen de opción Player Version (solo Edición Clásica Fan Version).</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableEditions.includes('PLAYER VERSION')}
                      onChange={(e) => {
                        if (e.target.checked) setAvailableEditions([...availableEditions, 'PLAYER VERSION']);
                        else if (availableEditions.length > 1) setAvailableEditions(availableEditions.filter(ed => ed !== 'PLAYER VERSION'));
                      }}
                      className="rounded border-neutral-700 text-amber-400 focus:ring-0"
                    />
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      PLAYER VERSION (Versión Jugador Profesional)
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-400">Extra:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={playerVersionExtraPrice}
                      onChange={(e) => setPlayerVersionExtraPrice(e.target.value)}
                      className="w-16 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-center font-mono text-xs text-amber-300 focus:outline-none"
                    />
                    <span className="text-xs text-neutral-400">€</span>
                    {parseFloat(playerVersionExtraPrice || '0') === 0 && (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        GRATIS (0€)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">
                    Descripción que verán los clientes para Player Version:
                  </label>
                  <input
                    type="text"
                    value={playerVersionDescription}
                    onChange={(e) => setPlayerVersionDescription(e.target.value)}
                    placeholder="Corte entallado pro match, detalles termosellados en 3D y máxima ligereza..."
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* DORSALES PERSONALIZABLES (A 0€ / GRATIS)                                  */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-emerald-400" />
                  <span>Dorsales y Nombres Personalizados</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-400">Suplemento Dorsal:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={dorsalExtraPrice}
                      onChange={(e) => setDorsalExtraPrice(e.target.value)}
                      className="w-16 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-center font-mono text-xs text-emerald-400 focus:outline-none"
                    />
                    <span className="text-xs text-neutral-400">€</span>
                    {parseFloat(dorsalExtraPrice || '0') === 0 && (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        GRATIS (0€)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
              Tallas Disponibles
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedSizes.includes(size)
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Parches a 0€ y Notas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-neutral-400">
                Parches Oficiales Disponibles (a 0€ / GRATIS)
              </label>
              <span className="text-[10px] text-emerald-400 font-bold">0,00 € (GRATIS)</span>
            </div>
            <input
              type="text"
              placeholder="Champions League, Parche de Liga, Parche Mundial de Clubes"
              value={badgeOptionsText}
              onChange={(e) => setBadgeOptionsText(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Detalles adicionales de la prenda
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre bordado, calidad de tejido, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          {/* Footer actions with Delete option */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <div>
              {editingProduct && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar esta camiseta</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs text-neutral-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Camiseta ({selectedSections.length} {selectedSections.length === 1 ? 'categoría' : 'categorías'})</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
