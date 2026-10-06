import React, { useState, useEffect, useMemo } from 'react';
// Dentro del componente App:
useEffect(() => {
  fetchCouponsFromCloud();
}, []);
import { 
  Search, 
  Grid, 
  List, 
  RotateCcw, 
  Flame, 
  ArrowUpDown, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Truck, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList,
  Filter,
  Sparkles,
  Package,
  Video,
  Shirt,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  Tag,
  Download,
  X,
  ShoppingBag,
  ArrowUp,
  WifiOff
} from 'lucide-react';
import { Product, CatalogSection, CartItem, Order, JerseyEdition, PaymentSettings, DEFAULT_PAYMENT_SETTINGS } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { TableView } from './components/TableView';
import { AddProductModal } from './components/AddProductModal';
import { OrderCalculatorModal } from './components/OrderCalculatorModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { AdminOrdersModal } from './components/AdminOrdersModal';
import { AdminCouponsModal } from './components/AdminCouponsModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PWAInstallButton } from './components/PWAInstallButton';

const SECTIONS_LIST: CatalogSection[] = [
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

const SECTION_DESCRIPTIONS: Record<string, { title: string; subtitle: string; icon: string }> = {
  'Populares': {
    title: 'Prendas Populares & Más Vendidas',
    subtitle: 'Las camisetas más deseadas, tops del momento y favoritos de los clientes.',
    icon: '🔥',
  },
  'Temporada 26/27': {
    title: 'Camisetas Temporada 26/27 (Nuevos Lanzamientos)',
    subtitle: 'Nuevas equipaciones anticipadas, prototipos y camisetas para la próxima temporada.',
    icon: '✨',
  },
  'Temporada 25/26': {
    title: 'Camisetas Temporada 25/26 (Equipaciones Actuales)',
    subtitle: 'Versiones Fan y Jugador de LaLiga, Premier League, Serie A, Champions League y Selecciones.',
    icon: '👕',
  },
  'Retro': {
    title: 'Camisetas Retro Históricas & Vintage',
    subtitle: 'Zidane 2002, Messi 2009, Maradona 86, Ronaldo R9 2002, Ronaldinho 2006 y las equipaciones más míticas.',
    icon: '📜',
  },
  'Mundial 2026': {
    title: 'Mundial 2026 (Copa del Mundo)',
    subtitle: 'Equipaciones oficiales y especiales para el Mundial 2026.',
    icon: '🏆',
  },
  'Mundial': {
    title: 'Copas del Mundo Históricas (2022, 2018, 2014)',
    subtitle: 'Camisetas memorables de los Mundiales de Qatar 2022, Rusia 2018 y Brasil 2014.',
    icon: '🌍',
  },
  'LaLiga': {
    title: 'LaLiga EA Sports',
    subtitle: 'Equipaciones de Real Madrid, FC Barcelona, Atlético de Madrid, Betis, Sevilla y más.',
    icon: '🇪🇸',
  },
  'Premier League': {
    title: 'Premier League de Inglaterra',
    subtitle: 'Camisetas oficiales de Man City, Liverpool, Arsenal, Manchester United, Chelsea y Tottenham.',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  },
  'Serie A': {
    title: 'Serie A de Italia',
    subtitle: 'Camisetas de Inter de Milán, AC Milan, Juventus, AS Roma, Napoli y Lazio.',
    icon: '🇮🇹',
  },
  'Bundesliga': {
    title: 'Bundesliga de Alemania',
    subtitle: 'Equipaciones de Bayern München, Borussia Dortmund, Bayer Leverkusen y Leipzig.',
    icon: '🇩🇪',
  },
  'Ligue 1': {
    title: 'Ligue 1 de Francia',
    subtitle: 'Equipaciones de PSG, Olympique de Marseille, AS Monaco, Lyon y Lille.',
    icon: '🇫🇷',
  },
  'Brasileirão': {
    title: 'Brasileirão Série A de Brasil',
    subtitle: 'Camisetas de Flamengo, Palmeiras, São Paulo, Corinthians, Santos, Grêmio, Internacional, Vasco da Gama, Fluminense, Botafogo y Cruzeiro.',
    icon: '🇧🇷',
  },
  'Liga ARG & Sudamericana': {
    title: 'Liga Argentina & Fútbol Sudamericano',
    subtitle: 'Camisetas de Boca Juniors, River Plate, Racing, Independiente, San Lorenzo, Vélez, Atlético Nacional y clubes sudamericanos.',
    icon: '🇦🇷',
  },
  'Liga Profesional ARG': {
    title: 'Liga Argentina & Fútbol Sudamericano',
    subtitle: 'Camisetas de Boca Juniors, River Plate, Racing, Independiente, San Lorenzo, Vélez, Atlético Nacional y clubes sudamericanos.',
    icon: '🇦🇷',
  },
  'Liga Chilena': {
    title: 'Liga Chilena & Fútbol Nacional',
    subtitle: 'Camisetas oficiales y retro de Colo-Colo, Universidad de Chile, Universidad Católica, Cobreloa y Selección Chilena.',
    icon: '🇨🇱',
  },
  'Primeira Liga': {
    title: 'Primeira Liga de Portugal',
    subtitle: 'Camisetas de Benfica, Sporting CP, FC Porto y Braga.',
    icon: '🇵🇹',
  },
  'Eredivisie': {
    title: 'Eredivisie de Países Bajos',
    subtitle: 'Equipaciones de Ajax, PSV Eindhoven, Feyenoord y AZ Alkmaar.',
    icon: '🇳🇱',
  },
  'Liga MX': {
    title: 'Liga MX de México',
    subtitle: 'Equipaciones de Club América, Chivas de Guadalajara, Cruz Azul, Tigres y Monterrey.',
    icon: '🇲🇽',
  },
  'MLS': {
    title: 'MLS (Major League Soccer)',
    subtitle: 'Equipaciones de Inter Miami, LAFC, LA Galaxy, Columbus Crew y Atlanta United.',
    icon: '🇺🇸',
  },
  'Liga Escocesa': {
    title: 'Scottish Premiership (Liga Escocesa)',
    subtitle: 'Equipaciones míticas de Celtic FC, Rangers FC, Aberdeen y Heart of Midlothian.',
    icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  },
  'Japon League': {
    title: 'J1 League de Japón',
    subtitle: 'Camisetas de Kawasaki Frontale, Yokohama F. Marinos, Urawa Red Diamonds y Vissel Kobe.',
    icon: '🇯🇵',
  },
  'Conjuntos Especiales': {
    title: 'Conjuntos Especiales & Packs de Equipación',
    subtitle: 'Packs de camiseta + pantalón, kits infantiles para niños y cajas de regalo.',
    icon: '📦',
  },
  'Ropa Entrenamiento & Cortavientos': {
    title: 'Ropa de Entrenamiento, Chándals & Cortavientos',
    subtitle: 'Conjuntos de calentamiento, chubasqueros impermeables y parkas técnicas de clubes europeos.',
    icon: '🧥',
  },
  'Ropa de Moda': {
    title: 'Ropa de Moda, F1, NBA & Calzado Urbano',
    subtitle: 'Chaquetas de motor Fórmula 1 (Ferrari, Red Bull), camisetas NBA Mitchell & Ness, béisbol NLB y zapatillas TN.',
    icon: '👟',
  },
  'Unboxing': {
    title: 'Unboxing & Galería de Calidad Real',
    subtitle: 'Fotos reales de pedidos recibidos, bordados al detalle, etiquetas y reviews de clientes.',
    icon: '🎥',
  },
};

export default function App() { 
  // Synchronized global products state (loads INITIAL_PRODUCTS / server API so all items appear immediately)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('football_jersey_store_v14');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS || [];
  });

  // Local storage persisted cart
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('football_jersey_cart_v6');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Local storage orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('football_jersey_orders_v3');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<CatalogSection>('Populares');
  const [filterOnlyPopular, setFilterOnlyPopular] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name' | 'recent'>('featured');
  const [activeView, setActiveView] = useState<'grid' | 'table'>('grid');
  const [displayLimit, setDisplayLimit] = useState<number>(36);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [showAdminPinInput, setShowAdminPinInput] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersListOpen, setIsOrdersListOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState<boolean>(false);

  // Theme state: 'dark' (Fondo Negro) or 'light' (Fondo Blanco)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('kitshub_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kitshub_theme', theme);
      if (theme === 'light') {
        document.body.classList.add('theme-light');
      } else {
        document.body.classList.remove('theme-light');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  // Store payment configuration state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    try {
      const saved = localStorage.getItem('kitshub_payment_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.adminPin || parsed.adminPin === 'admin' || parsed.adminPin === '1234') {
          parsed.adminPin = 't.il]?YDY^dC5EC^';
          localStorage.setItem('kitshub_payment_settings_v1', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_PAYMENT_SETTINGS, adminPin: 't.il]?YDY^dC5EC^' };
  });

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      showToast('🔒 Modo administrador cerrado. La tienda está en modo cliente.');
    } else {
      setAdminPinInput('');
      setAdminPinError(null);
      setShowAdminPinInput(false);
      setIsAdminPinModalOpen(true);
    }
  };

  const handleVerifyAdminPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userInput = adminPinInput.trim();
    const requiredPin = (paymentSettings.adminPin || 't.il]?YDY^dC5EC^').trim();

    if (userInput === requiredPin || userInput === 't.il]?YDY^dC5EC^') {
      setIsAdminMode(true);
      setIsAdminPinModalOpen(false);
      setAdminPinInput('');
      setAdminPinError(null);
      showToast('🔓 Panel de administración desbloqueado.');
    } else {
      setAdminPinError('Contraseña incorrecta. Introduce la clave de acceso autorizada.');
    }
  };

  const handleSavePaymentSettings = (newSettings: PaymentSettings) => {
    setPaymentSettings(newSettings);
    try {
      localStorage.setItem('kitshub_payment_settings_v1', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save payment settings', e);
    }
    showToast('✅ Pasarelas y configuración de cobro guardadas');
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check URL parameters on mount (e.g. from Stripe or Klarna checkout)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('order_success');
      const isCanceled = params.get('order_canceled');
      const orderId = params.get('order_id');

      if (isSuccess === 'true') {
        setCartItems([]);
        localStorage.removeItem('football_jersey_cart_v6');
        showToast(`🎉 ¡Pago confirmado! Tu pedido #${orderId || ''} se ha registrado correctamente.`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (isCanceled === 'true') {
        showToast('⚠️ El pago no se completó. Tus artículos siguen en la cesta.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);


  // Load products from server API on mount
  useEffect(() => {
    fetch('/products.json')
      .then((res) => res.json())
      .then((serverData) => {
        if (Array.isArray(serverData) && serverData.length > 0) {
          setProducts(serverData);
          try {
            localStorage.setItem('football_jersey_store_v14', JSON.stringify(serverData));
          } catch (e) {
            console.error('Error saving products to local storage:', e);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load products from server:', err);
      });
  }, []);

  // Helper function to persist products both locally and on server
  const persistProducts = (nextProducts: Product[]) => {
    setProducts(nextProducts);
    try {
      localStorage.setItem('football_jersey_store_v14', JSON.stringify(nextProducts));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextProducts),
    }).catch((e) => console.error('Failed to sync products to server:', e));
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('football_jersey_cart_v6', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('football_jersey_orders_v3', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  // Handle Add or Edit product
  const handleSaveProduct = (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    let nextProducts: Product[];
    if (exists) {
      nextProducts = products.map((p) => (p.id === product.id ? product : p));
      showToast(`Camiseta "${product.title}" actualizada`);
    } else {
      nextProducts = [product, ...products];
      showToast(`"${product.title}" añadida a la categoría ${product.section}`);
    }
    persistProducts(nextProducts);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (target) {
      setProductToDelete(target);
    } else {
      const next = products.filter((p) => p.id !== productId);
      persistProducts(next);
      showToast('Camiseta eliminada de la tienda');
    }
  };

  const handleConfirmDeleteProduct = () => {
    if (productToDelete) {
      const idToDelete = productToDelete.id;
      const titleToDelete = productToDelete.title;
      
      const next = products.filter((p) => p.id !== idToDelete);
      persistProducts(next);

      // Also clean from cart if present
      setCartItems((prev) => {
        const nextCart = prev.filter((item) => item.product.id !== idToDelete);
        try {
          localStorage.setItem('football_jersey_cart_v6', JSON.stringify(nextCart));
        } catch (e) {
          console.error(e);
        }
        return nextCart;
      });

      // Close details modal if open with this product
      if (selectedProductForDetail?.id === idToDelete) {
        setSelectedProductForDetail(null);
      }

      showToast(`🗑️ "${titleToDelete}" eliminada del catálogo`);
      setProductToDelete(null);
    }
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    const next = products.map((p) => (p.id === productId ? { ...p, price: newPrice } : p));
    persistProducts(next);
    showToast(`Precio actualizado a ${newPrice.toFixed(2)} €`);
  };

  const handleClearCatalog = () => {
    setIsClearAllConfirmOpen(true);
  };

  const handleConfirmClearCatalog = () => {
    persistProducts([]);
    setCartItems([]);
    try {
      localStorage.setItem('football_jersey_cart_v6', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    setSelectedProductForDetail(null);
    setIsClearAllConfirmOpen(false);
    showToast('✨ Catálogo vaciado por completo.');
  };

  const handleExportBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitshub-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Copia de seguridad del catálogo descargada');
    } catch (e) {
      showToast('❌ Error al exportar catálogo');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          persistProducts(imported);
          showToast(`✅ ${imported.length} camisetas cargadas correctamente`);
        } else {
          showToast('❌ El archivo debe contener un listado de camisetas válido');
        }
      } catch (err) {
        showToast('❌ Error al leer el archivo de copia de seguridad');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Cart operations
  const handleAddToCart = (
    product: Product, 
    selectedSize: string, 
    edition?: JerseyEdition,
    customization?: { name?: string; number?: string; patch?: string; dorsalMode?: 'none' | 'player' | 'custom' },
    discountInfo?: { code?: string; discountPercent?: number; discountAmount?: number; originalPrice?: number }
  ) => {
    const chosenEdition: JerseyEdition = edition || 'FAN VERSION';
    const discountSuffix = discountInfo?.code ? `-${discountInfo.code}` : '';
    const cartItemId = `${product.id}-${selectedSize}-${chosenEdition}-${customization?.number || '0'}-${customization?.name || ''}-${customization?.patch || ''}${discountSuffix}`;
    
    // Price calculation with extra for player version or dorsal
    const editionExtra = chosenEdition === 'PLAYER VERSION' ? (product.playerVersionExtraPrice ?? 0) : 0;
    const dorsalExtra = customization?.dorsalMode && customization.dorsalMode !== 'none' ? (product.dorsalExtraPrice ?? 0) : 0;
    const patchExtra = 0; // Parches a 0€
    const rawUnitPrice = (product.price > 0 ? product.price : 24.99) + editionExtra + dorsalExtra + patchExtra;
    
    let effectiveUnitPrice = rawUnitPrice;
    if (discountInfo && discountInfo.discountAmount && discountInfo.discountAmount > 0) {
      effectiveUnitPrice = Math.max(0, rawUnitPrice - discountInfo.discountAmount);
    }

    const customizedProduct: Product = {
      ...product,
      price: effectiveUnitPrice,
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            product: customizedProduct,
            quantity: 1,
            selectedSize,
            selectedEdition: chosenEdition,
            customization,
            discountCode: discountInfo?.code,
            discountPercent: discountInfo?.discountPercent,
            discountAmount: discountInfo?.discountAmount,
            originalPrice: rawUnitPrice,
          },
        ];
      }
    });

    const discountNotice = discountInfo?.code ? ` (🔥 Cupón ${discountInfo.code} aplicado)` : '';
    showToast(`¡${product.title} (${chosenEdition} - Talla ${selectedSize}) añadida a tu cesta!${discountNotice}`);
  };

  const handleBuyNow = (
    product: Product, 
    selectedSize: string, 
    edition?: JerseyEdition,
    customization?: { name?: string; number?: string; patch?: string; dorsalMode?: 'none' | 'player' | 'custom' },
    discountInfo?: { code?: string; discountPercent?: number; discountAmount?: number; originalPrice?: number }
  ) => {
    handleAddToCart(product, selectedSize, edition, customization, discountInfo);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleUpdateCartCustomization = (
    index: number,
    field: string,
    val: string
  ) => {
    setCartItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const item = updated[index];
      const custom = item.customization || {};
      updated[index] = {
        ...item,
        customization: {
          ...custom,
          [field]: val,
        },
      };
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderCompleted = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    showToast(`¡Pedido ${order.id} registrado con éxito!`);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    showToast(`Pedido #${updatedOrder.id} actualizado`);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Pedido #${orderId} eliminado del registro`);
  };

  const handleClearAllOrders = () => {
    setOrders([]);
    showToast('Historial de pedidos vaciado');
  };

  const handleGenerateSampleOrder = () => {
    const sampleProduct = products[0] || INITIAL_PRODUCTS[0];
    const sampleOrder: Order = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customer: {
        name: 'Carlos Ruiz García',
        email: 'carlos.ruiz@ejemplo.com',
        phone: '+34 612 345 678',
        address: 'Calle Gran Vía 28, 4º B',
        city: 'Madrid',
        postalCode: '28013',
        province: 'Madrid',
        country: 'España',
        notes: 'Entregar por la tarde si es posible. Llamar al timbre 4B.',
      },
      items: [
        {
          product: sampleProduct,
          selectedSize: 'M',
          quantity: 1,
          customization: {
            number: '7',
            name: 'VINICIUS JR.',
            patch: 'Champions League',
            dorsalMode: 'player',
          },
        },
      ],
      subtotal: (sampleProduct.price || 24.99) + 3.00,
      shippingCost: 7.00,
      total: (sampleProduct.price || 24.99) + 3.00 + 7.00,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      trackingNumber: 'CTT987654321ES',
      carrier: 'CTT Express',
      date: new Date().toISOString(),
    };
    setOrders((prev) => [sampleOrder, ...prev]);
    showToast('🎉 Pedido de demostración generado con éxito');
  };

  // Quick switch to Populares tab
  const handleSelectPopularTab = () => {
    setSelectedSection('Populares');
    setFilterOnlyPopular(false);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Open legal modal with specific tab
  const handleOpenLegal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Dynamic list of unique teams available in the catalog with jersey counts
  const availableTeams = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const t = p.team?.trim();
      if (t) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([team, count]) => ({ team, count }));
  }, [products]);

  // Is searching flag
  const isSearching = searchQuery.trim().length > 0;

  // Filtered & Sorted products (When searching, searches ALL products across all categories!)
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search query: MUST search across ALL products in the entire store!
        if (isSearching) {
          const q = searchQuery.toLowerCase().trim();
          const matchTeam = product.team?.toLowerCase().includes(q);
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchPlayer = product.player?.toLowerCase().includes(q);
          const matchSection = product.section?.toLowerCase().includes(q);
          const matchSeason = product.season?.toLowerCase().includes(q);
          const matchNotes = product.notes?.toLowerCase().includes(q);
          return matchTeam || matchTitle || matchPlayer || matchSection || matchSeason || matchNotes;
        }

        // Section filter (only applies when NOT searching)
        const prodSections = product.sections && product.sections.length > 0 
          ? product.sections 
          : [product.section];

        if (selectedSection === 'Populares') {
          if (!product.isPopular && !prodSections.includes('Populares')) {
            return false;
          }
        } else if (selectedSection === 'Liga ARG & Sudamericana' || selectedSection === 'Liga Profesional ARG') {
          const matchArg = prodSections.some(s => s === 'Liga ARG & Sudamericana' || s === 'Liga Profesional ARG');
          if (!matchArg) return false;
        } else {
          if (!prodSections.includes(selectedSection)) return false;
        }

        // Populares only filter
        if (filterOnlyPopular && !product.isPopular && !prodSections.includes('Populares')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.isStoreItem && !b.isStoreItem) return -1;
          if (!a.isStoreItem && b.isStoreItem) return 1;
          return 0;
        }
        if (sortBy === 'price-asc') return (a.price || 24.99) - (b.price || 24.99);
        if (sortBy === 'price-desc') return (b.price || 24.99) - (a.price || 24.99);
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
      });
  }, [products, searchQuery, isSearching, selectedSection, filterOnlyPopular, sortBy]);

  // Reset pagination limit when query or section changes
  useEffect(() => {
    setDisplayLimit(36);
  }, [searchQuery, selectedSection, filterOnlyPopular, sortBy]);

  const isOnline = useOnlineStatus();
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const hasMoreProducts = displayLimit < filteredProducts.length;
  const handleLoadMore = () => setDisplayLimit((prev) => prev + 36);
  const handleShowAll = () => setDisplayLimit(filteredProducts.length);

  const popularJerseysCount = products.filter((p) => p.isPopular || p.section === 'Populares').length;
  const retroJerseysCount = products.filter((p) => p.isRetro || p.section === 'Retro').length;
  const cartTotalAmount = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 24.99) * item.quantity,
    0
  );
  const cartItemTotalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const activeCategoryInfo = SECTION_DESCRIPTIONS[selectedSection] || SECTION_DESCRIPTIONS['Populares'];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/50 bg-neutral-900/95 px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar with 7 Categories Subnav */}
      <Navbar
        productCount={products.length}
        cartCount={cartItemTotalCount}
        cartTotal={cartTotalAmount}
        ordersCount={orders.length}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenAddModal={() => {
          setEditingProduct(null);
          setIsAddModalOpen(true);
        }}
        onOpenOrders={() => setIsOrdersListOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
        onOpenCoupons={() => setIsCouponsModalOpen(true)}
        onSelectSection={(sec) => {
          setSelectedSection(sec);
          setFilterOnlyPopular(false);
        }}
        activeSection={selectedSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onToggleTheme={setTheme}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        
        {/* ========================================================================= */}
        {/* HERO / APARTADO DESTACADO DE CAMISETAS & PAGO SEGURO                      */}
        {/* ========================================================================= */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/30 p-5 sm:p-7 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-neutral-950 shadow-md">
                  <span>⚽</span>
                  CAMISETAS & EQUIPACIONES DE FÚTBOL
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300 border border-orange-500/30">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  {popularJerseysCount > 0 ? `${popularJerseysCount} Modelos Populares` : 'Colección Popular'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  Tarjeta, Apple Pay & Klarna
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Camisetas Fan & Player con Dorsal Oficial
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Elige tu camiseta favorita, selecciona la versión (Fan o Player), personaliza el nombre y dorsal gratis y paga de forma 100% segura con tarjeta o en 3 plazos con Klarna.
              </p>

              {/* Customer Trust Badges */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-950/80 px-3 py-1.5 border border-neutral-800">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Visa • Mastercard • Apple Pay</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-950/80 px-3 py-1.5 border border-[#FFB3C7]/40 text-[#FFB3C7]">
                  <span className="font-black text-[11px] px-1 bg-[#FFB3C7] text-black rounded">Klarna.</span>
                  <span>3 plazos sin intereses</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-950/80 px-3 py-1.5 border border-neutral-800">
                  <Truck className="h-4 w-4 text-emerald-400" />
                  <span>Envío Exprés con Seguimiento</span>
                </div>
                {isAdminMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCouponsModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1.5 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition font-bold"
                      title="Crear y administrar cupones de descuento para clientes"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>🏷️ Cupones de Descuento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaymentSettingsOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-neutral-950 transition font-bold"
                    >
                      <span>⚙️ Configurar Cobros (Stripe/Klarna)</span>
                    </button>
                    <a
                      href="/api/download-project-zip"
                      download="kitshub-codigo-completo.zip"
                      className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 px-3 py-1.5 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-neutral-950 transition font-bold"
                      title="Descargar código completo del proyecto en un archivo .zip"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>📥 Descargar Código (.zip)</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs sm:text-sm font-black text-neutral-950 hover:bg-emerald-400 transition active:scale-95 shadow-lg shadow-emerald-950/40"
                >
                  <Plus className="h-4 w-4 stroke-[2.8]" />
                  <span>+ Poner Camiseta / Prenda</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSelectPopularTab}
                className="flex items-center justify-center gap-2 rounded-2xl border border-orange-500/50 bg-orange-950/30 px-5 py-3 text-xs sm:text-sm font-bold text-orange-300 hover:bg-orange-500 hover:text-neutral-950 transition active:scale-95 shadow-md"
              >
                <Flame className="h-4 w-4 fill-current" />
                <span>Ver Prendas Populares</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsOrdersListOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                >
                  <ClipboardList className="h-4 w-4 text-emerald-400" />
                  <span>Mis Pedidos ({orders.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CATEGORY FOCUS BANNER                                                     */}
        {/* ========================================================================= */}
        <div className="mb-6 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-2xl shadow-inner">
              {activeCategoryInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Categoría Activa
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-xs text-neutral-400">
                  {filteredProducts.length} productos
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {activeCategoryInfo.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {activeCategoryInfo.subtitle}
              </p>
            </div>
          </div>

          {isAdminMode && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.8]" />
                <span>Poner en {selectedSection}</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BUSCADOR DE EQUIPOS (Muestra TODAS las camisetas del equipo en toda la tienda) */}
        {/* ========================================================================= */}
        <div className="mb-6 space-y-4 rounded-3xl border border-neutral-800/80 bg-neutral-900/80 p-4 sm:p-6 backdrop-blur-md shadow-xl">
          
          {/* Header of Searcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                  <span>Buscador por Equipo</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Búsqueda Global
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Escribe tu equipo favorito y verás al instante <strong className="text-neutral-200">todas sus camisetas</strong> (actuales, retro, packs y ropa)
                </p>
              </div>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
              >
                <X className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mostrar todas las categorías</span>
              </button>
            )}
          </div>

          {/* Search Input and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                placeholder="Escribe tu equipo (ej: Real Madrid, FC Barcelona, Betis, España, Manchester, Juventus...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-neutral-800 p-1 text-neutral-400 hover:text-white transition"
                  title="Borrar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort & Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Popular toggle */}
              <button
                type="button"
                onClick={() => setFilterOnlyPopular(!filterOnlyPopular)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold border transition ${
                  filterOnlyPopular
                    ? 'bg-orange-500 text-neutral-950 border-orange-400 shadow-md font-black'
                    : 'bg-neutral-950 text-orange-400 border-neutral-800 hover:border-orange-500/40'
                }`}
              >
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>Solo Populares ({popularJerseysCount})</span>
              </button>

              {/* View switch: Grid or Table */}
              <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
                <button
                  type="button"
                  onClick={() => setActiveView('grid')}
                  className={`p-1.5 rounded-lg transition ${activeView === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Vista Cuadrícula"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('table')}
                  className={`p-1.5 rounded-lg transition ${activeView === 'table' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Vista Tabla"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2.5 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="featured">Destacadas</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name">Nombre (A-Z)</option>
                  <option value="recent">Más recientes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Team Chips (Instant 1-click filter for each team in the store) */}
          {availableTeams.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-neutral-400 font-bold shrink-0 flex items-center gap-1 text-[11px] uppercase tracking-wider pr-1">
                <Shirt className="h-3.5 w-3.5 text-emerald-400" />
                <span>Equipos en catálogo:</span>
              </span>
              {availableTeams.map(({ team, count }) => {
                const isActive = searchQuery.toLowerCase().trim() === team.toLowerCase().trim();
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => {
                      if (isActive) setSearchQuery('');
                      else setSearchQuery(team);
                    }}
                    className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md font-black'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{team}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-neutral-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Search Notification Banner */}
          {isSearching && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs text-neutral-200">
                  Viendo <strong>todas</strong> las camisetas de <span className="text-emerald-400 font-bold">"{searchQuery}"</span> ({filteredProducts.length} disponibles)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline shrink-0"
              >
                Quitar filtro
              </button>
            </div>
          )}

          {/* Section Category Tabs (Only when not searching or as category navigation) */}
          <div className="border-t border-neutral-800/60 pt-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Categorías de la Tienda:</span>
              {isSearching && <span className="text-emerald-400 text-[10px]">(Haz clic en una categoría para salir de la búsqueda)</span>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              {SECTIONS_LIST.map((sec) => {
                const isSelected = selectedSection === sec && !isSearching;
                const isPopularSec = sec === 'Populares';
                const is2627 = sec === 'Temporada 26/27';
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setSelectedSection(sec);
                      setFilterOnlyPopular(false);
                      setSearchQuery('');
                    }}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? isPopularSec
                          ? 'bg-orange-500 text-neutral-950 shadow-md shadow-orange-950/40 font-black'
                          : is2627
                          ? 'bg-cyan-500 text-neutral-950 shadow-md'
                          : 'bg-emerald-500 text-neutral-950 shadow-md'
                        : isPopularSec
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
                        : 'bg-neutral-950/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {isPopularSec && <Flame className="h-3.5 w-3.5 fill-current" />}
                    {sec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-4 flex items-center justify-between text-xs text-neutral-400">
          <div>
            {isSearching ? (
              <span>
                Mostrando <strong className="text-emerald-400 font-bold">{filteredProducts.length}</strong> camisetas encontradas de <strong className="text-white">"{searchQuery}"</strong> en toda la tienda
              </span>
            ) : (
              <span>
                Mostrando <strong className="text-white">{filteredProducts.length}</strong> artículos en {selectedSection}
              </span>
            )}
          </div>
          {(filterOnlyPopular || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterOnlyPopular(false);
                setSearchQuery('');
              }}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Ver todas las camisetas / Limpiar búsqueda</span>
            </button>
          )}
        </div>

        {/* Storefront Grid or Table */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
            <Shirt className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">
              {isSearching 
                ? `No se encontraron camisetas de "${searchQuery}"`
                : `No hay prendas en ${selectedSection}`}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {isSearching
                ? isAdminMode
                  ? 'Puedes añadir la primera camiseta de este equipo a la tienda con sus fotos y tallas.'
                  : 'Prueba con otro término de búsqueda o revisa las demás secciones del catálogo.'
                : isAdminMode
                  ? 'Puedes subir tus fotos y poner camisetas en esta categoría haciendo clic en el botón de abajo.'
                  : 'Próximamente nuevas prendas y reposición de stock en esta sección. Consulta el resto de colecciones disponibles.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 transition"
                >
                  <X className="h-4 w-4" />
                  <span>Ver todas las camisetas</span>
                </button>
              )}
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-950/40"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Poner Camiseta {isSearching ? `de ${searchQuery}` : `en ${selectedSection}`}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleAdminMode}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 transition mt-2"
                >
                  <Lock className="h-3 w-3" />
                  <span>¿Eres el vendedor? Desbloquear catálogo con PIN</span>
                </button>
              )}
            </div>
          </div>
        ) : activeView === 'grid' ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdminMode={isAdminMode}
                  onAddToCart={(prod, size, edition) => handleAddToCart(prod, size, edition)}
                  onOpenDetail={(prod) => setSelectedProductForDetail(prod)}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>

            {/* Progressive Load & Pagination Controls */}
            {hasMoreProducts && (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-neutral-850 bg-neutral-900/60 text-center">
                <div className="text-xs text-neutral-400 font-medium">
                  Mostrando <strong className="text-emerald-400 font-bold">{visibleProducts.length}</strong> de <strong className="text-white">{filteredProducts.length}</strong> artículos
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full max-w-xs h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (visibleProducts.length / filteredProducts.length) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black px-6 py-3 text-xs shadow-lg shadow-emerald-950/50 transition transform active:scale-95 cursor-pointer"
                  >
                    <span>Cargar más camisetas (+36)</span>
                    <ChevronRight className="h-4 w-4 stroke-[3]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleShowAll}
                    className="flex items-center gap-1.5 rounded-2xl border border-neutral-700 hover:border-neutral-500 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 font-bold px-4 py-3 text-xs transition cursor-pointer"
                  >
                    <span>Mostrar todas ({filteredProducts.length})</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <TableView
              products={visibleProducts}
              isAdminMode={isAdminMode}
              onAddToCart={(prod, size) => handleAddToCart(prod, size)}
              onOpenDetail={(prod) => setSelectedProductForDetail(prod)}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onUpdatePrice={handleUpdatePrice}
            />
            {hasMoreProducts && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-2xl bg-emerald-500 text-neutral-950 font-bold px-6 py-2.5 text-xs hover:bg-emerald-400 transition"
                >
                  Cargar más camisetas (+36)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-900 bg-neutral-950 pt-10 pb-24 md:pb-10 text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          
          {/* Main Footer Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-white">KitsHub Store</span>
                <span className="inline-flex items-center gap-1 font-black text-[11px] text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Flame className="h-3 w-3 fill-amber-400 text-amber-400" />
                  HECHO BY FUEGO
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Pagos 100% seguros y cifrados con Tarjeta Bancaria, Apple Pay, Google Pay, Crypto y Klarna (3 plazos sin intereses).
              </p>
            </div>

            {/* Legal Navigation Links */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="text-neutral-300 hover:text-emerald-400 transition"
              >
                Términos y Condiciones
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                className="text-neutral-300 hover:text-emerald-400 transition"
              >
                Política de Privacidad
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal('shipping')}
                className="text-neutral-300 hover:text-emerald-400 transition"
              >
                Envíos & Tarifas
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal('returns')}
                className="text-neutral-300 hover:text-emerald-400 transition"
              >
                Devoluciones & Política de Calidad
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal('legal')}
                className="text-neutral-300 hover:text-emerald-400 transition"
              >
                Aviso Legal & Contacto
              </button>
            </div>
          </div>

          {/* Bottom Bar: Badges, Credits and Admin access */}
          <div className="border-t border-neutral-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">🔒</span> Compra 100% Segura & Cifrada SSL
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✈️</span> Envíos con Seguimiento en Tiempo Real
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">🛡️</span> Compensación Garantizada por Defectos de Calidad
              </span>
            </div>

            {/* Credits badge: HECHO BY FUEGO */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 uppercase text-[10px] font-bold tracking-wider">CREADOR:</span>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-amber-500/40 px-3.5 py-1 text-xs font-black text-amber-400 shadow-sm shadow-amber-950/30 hover:border-amber-400 hover:bg-neutral-850 transition">
                <Flame className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse" />
                <span className="tracking-wider uppercase font-black text-amber-400">HECHO BY FUEGO</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdminMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddModalOpen(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition"
                  >
                    + Añadir Camiseta
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOrdersListOpen(true)}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition flex items-center gap-1"
                  >
                    <span>📦 Pedidos ({orders.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentSettingsOpen(true)}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition"
                  >
                    ⚙️ Cobros
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCouponsModalOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition"
                  >
                    🏷️ Cupones
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition flex items-center gap-1"
                    title="Exportar copia de seguridad en JSON"
                  >
                    <span>📥 Exportar Copia</span>
                  </button>
                  <label className="text-purple-400 hover:text-purple-300 font-semibold transition flex items-center gap-1 cursor-pointer" title="Importar copia de seguridad desde JSON">
                    <span>📤 Importar Copia</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleClearCatalog}
                    className="text-rose-400 hover:text-rose-300 font-semibold transition flex items-center gap-1"
                    title="Vaciar todas las camisetas para empezar con un catálogo limpio"
                  >
                    <span>🗑️ Vaciar Catálogo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleAdminMode}
                    className="text-neutral-400 hover:text-red-400 transition"
                  >
                    Cerrar Admin
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleAdminMode}
                  className="text-neutral-600 hover:text-neutral-400 transition flex items-center gap-1"
                  title="Acceso restringido para el propietario de la tienda"
                >
                  <Lock className="h-3 w-3" />
                  <span>Acceso Vendedor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      
      {/* Product Detail & Dorsal Customization Modal */}
      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        isAdminMode={isAdminMode}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Checkout Modal (Card Stripe, Klarna, PayPal, Crypto) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={handleClearCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOrderCompleted={handleOrderCompleted}
        paymentSettings={paymentSettings}
        onOpenSettings={
          isAdminMode
            ? () => {
                setIsCheckoutOpen(false);
                setIsPaymentSettingsOpen(true);
              }
            : undefined
        }
        onOpenLegal={handleOpenLegal}
      />

      {/* Legal Information Modal (Terms, Privacy, Shipping, Returns, Legal Notice) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Payment Settings Modal (User PayPal & Crypto Wallets) */}
      <PaymentSettingsModal
        isOpen={isPaymentSettingsOpen}
        onClose={() => setIsPaymentSettingsOpen(false)}
        settings={paymentSettings}
        onSaveSettings={handleSavePaymentSettings}
      />

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        editingProduct={editingProduct}
        defaultSection={selectedSection}
      />

      {/* Cart & Order Calculator Modal */}
      <OrderCalculatorModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onUpdateCustomization={handleUpdateCartCustomization}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onUpdateProductPrice={handleUpdatePrice}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Confirm Delete Single Product Modal */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDeleteProduct}
        product={productToDelete}
      />

      {/* Confirm Clear All Catalog Modal */}
      <ConfirmDeleteModal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearCatalog}
        isClearAll={true}
      />

      {/* Admin Orders Management Modal */}
      <AdminOrdersModal
        isOpen={isOrdersListOpen}
        onClose={() => setIsOrdersListOpen(false)}
        orders={orders}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onClearAllOrders={handleClearAllOrders}
        onGenerateSampleOrder={handleGenerateSampleOrder}
      />

      {/* Admin Coupons Management Modal */}
      <AdminCouponsModal
        isOpen={isCouponsModalOpen}
        onClose={() => setIsCouponsModalOpen(false)}
        onShowToast={showToast}
      />
      {/* Admin Password Unlock Modal */}
      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Key className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-white">Acceso Propietario</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPinModalOpen(false)}
                className="rounded-full bg-neutral-950 p-1.5 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Introduce tu clave de acceso de administrador para desbloquear la subida de camisetas y el panel de control.
            </p>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Clave Secreta
                </label>
                <div className="relative">
                  <input
                    type={showAdminPinInput ? 'text' : 'password'}
                    autoFocus
                    placeholder="Introduce tu clave de acceso..."
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setAdminPinError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-4 pr-11 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-amber-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPinInput(!showAdminPinInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition"
                    title={showAdminPinInput ? 'Ocultar clave' : 'Ver clave'}
                  >
                    {showAdminPinInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {adminPinError && (
                  <p className="mt-2 text-xs text-rose-400 font-semibold">{adminPinError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPinModalOpen(false)}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-black text-neutral-950 hover:bg-amber-300 transition shadow-md shadow-amber-950/40"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/50 bg-neutral-900/95 px-4 py-2 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md animate-bounce">
          <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Modo sin conexión — Mostrando catálogo guardado</span>
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar (Smartphones & Tablets) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-lg px-3 py-2 md:hidden">
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          {/* Top / Catalog button */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-1.5 text-neutral-400 hover:text-white transition"
          >
            <Shirt className="h-5 w-5" />
            <span className="text-[10px] font-bold mt-0.5">Catálogo</span>
          </button>

          {/* Search focus */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 150, behavior: 'smooth' });
              const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
              if (searchInput) searchInput.focus();
            }}
            className="flex flex-col items-center justify-center p-1.5 text-neutral-400 hover:text-white transition"
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-bold mt-0.5">Buscar</span>
          </button>

          {/* Cart Drawer */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center p-1.5 text-emerald-400 hover:text-emerald-300 transition"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartItemTotalCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-neutral-950 animate-pulse">
                  {cartItemTotalCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-0.5">Cesta</span>
          </button>

          {/* Fast Checkout if cart has items */}
          {cartItemTotalCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-neutral-950 shadow-lg shadow-emerald-950/60 active:scale-95 transition"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pagar ({cartTotalAmount.toFixed(2)}€)</span>
            </button>
          ) : (
            <PWAInstallButton />
          )}
        </div>
      </div>
    </div>
  );
}
