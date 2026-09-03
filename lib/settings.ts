import { prisma } from "@/lib/prisma";
import type { MemberType } from "@prisma/client";

const DEFAULT_YURAN_PLT_SEN = 5000; // RM50.00 - Ahli PLT (ahli penuh, wajib)
const DEFAULT_YURAN_BERSEKUTU_SEN = 500; // RM5.00 - Ahli Bersekutu

const SETTING_KEY: Record<MemberType, string> = {
  PLT: "yuran_plt_sen",
  BERSEKUTU: "yuran_bersekutu_sen",
};

const DEFAULT_SEN: Record<MemberType, number> = {
  PLT: DEFAULT_YURAN_PLT_SEN,
  BERSEKUTU: DEFAULT_YURAN_BERSEKUTU_SEN,
};

export async function getYuranSen(type: MemberType): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY[type] } });
  if (!setting) return DEFAULT_SEN[type];
  const value = parseInt(setting.value, 10);
  return isNaN(value) ? DEFAULT_SEN[type] : value;
}

export async function setYuranSen(type: MemberType, sen: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY[type] },
    update: { value: String(sen) },
    create: { key: SETTING_KEY[type], value: String(sen) },
  });
}
