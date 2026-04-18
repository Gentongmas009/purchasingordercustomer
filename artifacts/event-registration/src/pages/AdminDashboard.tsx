import { useEffect, useState } from "react";

interface Order {
  id: number;
  orderId: string;
  namaKontak: string;
  nomorTelepon: string;
  alamat: string;
  patokanLokasi: string;
  namaProduk: string;
  jumlahProduk: number;
  hargaProduk: number;
  biayaPengiriman: number | null;
  totalHarga: number;
  salesPerson: string;
  metodePembayaran: string;
  keteranganPembayaran: string | null;
  whatsappSent: string;
  statusPengiriman: string;
  driverName: string | null;
  createdAt: string;
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
const STATUS_LIST = ["Menunggu", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const STATUS_COLOR: Record<string, string> = {
  Menunggu:   "#f59e0b",
  Diproses:   "#3b82f6",
  Dikirim:    "#8b5cf6",
  Selesai:    "#10b981",
  Dibatalkan: "#ef4444",
};

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      background: STATUS_COLOR[status] ?? "#6b7280",
      color: "#fff",
      borderRadius: "12px",
      padding: "2px 10px",
      fontSize: "12px",
      fontWeight: 600,
    }}>{status}</span>
  );
}

function PayBadge({ metode }: { metode: string }) {
  const map: Record<string, string> = { CASH: "adm-pay--cash", Debit: "adm-pay--debit", Transfer: "adm-pay--transfer" };
  return <span className={`adm-pay ${map[metode] ?? ""}`}>{metode}</span>;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"pesanan" | "pengiriman">("pesanan");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${baseUrl}/api/orders`);
      if (!res.ok) throw new Error("Gagal memuat data");
      setOrders(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error tidak diketahui");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o =>
    [o.namaKontak, o.nomorTelepon, o.namaProduk, o.salesPerson, o.orderId]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const totalPendapatan = filtered.reduce((s, o) => s + o.totalHarga, 0);

  const updateStatus = async (id: number, statusPengiriman: string, driverName?: string) => {
    setUpdatingId(id);
    try {
      await fetch(`${baseUrl}/api/orders/${id}/pengiriman`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPengiriman, ...(driverName !== undefined ? { driverName } : {}) }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, statusPengiriman, ...(driverName !== undefined ? { driverName } : {}) } : o));
    } finally { setUpdatingId(null); }
  };

  return (
    <div className="adm-bg">
      <div className="adm-wrap">
        <div className="adm-header">
          <div>
            <h1 className="adm-title">📦 Dashboard Admin</h1>
            <p className="adm-sub">Kelola pesanan & pengiriman dalam satu tempat</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="adm-refresh" onClick={fetchOrders}>🔄 Refresh</button>
            <button className="adm-refresh" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={onLogout}>Keluar</button>
          </div>
        </div>

        {/* Stats */}
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.length}</div>
            <div className="adm-stat-label">Total Order</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.filter(o => o.statusPengiriman === "Dikirim").length}</div>
            <div className="adm-stat-label">Sedang Dikirim</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.filter(o => o.statusPengiriman === "Selesai").length}</div>
            <div className="adm-stat-label">Selesai</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val" style={{ fontSize: "14px" }}>{formatRupiah(totalPendapatan)}</div>
            <div className="adm-stat-label">Total Pendapatan</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          <button
            className={`adm-tab${tab === "pesanan" ? " adm-tab--active" : ""}`}
            onClick={() => setTab("pesanan")}
          >📋 Pesanan Masuk</button>
          <button
            className={`adm-tab${tab === "pengiriman" ? " adm-tab--active" : ""}`}
            onClick={() => setTab("pengiriman")}
          >🚚 Kelola Pengiriman</button>
        </div>

        {/* Search */}
        <div className="adm-search-wrap">
          <span className="adm-search-icon">🔍</span>
          <input
            className="adm-search"
            placeholder="Cari nama, nomor, produk, sales..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="adm-clear" onClick={() => setSearch("")}>✕</button>}
        </div>

        {loading ? (
          <div className="adm-empty">⏳ Memuat data...</div>
        ) : error ? (
          <div className="adm-empty adm-error">⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">{search ? "Tidak ada hasil" : "Belum ada order"}</div>
        ) : tab === "pesanan" ? (
          /* ── Tab Pesanan Masuk ── */
          <div className="adm-list">
            {filtered.map(order => (
              <div key={order.id} className="adm-card">
                <div className="adm-card-top">
                  <div className="adm-card-id">#{order.orderId}</div>
                  <div className="adm-card-meta">
                    <StatusBadge status={order.statusPengiriman} />
                    <PayBadge metode={order.metodePembayaran} />
                    <span className={`adm-badge ${order.whatsappSent === "true" ? "adm-badge--ok" : "adm-badge--fail"}`}>
                      {order.whatsappSent === "true" ? "✅ WA Terkirim" : "❌ WA Gagal"}
                    </span>
                  </div>
                </div>
                <div className="adm-card-grid">
                  <div>
                    <div className="adm-row"><span className="adm-lbl">👤 Nama</span><span className="adm-val adm-bold">{order.namaKontak}</span></div>
                    <div className="adm-row"><span className="adm-lbl">📱 Telepon</span>
                      <span className="adm-val">
                        <a href={`https://wa.me/${order.nomorTelepon.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="adm-walink">{order.nomorTelepon}</a>
                      </span>
                    </div>
                    <div className="adm-row"><span className="adm-lbl">📍 Alamat</span><span className="adm-val">{order.alamat}</span></div>
                    <div className="adm-row"><span className="adm-lbl">🗺️ Patokan</span><span className="adm-val">{order.patokanLokasi}</span></div>
                    <div className="adm-row"><span className="adm-lbl">🧑 Sales</span><span className="adm-val">{order.salesPerson}</span></div>
                    <div className="adm-row"><span className="adm-lbl">🕐 Waktu</span><span className="adm-val adm-muted">{formatDate(order.createdAt)}</span></div>
                    {order.driverName && <div className="adm-row"><span className="adm-lbl">🚗 Driver</span><span className="adm-val">{order.driverName}</span></div>}
                  </div>
                  <div className="adm-price-col">
                    <div className="adm-row"><span className="adm-lbl">🛒 Produk</span><span className="adm-val">{order.namaProduk}</span></div>
                    <div className="adm-row"><span className="adm-lbl">📦 Jumlah</span><span className="adm-val">{order.jumlahProduk} unit</span></div>
                    <div className="adm-row"><span className="adm-lbl">💰 Harga</span><span className="adm-val">{formatRupiah(order.hargaProduk)}</span></div>
                    {order.biayaPengiriman ? <div className="adm-row"><span className="adm-lbl">🚚 Ongkir</span><span className="adm-val">{formatRupiah(order.biayaPengiriman)}</span></div> : null}
                    {order.keteranganPembayaran ? <div className="adm-row"><span className="adm-lbl">📝 Ket</span><span className="adm-val">{order.keteranganPembayaran}</span></div> : null}
                    <div className="adm-total-row"><span>TOTAL</span><span className="adm-total-val">{formatRupiah(order.totalHarga)}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Tab Kelola Pengiriman ── */
          <div className="adm-list">
            {filtered.map(order => (
              <div key={order.id} className="adm-card">
                <div className="adm-card-top">
                  <div>
                    <div className="adm-card-id">#{order.orderId}</div>
                    <div style={{ fontSize: "13px", color: "#555", marginTop: "2px" }}>
                      {order.namaKontak} — {order.nomorTelepon}
                    </div>
                  </div>
                  <StatusBadge status={order.statusPengiriman} />
                </div>

                <div style={{ padding: "0 12px 4px", fontSize: "13px", color: "#666" }}>
                  📍 {order.alamat}{order.patokanLokasi ? ` (${order.patokanLokasi})` : ""}
                </div>
                <div style={{ padding: "0 12px 8px", fontSize: "13px", color: "#666" }}>
                  🛒 {order.namaProduk} × {order.jumlahProduk} — <strong>{formatRupiah(order.totalHarga)}</strong>
                </div>

                <div className="adm-pengiriman-row">
                  <div className="adm-pengiriman-group">
                    <label className="adm-pengiriman-label">Status Pengiriman</label>
                    <select
                      className="adm-pengiriman-select"
                      value={order.statusPengiriman}
                      disabled={updatingId === order.id}
                      onChange={e => updateStatus(order.id, e.target.value, order.driverName ?? undefined)}
                    >
                      {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="adm-pengiriman-group">
                    <label className="adm-pengiriman-label">Nama Driver</label>
                    <input
                      className="adm-pengiriman-input"
                      placeholder="Nama driver..."
                      defaultValue={order.driverName ?? ""}
                      disabled={updatingId === order.id}
                      onBlur={e => {
                        if (e.target.value !== (order.driverName ?? "")) {
                          updateStatus(order.id, order.statusPengiriman, e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
