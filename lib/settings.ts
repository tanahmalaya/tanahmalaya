import { prisma } from "@/lib/prisma";

const DEFAULT_YURAN_KEAHLIAN_SEN = 2000; // RM20.00 (nilai asal jika belum diset dalam dashboard)

export async function getYuranKeahlianSen(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "yuran_keahlian_sen" } });
  if (!setting) return DEFAULT_YURAN_KEAHLIAN_SEN;
  const value = parseInt(setting.value, 10);
  return isNaN(value) ? DEFAULT_YURAN_KEAHLIAN_SEN : value;
}

export async function setYuranKeahlianSen(sen: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "yuran_keahlian_sen" },
    update: { value: String(sen) },
    create: { key: "yuran_keahlian_sen", value: String(sen) },
  });
}
