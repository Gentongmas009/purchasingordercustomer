import { useState, useEffect } from "react";
import { Router as WouterRouter } from "wouter";
import PurchaseOrderForm from "@/pages/PurchaseOrderForm";
import AdminDashboard from "@/pages/AdminDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import LandingPage from "@/pages/LandingPage";

type View = "landing" | "form" | "admin" | "driver";

function getStoredView(): View {
  const role = sessionStorage.getItem("role");
  const loginAt = sessionStorage.getItem("loginAt");
  if (role && loginAt) {
    const elapsed = Date.now() - Number(loginAt);
    if (elapsed < 8 * 60 * 60 * 1000) {
      return role as View;
    }
    sessionStorage.clear();
  }
  return "landing";
}

function logout() {
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("loginAt");
}

function App() {
  const [view, setView] = useState<View>(getStoredView);

  useEffect(() => {
    const syncView = () => setView(getStoredView());
    window.addEventListener("storage", syncView);
    return () => window.removeEventListener("storage", syncView);
  }, []);

  const handleLogout = () => {
    logout();
    setView("landing");
  };

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      {view === "landing" && (
        <LandingPage
          onForm={() => setView("form")}
          onAdmin={() => setView("admin")}
          onDriver={() => setView("driver")}
        />
      )}
      {view === "form" && (
        <div>
          <button className="lp-back-btn" onClick={() => setView("landing")}>← Kembali</button>
          <PurchaseOrderForm />
        </div>
      )}
      {view === "admin" && (
        <AdminDashboard onLogout={handleLogout} />
      )}
      {view === "driver" && (
        <DriverDashboard onLogout={handleLogout} />
      )}
    </WouterRouter>
  );
}

export default App;
