import { useState } from "react";

interface Props {
  onForm: () => void;
  onAdmin: () => void;
  onDriver: () => void;
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

async function doLogin(role: "admin" | "driver", password: string): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, password }),
  });
  const data = await res.json();
  if (data.ok) {
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("loginAt", Date.now().toString());
    return true;
  }
  return false;
}

function LoginModal({
  role,
  onClose,
  onSuccess,
}: {
  role: "admin" | "driver";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!pw.trim()) { setErr("Masukkan password"); return; }
    setLoading(true);
    setErr("");
    const ok = await doLogin(role, pw);
    setLoading(false);
    if (ok) { onSuccess(); }
    else { setErr("Password salah. Coba lagi."); }
  };

  return (
    <div className="lp-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={e => e.stopPropagation()}>
        <div className="lp-modal-icon">{role === "admin" ? "🔐" : "🚚"}</div>
        <h2 className="lp-modal-title">
          {role === "admin" ? "Login Admin" : "Login Driver"}
        </h2>
        <p className="lp-modal-sub">Masukkan password untuk melanjutkan</p>
        <input
          className={`lp-modal-input${err ? " lp-modal-input--err" : ""}`}
          type="password"
          placeholder="Password"
          value={pw}
          autoFocus
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
        />
        {err && <div className="lp-modal-err">{err}</div>}
        <button className="lp-modal-btn" onClick={handle} disabled={loading}>
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>
        <button className="lp-modal-cancel" onClick={onClose}>Batal</button>
      </div>
    </div>
  );
}

export default function LandingPage({ onForm, onAdmin, onDriver }: Props) {
  const [modal, setModal] = useState<"admin" | "driver" | null>(null);

  return (
    <div className="lp-bg">
      <div className="lp-wrap">
        <div className="lp-hero">
          <div className="lp-logo">🛒</div>
          <h1 className="lp-title">Purchase Order</h1>
          <p className="lp-sub">Sistem manajemen pesanan terpadu</p>
        </div>

        <div className="lp-cards">
          <button className="lp-card lp-card--customer" onClick={onForm}>
            <div className="lp-card-icon">📝</div>
            <div className="lp-card-label">Buat Purchase Order</div>
            <div className="lp-card-desc">Isi form pemesanan produk</div>
          </button>

          <button className="lp-card lp-card--admin" onClick={() => setModal("admin")}>
            <div className="lp-card-icon">📋</div>
            <div className="lp-card-label">Dashboard Admin</div>
            <div className="lp-card-desc">Kelola pesanan & pengiriman</div>
          </button>

          <button className="lp-card lp-card--driver" onClick={() => setModal("driver")}>
            <div className="lp-card-icon">🚚</div>
            <div className="lp-card-label">Dashboard Driver</div>
            <div className="lp-card-desc">Lihat & update status pengiriman</div>
          </button>
        </div>
      </div>

      {modal && (
        <LoginModal
          role={modal}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            modal === "admin" ? onAdmin() : onDriver();
          }}
        />
      )}
    </div>
  );
}
