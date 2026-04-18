import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id:                   serial("id").primaryKey(),
  orderId:              text("order_id").notNull().unique(),
  namaKontak:           text("nama_kontak").notNull(),
  nomorTelepon:         text("nomor_telepon").notNull(),
  alamat:               text("alamat").notNull(),
  patokanLokasi:        text("patokan_lokasi").notNull(),
  namaProduk:           text("nama_produk").notNull(),
  jumlahProduk:         integer("jumlah_produk").notNull(),
  hargaProduk:          integer("harga_produk").notNull(),
  biayaPengiriman:      integer("biaya_pengiriman"),
  totalHarga:           integer("total_harga").notNull(),
  salesPerson:          text("sales_person").notNull(),
  metodePembayaran:     text("metode_pembayaran").notNull(),
  keteranganPembayaran: text("keterangan_pembayaran"),
  whatsappSent:         text("whatsapp_sent").default("false"),
  statusPengiriman:     text("status_pengiriman").default("Menunggu").notNull(),
  driverName:           text("driver_name"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
