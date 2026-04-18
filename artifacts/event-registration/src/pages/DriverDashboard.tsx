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
  totalHarga: number;
  biayaPengiriman: number | null;
  statusPengiriman: string;
  driverName: string | null;
  createdAt: string;
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
const STATUS_COLOR: Record<string, string> = {
  Menunggu: "#f59e0b",
  Diproses: "#3b82f6",
  Dikirim: "#8b5cf6",
  Selesai: "#10b981",
  Dibatalkan: "#ef4444",
};
const NEXT_STATUS: Record<string, string | null> = {
  Menunggu:   "Diproses",
  Diproses:   "Dikirim",
  Dikirim:    "Selesai",
  Selesai:    null,
  Dibatalkan: null,
};
const NEXT_LABEL: Record<string, string> = {
  Menunggu: "▶ Mulai Proses",
  Diproses: "🚚 Tandai Dikirim",
  Dikirim:  "✅ Selesai",
};

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function DriverDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"aktif" | "selesai">("aktif");

  const fetchOrders = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${baseUrl}/api/orders`);
      if (!res.ok) throw new Error("Gagal memuat data");
      setOrders(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await fetch(`${baseUrl}/api/orders/${id}/pengiriman`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPengiriman: status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, statusPengiriman: status } : o));
    } finally { setUpdatingId(null); }
  };

  const aktif = orders.filter(o => !["Selesai", "Dibatalkan"].includes(o.statusPengiriman));
  const selesai = orders.filter(o => ["Selesai", "Dibatalkan"].includes(o.statusPengiriman));
  const displayed = filter === "aktif" ? aktif : selesai;

  return (
    <div className="adm-bg">
      <div className="adm-wrap">
        <div className="adm-header">
          <div>
            <h1 className="adm-title">🚚 Dashboard Driver</h1>
            <p className="adm-sub">Daftar pengiriman yang perlu ditangani</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="adm-refresh" onClick={fetchOrders}>🔄 Refresh</button>
            <button className="adm-refresh" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={onLogout}>Keluar</button>
          </div>
        </div>

        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-val">{aktif.length}</div>
            <div className="adm-stat-label">Perlu Ditangani</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.filter(o => o.statusPengiriman === "Dikirim").length}</div>
            <div className="adm-stat-label">Sedang Dikirim</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{selesai.filter(o => o.statusPengiriman === "Selesai").length}</div>
            <div className="adm-stat-label">Selesai Hari Ini</div>
          </div>
        </div>

        <div className="adm-tabs">
          <button className={`adm-tab${filter === "aktif" ? " adm-tab--active" : ""}`} onClick={() => setFilter("aktif")}>
            ⚡ Aktif ({aktif.length})
          </button>
          <button className={`adm-tab${filter === "selesai" ? " adm-tab--active" : ""}`} onClick={() => setFilter("selesai")}>
            ✅ Selesai ({selesai.length})
          </button>
        </div>

        {loading ? (
          <div className="adm-empty">⏳ Memuat data...</div>
        ) : error ? (
          <div className="adm-empty adm-error">⚠️ {error}</div>
        ) : displayed.length === 0 ? (
          <div className="adm-empty">{filter === "aktif" ? "🎉 Semua pengiriman selesai!" : "Belum ada pengiriman selesai"}</div>
        ) : (
          <div className="adm-list">
            {displayed.map(order => {
              const nextStatus = NEXT_STATUS[order.statusPengiriman];
              return (
                <div key={order.id} className="adm-card">
                  <div className="adm-card-top">
                    <div>
                      <div className="adm-card-id">#{order.orderId}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{formatDate(order.createdAt)}</div>
                    </div>
                    <span style={{
                      background: STATUS_COLOR[order.statusPengiriman] ?? "#6b7280",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}>{order.statusPengiriman}</span>
                  </div>

                  <div style={{ padding: "8px 12px" }}>
                    <div className="adm-row">
                      <span className="adm-lbl">👤 Penerima</span>
                      <span className="adm-val adm-bold">{order.namaKontak}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">📱 Telepon</span>
                      <span className="adm-val">
                        <a href={`https://wa.me/${order.nomorTelepon.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="adm-walink">{order.nomorTelepon}</a>
                      </span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">📍 Alamat</span>
                      <span className="adm-val">{order.alamat}</span>
                    </div>
                    {order.patokanLokasi && (
                      <div className="adm-row">
                        <span className="adm-lbl">🗺️ Patokan</span>
                        <span className="adm-val">{order.patokanLokasi}</span>
                      </div>
                    )}
                    <div className="adm-row">
                      <span className="adm-lbl">🛒 Produk</span>
                      <span className="adm-val">{order.namaProduk} × {order.jumlahProduk}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">💰 Total</span>
                      <span className="adm-val adm-bold">{formatRupiah(order.totalHarga)}</span>
                    </div>
                  </div>

                  {nextStatus && (
                    <div style={{ padding: "0 12px 12px" }}>
                      <button
                        className="drv-next-btn"
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, nextStatus)}
                      >
                        {updatingId === order.id ? "Memperbarui..." : (NEXT_LABEL[order.statusPengiriman] ?? "Update")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
