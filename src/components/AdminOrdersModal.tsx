import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Package,
  Search,
  Download,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  DollarSign,
  Tag,
  Plus,
  Edit3,
  Percent,
  ToggleLeft,
  ToggleRight,
  Gift
} from 'lucide-react';
import { Order, Coupon } from '../types';
import { getProductImageUrl } from '../utils/imageUrl';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders?: () => void;
  onGenerateSampleOrder?: () => void;
  coupons?: Coupon[];
  onSaveCoupon?: (coupon: Coupon) => void;
  onDeleteCoupon?: (couponId: string) => void;
}

type OrderFilterStatus = 'all' | 'paid' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type AdminTab = 'orders' | 'coupons';

export const AdminOrdersModal: React.FC<AdminOrdersModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  onUpdateOrder,
  onDeleteOrder,
  onClearAllOrders,
  onGenerateSampleOrder,
  coupons: initialCoupons,
  onSaveCoupon: parentSaveCoupon,
  onDeleteCoupon: parentDeleteCoupon,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  
  // Orders State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [editingTracking, setEditingTracking] = useState<{ [orderId: string]: string }>({});
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    if (initialCoupons && initialCoupons.length > 0) return initialCoupons;
    try {
      const saved = localStorage.getItem('kitshub_coupons_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [couponSearch, setCouponSearch] = useState('');

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number>(10);
  const [formMinSpend, setFormMinSpend] = useState<string>('');
  const [formMaxUses, setFormMaxUses] = useState<string>('');
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formActive, setFormActive] = useState<boolean>(true);

  // Sync external coupons when props change
  useEffect(() => {
    if (initialCoupons) {
      setCoupons(initialCoupons);
    }
  }, [initialCoupons]);

  // Load coupons from server on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/coupons')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCoupons(data);
            localStorage.setItem('kitshub_coupons_v1', JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const saveCouponToServerAndLocal = async (updatedList: Coupon[]) => {
    setCoupons(updatedList);
    try {
      localStorage.setItem('kitshub_coupons_v1', JSON.stringify(updatedList));
      await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList),
      });
    } catch (e) {
      console.error('Error syncing coupons:', e);
    }
  };

  const handleOpenNewCoupon = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinSpend('');
    setFormMaxUses('');
    setFormExpiresAt('');
    setFormDescription('');
    setFormActive(true);
    setIsCouponFormOpen(true);
  };

  const handleOpenEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormType(c.type || 'percentage');
    setFormValue(c.value);
    setFormMinSpend(c.minSpend ? String(c.minSpend) : '');
    setFormMaxUses(c.maxUses ? String(c.maxUses) : '');
    setFormExpiresAt(c.expiresAt || '');
    setFormDescription(c.description || '');
    setFormActive(c.active !== false);
    setIsCouponFormOpen(true);
  };

  const handleSaveCouponForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      alert('Por favor, introduce un código de cupón válido.');
      return;
    }
    if (formValue <= 0) {
      alert('El valor del descuento debe ser mayor que 0.');
      return;
    }

    const newCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `cup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code: cleanCode,
      type: formType,
      value: Number(formValue),
      minSpend: formMinSpend ? Number(formMinSpend) : undefined,
      maxUses: formMaxUses ? Number(formMaxUses) : undefined,
      usageCount: editingCoupon ? (editingCoupon.usageCount || 0) : 0,
      description: formDescription.trim(),
      active: formActive,
      expiresAt: formExpiresAt || undefined,
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString(),
    };

    let updatedList: Coupon[];
    if (editingCoupon) {
      updatedList = coupons.map((c) => (c.id === editingCoupon.id ? newCoupon : c));
    } else {
      // Check duplicate code
      if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
        alert(`Ya existe un cupón con el código ${cleanCode}. Modifícalo o usa otro nombre.`);
        return;
      }
      updatedList = [newCoupon, ...coupons];
    }

    saveCouponToServerAndLocal(updatedList);
    if (parentSaveCoupon) parentSaveCoupon(newCoupon);
    setIsCouponFormOpen(false);
  };

  const handleToggleCouponActive = (coupon: Coupon) => {
    const updated = { ...coupon, active: !coupon.active };
    const updatedList = coupons.map((c) => (c.id === coupon.id ? updated : c));
    saveCouponToServerAndLocal(updatedList);
    if (parentSaveCoupon) parentSaveCoupon(updated);
  };

  const handleDeleteCouponItem = async (couponId: string) => {
    const updatedList = coupons.filter((c) => c.id !== couponId);
    saveCouponToServerAndLocal(updatedList);
    if (parentDeleteCoupon) parentDeleteCoupon(couponId);
    try {
      await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
    } catch {}
    setCouponToDelete(null);
  };

  // Safe date formatter that will never crash on invalid date strings
  const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // ignore error
    }
    return dateStr;
  };

  // Safe compute key sales metrics
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, o) => {
      const isPaid = o?.paymentStatus === 'paid' || o?.paymentStatus === 'verified' || o?.orderStatus === 'paid' || o?.orderStatus === 'shipped' || o?.orderStatus === 'delivered';
      return acc + (isPaid ? (Number(o?.total) || 0) : 0);
    }, 0);
  }, [orders]);

  const totalUnitsSold = useMemo(() => {
    return orders.reduce((acc, o) => {
      const items = Array.isArray(o?.items) ? o.items : [];
      return acc + items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
    }, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const status = o?.orderStatus || o?.paymentStatus || 'pending';
      return status === 'pending' && o?.orderStatus !== 'cancelled';
    }).length;
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (filterStatus !== 'all') {
        const status = order.orderStatus || order.paymentStatus || 'pending';
        if (filterStatus === 'paid' && status !== 'paid' && status !== 'verified') return false;
        if (filterStatus === 'pending' && status !== 'pending') return false;
        if (filterStatus === 'processing' && status !== 'processing') return false;
        if (filterStatus === 'shipped' && status !== 'shipped') return false;
        if (filterStatus === 'delivered' && status !== 'delivered') return false;
        if (filterStatus === 'cancelled' && status !== 'cancelled') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customerName = (order.customer?.name || '').toLowerCase();
        const customerEmail = (order.customer?.email || '').toLowerCase();
        const customerPhone = (order.customer?.phone || '').toLowerCase();
        const orderId = (order.id || '').toLowerCase();
        const tracking = (order.trackingNumber || '').toLowerCase();
        const city = (order.customer?.city || '').toLowerCase();

        return (
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          customerPhone.includes(query) ||
          orderId.includes(query) ||
          tracking.includes(query) ||
          city.includes(query)
        );
      }

      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    if (!couponSearch.trim()) return coupons;
    const q = couponSearch.toLowerCase();
    return coupons.filter(
      (c) => c.code.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [coupons, couponSearch]);

  const activeCouponsCount = useMemo(() => {
    return coupons.filter((c) => c.active !== false).length;
  }, [coupons]);

  const totalCouponUsages = useMemo(() => {
    return coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  }, [coupons]);

  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'ID Pedido',
      'Fecha',
      'Estado Pedido',
      'Estado Pago',
      'Metodo Pago',
      'Cliente',
      'Email',
      'Telefono',
      'Direccion',
      'Ciudad',
      'Codigo Postal',
      'Pais',
      'Total (€)',
      'Subtotal (€)',
      'Envio (€)',
      'Tracking CTT',
      'Prendas'
    ];

    const rows = orders.map(o => {
      const itemsSummary = (o.items || [])
        .map(i => `${i.product?.title || 'Prenda'} (Talla: ${i.size}, Versión: ${i.edition || 'Fan'}${i.customization?.name ? `, Dorsal: ${i.customization.name} #${i.customization.number}` : ''}) x${i.quantity}`)
        .join(' | ');

      return [
        `"${o.id}"`,
        `"${formatDisplayDate(o.createdAt)}"`,
        `"${o.orderStatus || 'pending'}"`,
        `"${o.paymentStatus || 'pending'}"`,
        `"${o.paymentMethod || 'card'}"`,
        `"${o.customer?.name || ''}"`,
        `"${o.customer?.email || ''}"`,
        `"${o.customer?.phone || ''}"`,
        `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
        `"${o.customer?.city || ''}"`,
        `"${o.customer?.postalCode || ''}"`,
        `"${o.customer?.country || 'España'}"`,
        o.total?.toFixed(2) || '0.00',
        o.subtotal?.toFixed(2) || '0.00',
        o.shipping?.toFixed(2) || '0.00',
        `"${o.trackingNumber || ''}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_kitshub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyOrderSummary = (order: Order) => {
    const itemsList = (order.items || []).map(i => {
      let custom = '';
      if (i.customization?.name || i.customization?.number) {
        custom = ` -> Dorsal: ${i.customization.name || ''} #${i.customization.number || ''}`;
      }
      if (i.customization?.patch) {
        custom += ` [Parche: ${i.customization.patch}]`;
      }
      return `- ${i.product?.title || 'Camiseta'} (${i.edition || 'FAN'}, Talla ${i.size}) x${i.quantity}${custom}`;
    }).join('\n');

    const summary = `📦 PEDIDO #${order.id}
📅 Fecha: ${formatDisplayDate(order.createdAt)}
👤 Cliente: ${order.customer?.name || 'Cliente'}
📞 Teléfono: ${order.customer?.phone || 'No especificado'}
📧 Email: ${order.customer?.email || 'No especificado'}
📍 Dirección: ${order.customer?.address || ''}, ${order.customer?.city || ''} (${order.customer?.postalCode || ''}) - ${order.customer?.country || 'España'}
🚚 Envío: CTT Express 24/48h
${order.trackingNumber ? `📍 Nº Seguimiento CTT: ${order.trackingNumber}` : '⏳ Nº Seguimiento: Pendiente de asignación'}
💰 Total: ${order.total?.toFixed(2)} € (${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'TARJETA'})

👕 ARTÍCULOS:
${itemsList}`;

    navigator.clipboard.writeText(summary);
    setCopiedId(`msg-${order.id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Pagado
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
            <Clock className="h-3 w-3" /> En Preparación
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/30">
            <Truck className="h-3 w-3" /> Enviado (CTT)
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
            <Check className="h-3.5 w-3.5" /> Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
            <AlertCircle className="h-3 w-3" /> Cancelado
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" /> Pendiente de Pago
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">💳 Tarjeta</span>;
      case 'bizum':
        return <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60">📱 Bizum</span>;
      case 'apple_pay':
        return <span className="text-[11px] font-semibold text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700"> Apple Pay</span>;
      case 'klarna':
        return <span className="text-[11px] font-semibold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-800/60">🛍️ Klarna</span>;
      case 'crypto':
        return <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">₿ Cripto</span>;
      case 'paypal':
        return <span className="text-[11px] font-semibold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/60">🅿️ PayPal</span>;
      default:
        return <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-md">{method}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-200">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER & MAIN TABS                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md">
              {activeTab === 'orders' ? <Package className="h-6 w-6" /> : <Tag className="h-6 w-6 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {activeTab === 'orders' ? 'Gestión de Pedidos' : 'Cupones y Códigos Promocionales'}
                </h2>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Panel Propietario
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {activeTab === 'orders'
                  ? 'Supervisa compras, clientes, estados y emite códigos de seguimiento CTT Express.'
                  : 'Crea, edita y administra tus propios códigos de descuento sin cupones automáticos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'orders' && orders.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition shadow-sm"
                title="Exportar pedidos en archivo Excel / CSV"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}

            {activeTab === 'coupons' && (
              <button
                type="button"
                onClick={handleOpenNewCoupon}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3.5 py-2 text-xs font-black transition shadow-md"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Crear Cupón</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              title="Cerrar panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION SELECTOR                                                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-neutral-950/90 border-b border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'orders'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>📦 Pedidos de Clientes ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'coupons'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>🎟️ Cupones de Descuento ({coupons.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ORDERS DASHBOARD                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* METRICS DASHBOARD ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-neutral-950/40 border-b border-neutral-800/80 text-xs">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Facturación Total</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-400">
                  {totalRevenue.toFixed(2)} €
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Pedidos Totales</span>
                  <Package className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {orders.length}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Prendas Vendidas</span>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-300">
                  {totalUnitsSold}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Pendientes</span>
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-purple-300">
                  {pendingOrdersCount}
                </div>
              </div>
            </div>

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="p-4 sm:px-6 border-b border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/90">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, ID, tracking..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-8 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`rounded-xl px-3 py-1.5 font-bold transition whitespace-nowrap ${
                    filterStatus === 'all'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('paid')}
                  className={`rounded-xl px-3 py-1.5 font-bold transition whitespace-nowrap ${
                    filterStatus === 'paid'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Pagados
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('processing')}
                  className={`rounded-xl px-3 py-1.5 font-bold transition whitespace-nowrap ${
                    filterStatus === 'processing'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Preparación
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('shipped')}
                  className={`rounded-xl px-3 py-1.5 font-bold transition whitespace-nowrap ${
                    filterStatus === 'shipped'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Enviados
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('pending')}
                  className={`rounded-xl px-3 py-1.5 font-bold transition whitespace-nowrap ${
                    filterStatus === 'pending'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Pendientes
                </button>
              </div>
            </div>

            {/* ORDERS LIST */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-800/60 text-neutral-500 mb-3 border border-neutral-700/50">
                    <Package className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {searchQuery ? 'No se encontraron pedidos con ese filtro' : 'Aún no hay pedidos registrados'}
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4">
                    {searchQuery
                      ? 'Prueba a buscar con otro nombre, ID o elimina los filtros de búsqueda.'
                      : 'Cuando los clientes finalicen una compra por Tarjeta, Bizum o Klarna, aparecerán aquí con todos sus datos.'}
                  </p>
                  {orders.length === 0 && onGenerateSampleOrder && (
                    <button
                      type="button"
                      onClick={onGenerateSampleOrder}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 text-xs font-bold text-emerald-400 transition"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Generar Pedido de Demostración</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const status = order.orderStatus || order.paymentStatus || 'pending';
                  const itemsCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden transition-all hover:border-neutral-700"
                    >
                      {/* Card Summary Row */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-neutral-900/40 transition select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white">{order.customer?.name || 'Cliente'}</span>
                              <span className="font-mono text-[11px] text-neutral-500">#{order.id}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                              <span>{formatDisplayDate(order.createdAt)}</span>
                              <span>•</span>
                              <span>{itemsCount} {itemsCount === 1 ? 'prenda' : 'prendas'}</span>
                              <span>•</span>
                              <span>{order.customer?.city || 'España'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-900">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            {getPaymentMethodBadge(order.paymentMethod || 'card')}
                          </div>

                          <div className="text-right pl-2 sm:pl-4 border-l border-neutral-800">
                            <span className="font-black text-sm sm:text-base text-emerald-400">
                              {(order.total || 0).toFixed(2)} €
                            </span>
                          </div>

                          <div className="text-neutral-500 pl-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-neutral-900/60 border-t border-neutral-800/80 space-y-4 text-xs">
                          {/* Shipping & Customer Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800">
                            <div>
                              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                                Dirección de Entrega
                              </h4>
                              <p className="text-neutral-200 font-medium">{order.customer?.name}</p>
                              <p className="text-neutral-400">{order.customer?.address}</p>
                              <p className="text-neutral-400">
                                {order.customer?.city} ({order.customer?.postalCode}) - {order.customer?.country || 'España'}
                              </p>
                              {order.customer?.notes && (
                                <p className="text-amber-300 mt-1 italic text-[11px]">Nota: {order.customer.notes}</p>
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <Phone className="h-3.5 w-3.5 text-cyan-400" />
                                Contacto y Pago
                              </h4>
                              <p className="text-neutral-300">📞 Tel: {order.customer?.phone || 'No aportado'}</p>
                              <p className="text-neutral-300">📧 Email: {order.customer?.email || 'No aportado'}</p>
                              <p className="text-neutral-400 mt-1">
                                Método: {order.paymentMethod?.toUpperCase()} | Estado Pago: <span className="text-emerald-400 font-bold">{order.paymentStatus?.toUpperCase() || 'COMPLETADO'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Items List */}
                          <div>
                            <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-amber-400" />
                              Artículos ({itemsCount})
                            </h4>
                            <div className="space-y-2">
                              {(order.items || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-950/40 border border-neutral-800"
                                >
                                  <div className="flex items-center gap-3">
                                    {item.product?.imageUrl && (
                                      <img
                                        src={getProductImageUrl(item.product.imageUrl)}
                                        alt={item.product.title}
                                        className="h-10 w-10 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                                      />
                                    )}
                                    <div>
                                      <p className="font-bold text-white text-xs">{item.product?.title || 'Camiseta'}</p>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                                        <span className="bg-neutral-800 px-1.5 py-0.2 rounded font-bold text-neutral-200">
                                          Talla: {item.size}
                                        </span>
                                        <span className="bg-neutral-800 px-1.5 py-0.2 rounded font-bold text-amber-300">
                                          {item.edition || 'FAN VERSION'}
                                        </span>
                                        {item.customization?.name && (
                                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
                                            Dorsal: {item.customization.name} #{item.customization.number || ''}
                                          </span>
                                        )}
                                        {item.customization?.patch && (
                                          <span className="bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded">
                                            Parche: {item.customization.patch}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-bold text-white">x{item.quantity || 1}</span>
                                    <p className="text-[11px] text-emerald-400 font-bold">
                                      {((item.price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)} €
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tracking & Status Management */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-neutral-400">Cambiar Estado:</span>
                              <select
                                value={order.orderStatus || order.paymentStatus || 'pending'}
                                onChange={(e) => {
                                  onUpdateOrder({
                                    ...order,
                                    orderStatus: e.target.value as any,
                                  });
                                }}
                                className="rounded-xl border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="paid">✅ Pagado</option>
                                <option value="processing">⚙️ En Preparación</option>
                                <option value="shipped">🚚 Enviado (CTT)</option>
                                <option value="delivered">📦 Entregado</option>
                                <option value="cancelled">❌ Cancelado</option>
                                <option value="pending">⏳ Pendiente de Pago</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyOrderSummary(order)}
                                className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-200 hover:bg-neutral-800 transition"
                              >
                                {copiedId === `msg-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedId === `msg-${order.id}` ? '¡Copiado!' : 'Copiar Resumen'}</span>
                              </button>

                              {orderToDelete === order.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteOrder(order.id);
                                      setOrderToDelete(null);
                                    }}
                                    className="rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(null)}
                                    className="rounded-xl bg-neutral-800 px-2 py-1.5 text-xs text-neutral-400 hover:text-white"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(order.id)}
                                  className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-xl hover:bg-rose-950/30 transition"
                                  title="Eliminar pedido"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COUPONS MANAGEMENT (CREAR / EDITAR / BORRAR CUPONES)               */}
        {/* ========================================================================= */}
        {activeTab === 'coupons' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* COUPONS STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-neutral-950/40 border-b border-neutral-800/80 text-xs">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Total Cupones</span>
                  <Tag className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {coupons.length}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Cupones Activos</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-400">
                  {activeCouponsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Usos Canjeados</span>
                  <Gift className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-lg sm:text-xl font-black text-purple-300">
                  {totalCouponUsages}
                </div>
              </div>
            </div>

            {/* SEARCH & NEW COUPON BAR */}
            <div className="p-4 sm:px-6 border-b border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/90">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Buscar cupón por código o nota..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-8 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                />
                {couponSearch && (
                  <button
                    type="button"
                    onClick={() => setCouponSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenNewCoupon}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 text-xs font-black transition shadow-md w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>+ Crear Nuevo Cupón</span>
              </button>
            </div>

            {/* COUPONS LIST */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-800/60 text-amber-400 mb-3 border border-neutral-700/50">
                    <Tag className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {couponSearch ? 'No se encontraron cupones con ese término' : 'No tienes ningún cupón creado'}
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4">
                    {couponSearch
                      ? 'Prueba con otro código o limpia el buscador.'
                      : 'Todos los cupones anteriores fueron eliminados. Crea tus propios códigos para promociones en Instagram, TikTok o clientes VIP.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewCoupon}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2.5 text-xs font-black transition shadow"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Crear Mi Primer Cupón</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < new Date().setHours(0,0,0,0);
                    const isOverLimit = coupon.maxUses && (coupon.usageCount || 0) >= coupon.maxUses;

                    return (
                      <div
                        key={coupon.id}
                        className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                          coupon.active && !isExpired && !isOverLimit
                            ? 'bg-neutral-950/80 border-neutral-800 hover:border-amber-500/50'
                            : 'bg-neutral-950/40 border-neutral-800/50 opacity-70'
                        }`}
                      >
                        <div>
                          {/* Card Top: Code & Status */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-amber-300 tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  setCopiedId(`cup-${coupon.id}`);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition"
                                title="Copiar código al portapapeles"
                              >
                                {copiedId === `cup-${coupon.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>

                            <div>
                              {coupon.active === false ? (
                                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                                  Inactivo
                                </span>
                              ) : isExpired ? (
                                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                                  Caducado
                                </span>
                              ) : isOverLimit ? (
                                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                                  Agotado
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                  Activo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Discount Value */}
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-xl font-black text-white">
                              {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value.toFixed(2)} € OFF`}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {coupon.type === 'percentage' ? 'Descuento porcentual' : 'Descuento directo en euros'}
                            </span>
                          </div>

                          {/* Description */}
                          {coupon.description && (
                            <p className="text-xs text-neutral-300 italic mb-2">
                              "{coupon.description}"
                            </p>
                          )}

                          {/* Badges / Conditions */}
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-neutral-400 mt-2">
                            {coupon.minSpend && coupon.minSpend > 0 ? (
                              <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                                Gasto mín: <strong className="text-white">{coupon.minSpend.toFixed(2)} €</strong>
                              </span>
                            ) : (
                              <span className="bg-neutral-900/60 text-neutral-500 px-2 py-0.5 rounded-md">
                                Sin mínimo de compra
                              </span>
                            )}

                            {coupon.expiresAt ? (
                              <span className={`px-2 py-0.5 rounded-md border ${isExpired ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-neutral-900 border-neutral-800 text-neutral-300'}`}>
                                Expira: {coupon.expiresAt}
                              </span>
                            ) : (
                              <span className="bg-neutral-900/60 text-neutral-500 px-2 py-0.5 rounded-md">
                                Sin caducidad
                              </span>
                            )}

                            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                              Usos: <strong className="text-white">{coupon.usageCount || 0}</strong> {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-neutral-800/80">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(coupon)}
                            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition"
                          >
                            {coupon.active ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-emerald-400" />
                                <span className="text-[11px]">Desactivar</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-neutral-500" />
                                <span className="text-[11px]">Activar</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCoupon(coupon)}
                              className="flex items-center gap-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-bold text-neutral-200 transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>

                            {couponToDelete === coupon.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCouponItem(coupon.id)}
                                  className="rounded-xl bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-500"
                                >
                                  Borrar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCouponToDelete(null)}
                                  className="rounded-xl bg-neutral-800 px-1.5 py-1 text-xs text-neutral-400 hover:text-white"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCouponToDelete(coupon.id)}
                                className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-xl hover:bg-rose-950/30 transition"
                                title="Eliminar cupón"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL / FORM POPUP FOR CREATE / EDIT COUPON                               */}
        {/* ========================================================================= */}
        {isCouponFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    {editingCoupon ? 'Editar Cupón de Descuento' : 'Crear Nuevo Cupón de Descuento'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCouponFormOpen(false)}
                  className="rounded-full bg-neutral-950 p-1.5 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCouponForm} className="space-y-3.5 text-xs">
                {/* Código */}
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase tracking-wider text-[11px]">
                    Código del Cupón *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="Ej: VERANO20, VIP15, OFERTA10"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm font-mono font-black text-amber-300 uppercase placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Los clientes introducirán este código en la cesta o en el detalle del producto.
                  </p>
                </div>

                {/* Tipo de Descuento */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1 uppercase tracking-wider text-[11px]">
                      Tipo de Descuento *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                    >
                      <option value="percentage">Porcentaje (% de descuento)</option>
                      <option value="fixed">Fijo (€ directos de descuento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-bold mb-1 uppercase tracking-wider text-[11px]">
                      Valor del Descuento *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        max={formType === 'percentage' ? 100 : 999}
                        required
                        value={formValue}
                        onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs font-black text-white focus:border-amber-400 focus:outline-none pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-neutral-400">
                        {formType === 'percentage' ? '%' : '€'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Condiciones opcionales: Gasto Mínimo & Límite de Usos */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1 text-[11px]">
                      Gasto Mínimo en Cesta (€) (Opcional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formMinSpend}
                      onChange={(e) => setFormMinSpend(e.target.value)}
                      placeholder="Ej: 30 (dejar vacío si no hay)"
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-medium mb-1 text-[11px]">
                      Límite Máximo de Usos (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMaxUses}
                      onChange={(e) => setFormMaxUses(e.target.value)}
                      placeholder="Ej: 50 (ilimitado si vacío)"
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Fecha de Expiración */}
                <div>
                  <label className="block text-neutral-400 font-medium mb-1 text-[11px]">
                    Fecha de Caducidad (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Descripción / Nota interna */}
                <div>
                  <label className="block text-neutral-400 font-medium mb-1 text-[11px]">
                    Descripción o Nota Interna (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ej: Campaña de Instagram @tienda"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Estado Activo */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <p className="font-bold text-white text-xs">Cupón Activo</p>
                    <p className="text-[10px] text-neutral-400">Los clientes podrán canjearlo si está activo.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsCouponFormOpen(false)}
                    className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-black text-neutral-950 shadow-md transition"
                  >
                    {editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FOOTER BAR                                                               */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>🔒 Panel exclusivo para el administrador. Datos sincronizados en servidor.</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'orders' && orders.length > 0 && onClearAllOrders && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas vaciar el historial de todos los pedidos? Esta acción no se puede deshacer.')) {
                    onClearAllOrders();
                  }
                }}
                className="text-neutral-500 hover:text-rose-400 transition text-[11px]"
              >
                Vaciar historial de pedidos
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-neutral-800 px-4 py-2 font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
            >
              Cerrar Panel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
