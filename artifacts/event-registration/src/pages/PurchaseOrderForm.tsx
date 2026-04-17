import { useState, FormEvent, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import {
  User, Phone, MapPin, Package, Hash, DollarSign,
  Truck, UserCheck, CreditCard, FileText, ChevronDown, Plus, Trash2,
} from "lucide-react";

interface KledoProduct {
  id: number;
  name: string;
  code: string;
  price: number;
  unit?: { id: number; name: string };
}

interface OrderItem {
  id: string;
  selectedProduct: KledoProduct | null;
  namaProduk: string;
  jumlahProduk: string;
  hargaProduk: string;
}

interface FormData {
  namaKontak: string;
  nomorTelepon: string;
  alamat: string;
  patokanLokasi: string;
  biayaPengiriman: string;
  salesPerson: string;
  metodePembayaran: string;
  keteranganPembayaran: string;
}

const EMPTY_FORM: FormData = {
  namaKontak: "", nomorTelepon: "", alamat: "", patokanLokasi: "",
  biayaPengiriman: "", salesPerson: "", metodePembayaran: "", keteranganPembayaran: "",
};

const newItem = (): OrderItem => ({
  id: Math.random().toString(36).slice(2),
  selectedProduct: null,
  namaProduk: "",
  jumlahProduk: "1",
  hargaProduk: "",
});

function formatRupiahInput(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString("id-ID");
}

function parseRupiah(val: string): number {
  return parseInt(val.replace(/\./g, "").replace(/\D/g, "") || "0", 10);
}

function validate(form: FormData, items: OrderItem[]): string | null {
  if (!form.namaKontak.trim()) return "Nama kontak wajib diisi";
  if (!form.nomorTelepon.trim()) return "Nomor telepon wajib diisi";
  if (!form.alamat.trim()) return "Alamat wajib diisi";
  if (!form.patokanLokasi.trim()) return "Patokan lokasi wajib diisi";
  if (items.length === 0) return "Minimal 1 produk harus dipilih";
  for (let i = 0; i < items.length; i++) {
    if (!items[i].namaProduk.trim()) return `Produk ke-${i + 1}: nama produk wajib dipilih`;
    if (!items[i].jumlahProduk || parseInt(items[i].jumlahProduk) < 1) return `Produk ke-${i + 1}: jumlah tidak valid`;
    if (!items[i].hargaProduk) return `Produk ke-${i + 1}: harga wajib diisi`;
  }
  if (!form.salesPerson.trim()) return "Sales person wajib diisi";
  if (!form.metodePembayaran) return "Metode pembayaran wajib dipilih";
  return null;
}

interface FieldProps {
  icon: React.ReactNode; label: string; hint?: string; required?: boolean;
  hasValue: boolean; isFocused: boolean; children: React.ReactNode; isTextarea?: boolean;
}

function Field({ icon, label, hint, required, hasValue, isFocused, children, isTextarea }: FieldProps) {
  const floated = hasValue || isFocused;
  return (
    <div className="po-field">
      <span className={`po-icon${isFocused ? " po-icon--focus" : ""}${isTextarea ? " po-icon--top" : ""}`}>{icon}</span>
      {children}
      <label className={`po-label${floated ? " po-label--float" : ""}${isFocused ? " po-label--focus" : ""}`}>
        {label}{required && <span className="po-required"> *</span>}
      </label>
      {hint && <p className="po-hint">{hint}</p>}
    </div>
  );
}

// Searchable product combobox
function ProductCombobox({ value, onSelect, onClear, placeholder }: {
  value: KledoProduct | null;
  onSelect: (p: KledoProduct) => void;
  onClear: () => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<KledoProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const doSearch = (q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/api/kledo/products?search=${encodeURIComponent(q)}&page=1`);
        const data = await res.json();
        setResults((data.products || []) as KledoProduct[]);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  };

  const handleSelect = (p: KledoProduct) => {
    onSelect(p); setSearch(""); setOpen(false); setFocused(false);
  };

  const handleClear = () => {
    onClear(); setSearch(""); setResults([]); setOpen(false);
  };

  const floated = !!value || focused || !!search;

  return (
    <div className="po-field po-field--combo" ref={wrapRef} style={{ marginBottom: 0 }}>
      <span className={`po-icon${focused ? " po-icon--focus" : ""}`}><Package size={15} /></span>

      {value ? (
        <div className="po-product-selected" onClick={() => { handleClear(); setFocused(true); }}>
          <div className="po-product-selected-name">{value.name}</div>
          <div className="po-product-selected-meta">{value.code} · Rp {value.price.toLocaleString("id-ID")}</div>
          <button type="button" className="po-product-clear" onClick={e => { e.stopPropagation(); handleClear(); }}>✕</button>
        </div>
      ) : (
        <input
          className="po-input po-combobox-input"
          placeholder=" "
          value={search}
          onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }}
          onFocus={() => { setFocused(true); if (search.length >= 2) setOpen(true); }}
          autoComplete="off"
        />
      )}

      <label className={`po-label${floated ? " po-label--float" : ""}${focused ? " po-label--focus" : ""}`}>
        {placeholder || "Nama Produk"} <span className="po-required">*</span>
      </label>

      {open && results.length > 0 && (
        <ul className="po-combo-dropdown">
          {results.map(p => (
            <li key={p.id} className="po-combo-item" onMouseDown={() => handleSelect(p)}>
              <div className="po-combo-item-name">{p.name}</div>
              <div className="po-combo-item-meta">
                <span className="po-combo-sku">{p.code}</span>
                {p.price > 0 && <span className="po-combo-price">Rp {p.price.toLocaleString("id-ID")}</span>}
                {p.unit && <span className="po-combo-unit">/ {p.unit.name}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && search.length >= 2 && results.length === 0 && (
        <div className="po-combo-empty">Produk tidak ditemukan</div>
      )}
    </div>
  );
}

export default function PurchaseOrderForm() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [focused, setFocused] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [items, setItems] = useState<OrderItem[]>([newItem()]);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));
  const onFocus = (k: keyof FormData) => setFocused(p => ({ ...p, [k]: true }));
  const onBlur = (k: keyof FormData) => setFocused(p => ({ ...p, [k]: false }));

  const updateItem = (id: string, patch: Partial<OrderItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

  const addItem = () => setItems(prev => [...prev, newItem()]);

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSelectProduct = (itemId: string, p: KledoProduct) => {
    updateItem(itemId, {
      selectedProduct: p,
      namaProduk: p.name,
      hargaProduk: p.price > 0 ? p.price.toLocaleString("id-ID") : "",
    });
  };

  const handleClearProduct = (itemId: string) => {
    updateItem(itemId, { selectedProduct: null, namaProduk: "", hargaProduk: "" });
  };

  const ongkir = parseRupiah(form.biayaPengiriman);
  const subtotal = items.reduce((s, it) => {
    const harga = parseRupiah(it.hargaProduk);
    const qty = parseInt(it.jumlahProduk || "0");
    return s + harga * (qty || 1);
  }, 0);
  const total = subtotal + ongkir;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate(form, items);
    if (err) {
      Swal.fire({ icon: "error", title: "Oops!", text: err, confirmButtonColor: "#0097e6" });
      return;
    }

    setSubmitting(true);
    Swal.fire({ title: "Mengirim pesanan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaKontak: form.namaKontak,
          nomorTelepon: form.nomorTelepon,
          alamat: form.alamat,
          patokanLokasi: form.patokanLokasi,
          biayaPengiriman: ongkir || null,
          salesPerson: form.salesPerson,
          metodePembayaran: form.metodePembayaran,
          keteranganPembayaran: form.keteranganPembayaran || null,
          // Items array (mendukung multi-produk)
          items: items.map(it => ({
            namaProduk: it.namaProduk,
            jumlahProduk: parseInt(it.jumlahProduk) || 1,
            hargaProduk: parseRupiah(it.hargaProduk),
            kledoProductId: it.selectedProduct?.id ?? null,
            kledoUnitId: it.selectedProduct?.unit?.id ?? null,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "Pesanan Terkirim!",
          html:
            `<p>Order ID: <b>#${data.orderId}</b></p>` +
            (data.kledoInvoiceNumber
              ? `<p style="margin-top:6px;color:#0097e6;">📑 Invoice Kledo: <b>${data.kledoInvoiceNumber}</b></p>`
              : "") +
            (data.whatsappSent
              ? `<p style="margin-top:6px;color:#27ae60;">✅ Invoice WA telah dikirim ke nomor kamu</p>`
              : `<p style="margin-top:6px;color:#888;">📋 Pesanan telah dicatat</p>`),
          confirmButtonColor: "#0097e6",
        });
        setForm(EMPTY_FORM);
        setFocused({});
        setItems([newItem()]);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: data.error || "Terjadi kesalahan", confirmButtonColor: "#0097e6" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Koneksi Error", text: "Tidak dapat menghubungi server. Coba lagi.", confirmButtonColor: "#0097e6" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="po-bg">
      <div className="po-card">
        <div className="po-header">
          <div className="po-header-icon">🛍️</div>
          <h1 className="po-title">Purchase Order</h1>
          <p className="po-subtitle">
            Form ini dibuat untuk memudahkan tim marketing agar dapat menangani
            lebih dari tiga konsumen dalam satu waktu, serta telah diintegrasikan
            dengan WhatsApp Admin sehingga invoice akan keluar otomatis.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          <div className="po-section-title">👤 Data Pelanggan</div>

          <Field icon={<User size={16}/>} label="Nama Kontak" required hasValue={!!form.namaKontak} isFocused={!!focused.namaKontak}>
            <input className="po-input" placeholder=" " value={form.namaKontak}
              onChange={e => set("namaKontak", e.target.value)}
              onFocus={() => onFocus("namaKontak")} onBlur={() => onBlur("namaKontak")} />
          </Field>

          <Field icon={<Phone size={16}/>} label="Nomor Telepon" hint="Di isikan hanya No contoh: 0878 yang lain kapan kapan" required hasValue={!!form.nomorTelepon} isFocused={!!focused.nomorTelepon}>
            <input className="po-input" placeholder=" " value={form.nomorTelepon}
              onChange={e => set("nomorTelepon", e.target.value)}
              onFocus={() => onFocus("nomorTelepon")} onBlur={() => onBlur("nomorTelepon")} />
          </Field>

          <Field icon={<MapPin size={16}/>} label="Alamat"
            hint="Bisa bantu isikan dengan link google maps. Alamat hanya diisi desa / kelurahan, rt rw, kecamatan"
            required hasValue={!!form.alamat} isFocused={!!focused.alamat} isTextarea>
            <textarea className="po-input po-textarea" placeholder=" " value={form.alamat} rows={3}
              onChange={e => set("alamat", e.target.value)}
              onFocus={() => onFocus("alamat")} onBlur={() => onBlur("alamat")} />
          </Field>

          <Field icon={<MapPin size={16}/>} label="Patokan Rumah / Detail Lokasi"
            hint='Bisa bantu detail alamat rumah. Contoh: depan rumah ada kolam nanti masuk'
            required hasValue={!!form.patokanLokasi} isFocused={!!focused.patokanLokasi} isTextarea>
            <textarea className="po-input po-textarea" placeholder=" " value={form.patokanLokasi} rows={2}
              onChange={e => set("patokanLokasi", e.target.value)}
              onFocus={() => onFocus("patokanLokasi")} onBlur={() => onBlur("patokanLokasi")} />
          </Field>

          {/* Section: Detail Produk (multi-item) */}
          <div className="po-section-title" style={{ marginTop: "24px" }}>🛒 Detail Produk</div>
          <p className="po-hint" style={{ marginBottom: "12px" }}>Ketik minimal 2 huruf untuk mencari produk dari Kledo. Bisa tambah lebih dari 1 produk.</p>

          {items.map((item, idx) => (
            <div key={item.id} className="po-item-block">
              {items.length > 1 && (
                <div className="po-item-header">
                  <span className="po-item-label">Produk {idx + 1}</span>
                  <button type="button" className="po-item-remove" onClick={() => removeItem(item.id)}>
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              )}

              <ProductCombobox
                value={item.selectedProduct}
                onSelect={p => handleSelectProduct(item.id, p)}
                onClear={() => handleClearProduct(item.id)}
                placeholder={items.length > 1 ? `Nama Produk ${idx + 1}` : "Nama Produk"}
              />

              <div className="po-row" style={{ marginTop: "10px" }}>
                <div className="po-field" style={{ marginBottom: 0 }}>
                  <span className="po-icon"><Hash size={15} /></span>
                  <input className="po-input" placeholder=" " type="number" min="1"
                    value={item.jumlahProduk}
                    onChange={e => updateItem(item.id, { jumlahProduk: e.target.value })} />
                  <label className={`po-label${item.jumlahProduk ? " po-label--float" : ""}`}>
                    Jumlah <span className="po-required">*</span>
                  </label>
                </div>

                <div className="po-field" style={{ marginBottom: 0 }}>
                  <span className="po-icon"><DollarSign size={15} /></span>
                  <input className="po-input" placeholder=" " inputMode="numeric"
                    value={item.hargaProduk}
                    onChange={e => updateItem(item.id, { hargaProduk: formatRupiahInput(e.target.value) })} />
                  <label className={`po-label${item.hargaProduk ? " po-label--float" : ""}`}>
                    Harga (Rp) <span className="po-required">*</span>
                  </label>
                </div>
              </div>

              {/* Subtotal per item */}
              {item.hargaProduk && item.jumlahProduk && (
                <div className="po-item-subtotal">
                  {parseInt(item.jumlahProduk) > 1
                    ? `${parseInt(item.jumlahProduk)} × Rp ${parseRupiah(item.hargaProduk).toLocaleString("id-ID")} = `
                    : ""}
                  <strong>Rp {(parseRupiah(item.hargaProduk) * (parseInt(item.jumlahProduk) || 1)).toLocaleString("id-ID")}</strong>
                </div>
              )}
            </div>
          ))}

          {/* Tambah Produk button */}
          <button type="button" className="po-add-item" onClick={addItem}>
            <Plus size={15} /> Tambah Produk
          </button>

          <Field icon={<Truck size={16}/>} label="Biaya Pengiriman (Rp)"
            hint="Opsional — hanya isi jika ada ongkir"
            hasValue={!!form.biayaPengiriman} isFocused={!!focused.biayaPengiriman}>
            <input className="po-input" placeholder=" " inputMode="numeric" value={form.biayaPengiriman}
              onChange={e => set("biayaPengiriman", formatRupiahInput(e.target.value))}
              onFocus={() => onFocus("biayaPengiriman")} onBlur={() => onBlur("biayaPengiriman")} />
          </Field>

          {/* Total preview */}
          {(subtotal > 0 || ongkir > 0) && (
            <div className="po-total-preview">
              {items.length > 1 && <div className="po-total-sub">Subtotal produk: Rp {subtotal.toLocaleString("id-ID")}</div>}
              {ongkir > 0 && <div className="po-total-sub">Ongkir: Rp {ongkir.toLocaleString("id-ID")}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Total Keseluruhan</span>
                <span className="po-total-value">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}

          <div className="po-section-title" style={{ marginTop: "24px" }}>💳 Pembayaran & Sales</div>

          <Field icon={<UserCheck size={16}/>} label="Sales Person"
            hint="Isi nama kamu agar admin tidak kebingungan saat menyerahkan invoice"
            required hasValue={!!form.salesPerson} isFocused={!!focused.salesPerson}>
            <input className="po-input" placeholder=" " value={form.salesPerson}
              onChange={e => set("salesPerson", e.target.value)}
              onFocus={() => onFocus("salesPerson")} onBlur={() => onBlur("salesPerson")} />
          </Field>

          <Field icon={<CreditCard size={16}/>} label="Metode Pembayaran" required hasValue={!!form.metodePembayaran} isFocused={!!focused.metodePembayaran}>
            <div className="po-select-wrap">
              <select className="po-input po-select" value={form.metodePembayaran}
                onChange={e => set("metodePembayaran", e.target.value)}
                onFocus={() => onFocus("metodePembayaran")} onBlur={() => onBlur("metodePembayaran")}>
                <option value="" disabled />
                <option value="CASH">CASH</option>
                <option value="Debit">Debit</option>
                <option value="Transfer">Transfer</option>
              </select>
              <ChevronDown size={14} className="po-select-arrow" />
            </div>
          </Field>

          <Field icon={<FileText size={16}/>} label="Keterangan Pembayaran"
            hint="Silahkan isi (opsional)"
            hasValue={!!form.keteranganPembayaran} isFocused={!!focused.keteranganPembayaran} isTextarea>
            <textarea className="po-input po-textarea" placeholder=" " value={form.keteranganPembayaran} rows={2}
              onChange={e => set("keteranganPembayaran", e.target.value)}
              onFocus={() => onFocus("keteranganPembayaran")} onBlur={() => onBlur("keteranganPembayaran")} />
          </Field>

          <button type="submit" disabled={submitting} className="po-btn">
            {submitting ? "Mengirim..." : "📤 Kirim Pesanan"}
          </button>
        </form>
      </div>
    </div>
  );
}
