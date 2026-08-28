import { prisma } from "@/lib/prisma";

const DEFAULT_YURAN_Membership_SEN = 2000; // RM20.00 (nilai asal jika belum diset dalam dashboard)

export async function getYuranMembershipSen(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "yuran_Membership_sen" } });
  if (!setting) return DEFAULT_YURAN_Membership_SEN;
  const value = parseInt(setting.value, 10);
  return isNaN(value) ? DEFAULT_YURAN_Membership_SEN : value;
}

export async function setYuranMembershipSen(sen: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "yuran_Membership_sen" },
    update: { value: String(sen) },
    create: { key: "yuran_Membership_sen", value: String(sen) },
  });
}
