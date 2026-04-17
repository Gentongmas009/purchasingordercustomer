import { Router, type IRouter } from "express";
import { SubmitOrderBody } from "@workspace/api-zod";
import { db, ordersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { findOrCreateKledoContact, createKledoInvoice, type KledoInvoiceItem } from "./kledo";

const router: IRouter = Router();

function formatRupiah(num: number): string {
  return num.toLocaleString("id-ID");
}

function cleanPhoneNumber(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("+62")) return cleaned.slice(1);
  if (cleaned.startsWith("62")) return cleaned;
  if (cleaned.startsWith("0")) return "62" + cleaned.slice(1);
  if (cleaned.startsWith("8")) return "62" + cleaned;
  return null;
}

async function kirimWA(target: string, message: string): Promise<boolean> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    logger.warn("FONNTE_TOKEN not set, skipping WA notification");
    return false;
  }
  try {
    const form = new URLSearchParams({ target, message });
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const text = await res.text();
    logger.info({ target, status: res.status, response: text }, "Fonnte WA sent");
    return res.ok;
  } catch (err) {
    logger.error({ err, target }, "Failed to send WA via Fonnte");
    return false;
  }
}

// GET /orders — daftar semua order (halaman admin)
router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

// POST /orders — terima order baru
router.post("/orders", async (req, res): Promise<void> => {
  // Proses items array jika ada (multi-produk)
  interface RawItem { namaProduk: string; jumlahProduk: number; hargaProduk: number; kledoProductId?: number; kledoUnitId?: number }
  const rawItems: RawItem[] = Array.isArray(req.body.items) ? req.body.items : [];

  let bodyToValidate = req.body;
  if (rawItems.length > 0) {
    const totalQty = rawItems.reduce((s, i) => s + (Number(i.jumlahProduk) || 1), 0);
    const totalProductPrice = rawItems.reduce((s, i) => s + (Number(i.hargaProduk) || 0) * (Number(i.jumlahProduk) || 1), 0);
    const namaProduk = rawItems.length === 1
      ? rawItems[0].namaProduk
      : rawItems.map((it, idx) => `${idx + 1}. ${it.namaProduk} (${it.jumlahProduk}x @ Rp ${formatRupiah(Number(it.hargaProduk))})`).join("\n");
    bodyToValidate = { ...req.body, namaProduk, jumlahProduk: totalQty, hargaProduk: totalProductPrice };
  }

  const parsed = SubmitOrderBody.safeParse(bodyToValidate);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const orderId = randomUUID().slice(0, 8).toUpperCase();
  const namaToko = process.env.NAMA_TOKO ?? "Toko Kami";
  const adminWA = process.env.ADMIN_WA_NUMBER ?? "";
  const ongkir = d.biayaPengiriman ?? 0;
  const total = d.hargaProduk * d.jumlahProduk + ongkir;

  req.log.info({ orderId, namaKontak: d.namaKontak }, "New purchase order received");

  // Simpan ke database
  await db.insert(ordersTable).values({
    orderId,
    namaKontak:           d.namaKontak,
    nomorTelepon:         d.nomorTelepon,
    alamat:               d.alamat,
    patokanLokasi:        d.patokanLokasi,
    namaProduk:           d.namaProduk,
    jumlahProduk:         d.jumlahProduk,
    hargaProduk:          d.hargaProduk,
    biayaPengiriman:      d.biayaPengiriman ?? null,
    totalHarga:           total,
    salesPerson:          d.salesPerson,
    metodePembayaran:     d.metodePembayaran,
    keteranganPembayaran: d.keteranganPembayaran ?? null,
    whatsappSent:         "false",
  });

  const infoRekening = d.metodePembayaran === "Transfer"
    ? `\n🏦 *Rekening Pembayaran*\n` +
      `Silahkan lakukan pembayaran sebelum *1×24 jam* ke salah satu rekening:\n\n` +
      `• *BRI*\n  0262 01 000031 562\n  a.n. DIAN PURNAMA REZA T.\n\n` +
      `• *MANDIRI*\n  136 000 4780612\n  a.n. DIAN PURNAMA\n\n` +
      `• *BCA (GIRO)*\n  155 91 99999\n  a.n. INDARTO WIBOWO\n\n` +
      `• *BNI*\n  0822 705 836\n  a.n. INDARTO WIBOWO\n`
    : "";

  const pesanPelanggan =
    `📦 *INVOICE PESANAN* #${orderId}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `${namaToko}\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Halo *${d.namaKontak}* 👋\n` +
    `Terima kasih sudah memesan!\n` +
    `Berikut detail pesanan kamu:\n\n` +
    `🛒 *Detail Produk*\n` +
    `Produk  : ${d.namaProduk}\n` +
    `Jumlah  : ${d.jumlahProduk} unit\n` +
    `Harga   : Rp ${formatRupiah(d.hargaProduk)}\n` +
    (ongkir ? `Ongkir  : Rp ${formatRupiah(ongkir)}\n` : "") +
    `*Total   : Rp ${formatRupiah(total)}*\n\n` +
    `💳 *Pembayaran*\n` +
    `Metode  : ${d.metodePembayaran}\n` +
    (d.keteranganPembayaran ? `Status  : ${d.keteranganPembayaran}\n` : "") +
    infoRekening +
    `\n📍 *Pengiriman*\n` +
    `Alamat  : ${d.alamat}\n` +
    (d.patokanLokasi ? `Patokan : ${d.patokanLokasi}\n` : "") +
    `\n━━━━━━━━━━━━━━━━━━━\n` +
    `Pesanan sedang diproses. Terima kasih! 🙏`;

  const pesanAdmin =
    `🔔 *ORDER BARU!* #${orderId}\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Data Pelanggan*\n` +
    `Nama    : ${d.namaKontak}\n` +
    `Telepon : ${d.nomorTelepon}\n` +
    `Alamat  : ${d.alamat}\n` +
    (d.patokanLokasi ? `Patokan : ${d.patokanLokasi}\n` : "") +
    `\n🛒 *Detail Order*\n` +
    `Produk  : ${d.namaProduk}\n` +
    `Jumlah  : ${d.jumlahProduk} unit\n` +
    `Harga   : Rp ${formatRupiah(d.hargaProduk)}\n` +
    (ongkir ? `Ongkir  : Rp ${formatRupiah(ongkir)}\n` : "") +
    `*Total   : Rp ${formatRupiah(total)}*\n\n` +
    `💳 *Pembayaran*\n` +
    `Metode  : ${d.metodePembayaran}\n` +
    (d.keteranganPembayaran ? `Ket     : ${d.keteranganPembayaran}\n` : "") +
    `\n🧑 Sales   : ${d.salesPerson}`;

  let whatsappSent = false;

  const nomorPelanggan = cleanPhoneNumber(d.nomorTelepon);
  if (nomorPelanggan) {
    const sent = await kirimWA(nomorPelanggan, pesanPelanggan);
    whatsappSent = sent;
  }

  if (adminWA) {
    await kirimWA(adminWA, pesanAdmin);
    whatsappSent = true;
  }

  // Update status WA di database
  await db
    .update(ordersTable)
    .set({ whatsappSent: whatsappSent ? "true" : "false" })
    .where(eq(ordersTable.orderId, orderId));

  // Buat invoice di Kledo
  let kledoInvoiceId: number | undefined;
  let kledoInvoiceNumber: string | undefined;

  // Susun daftar item untuk Kledo (dari items array atau single product)
  const kledoItems: KledoInvoiceItem[] = rawItems.length > 0
    ? rawItems
        .filter(i => typeof i.kledoProductId === "number" && i.kledoProductId > 0)
        .map(i => ({
          kledoProductId: i.kledoProductId!,
          kledoUnitId: typeof i.kledoUnitId === "number" ? i.kledoUnitId : 73,
          jumlahProduk: Number(i.jumlahProduk) || 1,
          hargaProduk: Number(i.hargaProduk) || 0,
        }))
    : (() => {
        const pid = typeof req.body.kledoProductId === "number" ? req.body.kledoProductId : null;
        if (!pid) return [];
        return [{ kledoProductId: pid, kledoUnitId: typeof req.body.kledoUnitId === "number" ? req.body.kledoUnitId : 73, jumlahProduk: d.jumlahProduk, hargaProduk: d.hargaProduk }];
      })();

  if (kledoItems.length > 0 && process.env.KLEDO_TOKEN) {
    try {
      const contactId = await findOrCreateKledoContact(d.namaKontak, d.nomorTelepon, d.alamat);
      if (contactId) {
        const memo = `Order #${orderId} via form PO\nSales: ${d.salesPerson}\nAlamat: ${d.alamat}${d.patokanLokasi ? "\nPatokan: " + d.patokanLokasi : ""}\nMetode: ${d.metodePembayaran}${d.keteranganPembayaran ? "\nKet: " + d.keteranganPembayaran : ""}`;
        const inv = await createKledoInvoice({
          contactId,
          orderId,
          items: kledoItems,
          biayaPengiriman: ongkir,
          memo,
        });
        if (inv.success) {
          kledoInvoiceId = inv.invoiceId;
          kledoInvoiceNumber = inv.invoiceNumber;
          req.log.info({ orderId, kledoInvoiceId, kledoInvoiceNumber }, "Kledo invoice created");
        }
      }
    } catch (err) {
      logger.error({ err, orderId }, "Kledo invoice creation error — order tetap tersimpan");
    }
  }

  res.status(201).json({
    success: true,
    message: "Order berhasil dikirim!",
    orderId,
    whatsappSent,
    kledoInvoiceId,
    kledoInvoiceNumber,
  });
});

export default router;
