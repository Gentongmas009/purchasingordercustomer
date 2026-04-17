import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const KLEDO_BASE = "https://api.kledo.com/api/v1/finance";

function kledoHeaders() {
  return {
    Authorization: `Bearer ${process.env.KLEDO_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

// GET /kledo/products?search=keyword&page=1
router.get("/kledo/products", async (req, res): Promise<void> => {
  const search = (req.query.search as string) || "";
  const page = (req.query.page as string) || "1";

  try {
    const url = `${KLEDO_BASE}/products?per_page=20&page=${page}&search=${encodeURIComponent(search)}`;
    const resp = await fetch(url, { headers: kledoHeaders() });
    const data = await resp.json() as { success: boolean; data: { data: unknown[]; total: number; current_page: number; last_page: number } };

    if (!data.success) {
      res.status(502).json({ error: "Gagal mengambil produk dari Kledo" });
      return;
    }

    res.json({
      products: data.data.data,
      total: data.data.total,
      currentPage: data.data.current_page,
      lastPage: data.data.last_page,
    });
  } catch (err) {
    logger.error({ err }, "Kledo products fetch error");
    res.status(500).json({ error: "Koneksi ke Kledo gagal" });
  }
});

// Helper: cari contact di Kledo berdasarkan nama, buat baru jika tidak ada
export async function findOrCreateKledoContact(namaKontak: string, nomorTelepon: string, alamat: string): Promise<number | null> {
  try {
    // Cari contact dulu
    const searchUrl = `${KLEDO_BASE}/contacts?per_page=5&keyword=${encodeURIComponent(namaKontak)}`;
    const searchResp = await fetch(searchUrl, { headers: kledoHeaders() });
    const searchData = await searchResp.json() as { success: boolean; data: { data: Array<{ id: number; name: string }> } };

    if (searchData.success && searchData.data.data.length > 0) {
      // Pakai contact pertama yang namanya cocok
      const match = searchData.data.data.find(c => c.name.toLowerCase() === namaKontak.toLowerCase());
      if (match) return match.id;
      // Kalau tidak persis sama, pakai yang pertama
      return searchData.data.data[0].id;
    }

    // Buat contact baru
    const createResp = await fetch(`${KLEDO_BASE}/contacts`, {
      method: "POST",
      headers: kledoHeaders(),
      body: JSON.stringify({
        name: namaKontak,
        address: alamat,
        mobile_phone: nomorTelepon,
        type_ids: [1],
      }),
    });
    const createData = await createResp.json() as { success: boolean; data: { id: number } };
    if (createData.success && createData.data?.id) {
      return createData.data.id;
    }

    logger.error({ createData }, "Gagal membuat contact Kledo");
    return null;
  } catch (err) {
    logger.error({ err }, "findOrCreateKledoContact error");
    return null;
  }
}

export interface KledoInvoiceItem {
  kledoProductId: number;
  kledoUnitId: number;
  jumlahProduk: number;
  hargaProduk: number;
}

// Helper: buat invoice di Kledo (mendukung banyak item)
export async function createKledoInvoice(params: {
  contactId: number;
  orderId: string;
  items: KledoInvoiceItem[];
  biayaPengiriman: number;
  memo: string;
}): Promise<{ success: boolean; invoiceId?: number; invoiceNumber?: string }> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const body = {
      contact_id: params.contactId,
      trans_date: today,
      due_date: today,
      memo: params.memo,
      shipping_cost: params.biayaPengiriman || 0,
      include_tax: false,
      items: params.items.map(item => ({
        finance_account_id: item.kledoProductId,
        qty: item.jumlahProduk,
        price: item.hargaProduk,
        unit_id: item.kledoUnitId,
        discount_percent: 0,
        discount_amount: 0,
      })),
    };

    const resp = await fetch(`${KLEDO_BASE}/invoices`, {
      method: "POST",
      headers: kledoHeaders(),
      body: JSON.stringify(body),
    });

    const data = await resp.json() as {
      success: boolean;
      data?: { id: number; ref_number?: string };
      message?: string;
    };

    if (data.success && data.data?.id) {
      return { success: true, invoiceId: data.data.id, invoiceNumber: data.data.ref_number };
    }

    logger.error({ data, body }, "Kledo invoice creation failed");
    return { success: false };
  } catch (err) {
    logger.error({ err }, "createKledoInvoice error");
    return { success: false };
  }
}

export default router;
