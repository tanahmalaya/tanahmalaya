export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextMemberNo } from "@/lib/members";
import { applyOrderPaymentResult } from "@/lib/orderPayment";

// BayarCash akan hantar POST ke sini selepas pembayaran selesai/gagal.
// Rujuk dokumentasi rasmi BayarCash untuk nama field sebenar (payload di
// bawah adalah rangka asas - sesuaikan ikut format sebenar mereka).
export async function POST(req: NextRequest) {
  const payload = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;

  // Nota: pengesahan checksum callback dibuang buat sementara (sama sebab
  // dengan checksum outgoing) - algoritma tepat BayarCash tak dapat disahkan
  // sepenuhnya. Boleh ditambah semula selepas sahkan dengan BayarCash support.

  const { order_number: orderId, status } = payload;
  const isPaid = status === "3" || status === "success"; // sesuaikan ikut kod status BayarCash sebenar

  // Cuba padan dengan pendaftaran keahlian yang MASIH menunggu bayaran
  const pending = await prisma.pendingRegistration.findUnique({ where: { id: orderId } });
  if (pending) {
    if (isPaid) {
      // Bayaran BERJAYA - baru cipta rekod Member sebenar dalam Supabase
      const existing = await prisma.member.findUnique({ where: { icNumber: pending.icNumber } });
      if (!existing) {
        await prisma.member.create({
          data: {
            memberNo: await nextMemberNo(pending.memberType),
            fullName: pending.fullName,
            icNumber: pending.icNumber,
            phone: pending.phone,
            email: pending.email,
            type: pending.memberType,
            akuanSelangor: pending.akuanSelangor,
            // Kedua-dua jenis ahli wajib disahkan admin dulu sebelum AKTIF:
            // Ahli PLT - bermastautin/berdaftar mengundi Selangor.
            // Ahli Bersekutu - kelayakan agama (terbuka untuk umat Islam sahaja).
            status: "MENUNGGU_SEMAKAN",
            paymentRef: payload.transaction_id ?? null,
          },
        });
      }
      // Padam rekod sementara - dah tak diperlukan
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    } else {
      // Bayaran GAGAL - padam rekod sementara, tiada Member dicipta
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    }
    return NextResponse.json({ ok: true });
  }

  // Kalau bukan pendaftaran keahlian, cuba padan dengan Order (pembelian Merchandise)
  // Nota: tempahan kurier EasyParcel TIDAK lagi automatik di sini - staff akan
  // "Fulfill" secara berkumpulan dari dashboard /admin/orders.
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order) {
    const result = await applyOrderPaymentResult(orderId, isPaid, payload.transaction_id ?? null);
    if (!result.applied) {
      return NextResponse.json({ ok: true, skipped: result.reason });
    }
    return NextResponse.json({ ok: true });
  }

  // Kalau bukan pendaftaran keahlian/merchandise, cuba padan dengan pendaftaran Program & Kelas
  const registration = await prisma.classRegistration.findUnique({ where: { id: orderId } });
  if (registration) {
    // Jangan downgrade balik ke GAGAL kalau dah BERJAYA (cth. percubaan bayaran
    // pertama gagal, kedua berjaya - callback boleh sampai tak ikut turutan).
    if (registration.status !== "BERJAYA") {
      await prisma.classRegistration.update({
        where: { id: orderId },
        data: {
          status: isPaid ? "BERJAYA" : "GAGAL",
          bayarcashRef: payload.transaction_id ?? null,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Kalau bukan salah satu di atas, cuba padan dengan Sumbangan Ikhlas
  const donation = await prisma.donation.findUnique({ where: { id: orderId } });
  if (donation) {
    if (donation.status !== "BERJAYA") {
      await prisma.donation.update({
        where: { id: orderId },
        data: {
          status: isPaid ? "BERJAYA" : "GAGAL",
          bayarcashRef: payload.transaction_id ?? null,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Order tidak ditemui" }, { status: 404 });
}
