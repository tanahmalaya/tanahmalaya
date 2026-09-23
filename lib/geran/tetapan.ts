// Tetapan GERAN / LANDHUB yang admin boleh ubah sendiri (Settings), disimpan
// dalam jadual Setting yang dikongsi dengan tanahmalaya.org - semua kunci
// GERAN berawalan "gt_" supaya tak bercampur dengan tetapan PLT.

import { prisma } from "@/lib/prisma";

export type TetapanGT = {
  whatsapp: string; // digit sahaja, format antarabangsa tanpa "+", cth 60123456789
  emel: string;
};

const KUNCI = { whatsapp: "gt_whatsapp", emel: "gt_email" } as const;
const LALAI: TetapanGT = { whatsapp: "", emel: "info@gerantanah.com" };

export async function bacaTetapanGT(): Promise<TetapanGT> {
  const baris = await prisma.setting.findMany({ where: { key: { in: Object.values(KUNCI) } } });
  const nilai = (k: string) => baris.find((b) => b.key === k)?.value;
  return {
    whatsapp: nilai(KUNCI.whatsapp) ?? LALAI.whatsapp,
    emel: nilai(KUNCI.emel) ?? LALAI.emel,
  };
}

export async function simpanTetapanGT(t: TetapanGT): Promise<void> {
  await prisma.$transaction(
    (Object.keys(KUNCI) as (keyof TetapanGT)[]).map((k) =>
      prisma.setting.upsert({
        where: { key: KUNCI[k] },
        update: { value: t[k] },
        create: { key: KUNCI[k], value: t[k] },
      })
    )
  );
}

// Nombor Malaysia seperti orang taip ("012-345 6789", "+6012...") -> digit
// antarabangsa untuk wa.me ("60123456789"). null jika bukan nombor telefon.
export function normalWhatsApp(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = `6${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}
