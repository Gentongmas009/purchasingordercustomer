import { Router } from "express";

const router = Router();

router.post("/auth/login", (req, res): void => {
  const { role, password } = req.body as { role?: string; password?: string };

  if (!role || !password) {
    res.status(400).json({ ok: false, error: "Role dan password wajib diisi" });
    return;
  }

  const adminPass  = process.env.ADMIN_PASSWORD  ?? "admin123";
  const driverPass = process.env.DRIVER_PASSWORD ?? "driver123";

  if (role === "admin" && password === adminPass) {
    res.json({ ok: true, role: "admin" });
    return;
  }

  if (role === "driver" && password === driverPass) {
    res.json({ ok: true, role: "driver" });
    return;
  }

  res.status(401).json({ ok: false, error: "Password salah" });
});

export default router;
