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
  createdAt: string;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Badge({ sent }: { sent: string }) {
  const ok = sent === "true";
  return (
    <span className={`adm-badge ${ok ? "adm-badge--ok" : "adm-badge--fail"}`}>
      {ok ? "✅ Terkirim" : "❌ Gagal"}
    </span>
  );
}

function PayBadge({ metode }: { metode: string }) {
  const map: Record<string, string> = { CASH: "adm-pay--cash", Debit: "adm-pay--debit", Transfer: "adm-pay--transfer" };
  return <span className={`adm-pay ${map[metode] ?? ""}`}>{metode}</span>;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/api/orders`);
      if (!res.ok) throw new Error("Gagal memuat data");
      setOrders(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error tidak diketahui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o =>
    [o.namaKontak, o.nomorTelepon, o.namaProduk, o.salesPerson, o.orderId]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const totalPendapatan = filtered.reduce((s, o) => s + o.totalHarga, 0);

  return (
    <div className="adm-bg">
      <div className="adm-wrap">

        {/* Header */}
        <div className="adm-header">
          <div>
            <h1 className="adm-title">📋 Daftar Order Masuk</h1>
            <p className="adm-sub">Semua pesanan yang dikirim melalui form Purchase Order</p>
          </div>
          <button className="adm-refresh" onClick={fetchOrders}>🔄 Refresh</button>
        </div>

        {/* Stats */}
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.length}</div>
            <div className="adm-stat-label">Total Order</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{orders.filter(o => o.whatsappSent === "true").length}</div>
            <div className="adm-stat-label">WA Terkirim</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val" style={{ fontSize: "15px" }}>{formatRupiah(totalPendapatan)}</div>
            <div className="adm-stat-label">{search ? "Total Filter" : "Total Pendapatan"}</div>
          </div>
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

        {/* Content */}
        {loading ? (
          <div className="adm-empty">⏳ Memuat data...</div>
        ) : error ? (
          <div className="adm-empty adm-error">⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">{search ? "Tidak ada hasil pencarian" : "Belum ada order masuk"}</div>
        ) : (
          <div className="adm-list">
            {filtered.map(order => (
              <div key={order.id} className="adm-card">
                {/* Card top row */}
                <div className="adm-card-top">
                  <div className="adm-card-id">#{order.orderId}</div>
                  <div className="adm-card-meta">
                    <PayBadge metode={order.metodePembayaran} />
                    <Badge sent={order.whatsappSent} />
                  </div>
                </div>

                <div className="adm-card-grid">
                  {/* Kolom kiri */}
                  <div>
                    <div className="adm-row">
                      <span className="adm-lbl">👤 Nama</span>
                      <span className="adm-val adm-bold">{order.namaKontak}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">📱 Telepon</span>
                      <span className="adm-val">
                        <a href={`https://wa.me/${order.nomorTelepon.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="adm-walink">
                          {order.nomorTelepon}
                        </a>
                      </span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">📍 Alamat</span>
                      <span className="adm-val">{order.alamat}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">🗺️ Patokan</span>
                      <span className="adm-val">{order.patokanLokasi}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">🧑 Sales</span>
                      <span className="adm-val">{order.salesPerson}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">🕐 Waktu</span>
                      <span className="adm-val adm-muted">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Kolom kanan */}
                  <div className="adm-price-col">
                    <div className="adm-row">
                      <span className="adm-lbl">🛒 Produk</span>
                      <span className="adm-val">{order.namaProduk}</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">📦 Jumlah</span>
                      <span className="adm-val">{order.jumlahProduk} unit</span>
                    </div>
                    <div className="adm-row">
                      <span className="adm-lbl">💰 Harga</span>
                      <span className="adm-val">{formatRupiah(order.hargaProduk)}</span>
                    </div>
                    {order.biayaPengiriman ? (
                      <div className="adm-row">
                        <span className="adm-lbl">🚚 Ongkir</span>
                        <span className="adm-val">{formatRupiah(order.biayaPengiriman)}</span>
                      </div>
                    ) : null}
                    {order.keteranganPembayaran ? (
                      <div className="adm-row">
                        <span className="adm-lbl">📝 Ket</span>
                        <span className="adm-val">{order.keteranganPembayaran}</span>
                      </div>
                    ) : null}
                    <div className="adm-total-row">
                      <span>TOTAL</span>
                      <span className="adm-total-val">{formatRupiah(order.totalHarga)}</span>
                    </div>
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
